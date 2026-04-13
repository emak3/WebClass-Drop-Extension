(function () {
  'use strict';

  const STORAGE_ORIGINS = 'wcDropOrigins';

  function scriptIdFromOrigin(origin) {
    let h = 0;
    for (let i = 0; i < origin.length; i++) {
      h = (Math.imul(31, h) + origin.charCodeAt(i)) | 0;
    }
    const safe = origin.replace(/[^a-zA-Z0-9]/g, '_');
    return ('wcdrop_' + (h >>> 0).toString(16) + '_' + safe).slice(0, 200);
  }

  function matchesForOrigin(origin) {
    const base = origin.replace(/\/$/, '');
    return [
      base + '/webclass/*',
      base + '/*/webclass/*',
      base + '/WebClass/*',
      base + '/*/WebClass/*',
    ];
  }

  function storageGetOrigins(cb) {
    chrome.storage.sync.get([STORAGE_ORIGINS], function (r) {
      if (chrome.runtime.lastError) {
        chrome.storage.local.get([STORAGE_ORIGINS], function (r2) {
          cb(r2[STORAGE_ORIGINS] || []);
        });
      } else {
        cb(r[STORAGE_ORIGINS] || []);
      }
    });
  }

  async function syncContentScriptsFromStorage() {
    let registered;
    try {
      registered = await chrome.scripting.getRegisteredContentScripts();
    } catch (e) {
      return;
    }
    const wcdropIds = registered.filter(function (s) {
      return s.id.indexOf('wcdrop_') === 0;
    }).map(function (s) {
      return s.id;
    });
    if (wcdropIds.length) {
      try {
        await chrome.scripting.unregisterContentScripts({ ids: wcdropIds });
      } catch (e) {}
    }

    const origins = await new Promise(function (resolve) {
      storageGetOrigins(resolve);
    });

    for (let i = 0; i < origins.length; i++) {
      const origin = origins[i];
      const ok = await new Promise(function (resolve) {
        chrome.permissions.contains({ origins: [origin + '/*'] }, resolve);
      });
      if (!ok) continue;
      try {
        await chrome.scripting.registerContentScripts([
          {
            id: scriptIdFromOrigin(origin),
            matches: matchesForOrigin(origin),
            js: ['content/content.js'],
            css: ['content/content.css'],
            runAt: 'document_idle',
            allFrames: true,
          },
        ]);
      } catch (e) {
        console.warn('[WebClass Drop] registerContentScripts', origin, e);
      }
    }
  }

  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
      chrome.runtime.openOptionsPage();
    }
    syncContentScriptsFromStorage();
  });

  chrome.runtime.onStartup.addListener(function () {
    syncContentScriptsFromStorage();
  });

  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'sync' && area !== 'local') return;
    if (!changes[STORAGE_ORIGINS]) return;
    syncContentScriptsFromStorage();
  });
})();

