(function () {
  'use strict';

  const STORAGE_KEY = 'wcDropEnabled';
  const toggle = document.getElementById('toggleEnabled');
  const openSettingsBtn = document.getElementById('openSettings');

  function storageGet(keys, cb) {
    chrome.storage.sync.get(keys, function (r) {
      if (chrome.runtime.lastError) {
        chrome.storage.local.get(keys, cb);
      } else {
        cb(r);
      }
    });
  }

  function storageSet(obj, cb) {
    chrome.storage.sync.set(obj, function () {
      if (chrome.runtime.lastError) {
        chrome.storage.local.set(obj, cb || function () {});
      } else if (cb) {
        cb();
      }
    });
  }

  storageGet([STORAGE_KEY], function (r) {
    toggle.checked = r[STORAGE_KEY] !== false;
  });

  toggle.addEventListener('change', function () {
    storageSet({ [STORAGE_KEY]: toggle.checked });
  });

  openSettingsBtn.addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
  });
})();
