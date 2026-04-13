(function () {
  'use strict';

  const STORAGE_KEY = 'wcDropEnabled';
  const STORAGE_ORIGINS = 'wcDropOrigins';

  const toggle = document.getElementById('toggleEnabled');
  const originInput = document.getElementById('originInput');
  const addOriginBtn = document.getElementById('addOriginBtn');
  const siteListEl = document.getElementById('siteList');
  const statusEl = document.getElementById('optionsStatus');

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

  function normalizeOriginFromString(raw) {
    let s = (raw || '').trim();
    if (!s) return { error: 'URL を入力してください。' };
    if (!/^https?:\/\//i.test(s)) {
      s = 'https://' + s;
    }
    let u;
    try {
      u = new URL(s);
    } catch (e) {
      return { error: 'URL の形式が正しくありません。' };
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { error: 'http または https のみ対応しています。' };
    }
    if (!u.hostname) {
      return { error: 'ホスト名を含む URL を入力してください。' };
    }
    return { origin: u.origin };
  }

  function setStatus(msg) {
    statusEl.textContent = msg || '';
  }

  function renderOrigins(origins) {
    siteListEl.innerHTML = '';
    if (!origins.length) {
      const p = document.createElement('p');
      p.className = 'site-list__empty';
      p.textContent =
        'まだドメインが追加されていません。WebClass を開いたブラウザのアドレスバーから、https://〜 のドメイン部分をコピーして上に貼り付けてください。';
      siteListEl.appendChild(p);
      return;
    }
    origins.forEach(function (origin) {
      const row = document.createElement('div');
      row.className = 'site-row';
      const url = document.createElement('span');
      url.className = 'site-row__url';
      url.textContent = origin;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'site-row__remove';
      rm.textContent = '削除';
      rm.addEventListener('click', function () {
        removeOrigin(origin);
      });
      row.appendChild(url);
      row.appendChild(rm);
      siteListEl.appendChild(row);
    });
  }

  function loadOrigins() {
    storageGet([STORAGE_ORIGINS], function (r) {
      renderOrigins(r[STORAGE_ORIGINS] || []);
    });
  }

  function addOriginFlow(origin) {
    setStatus('');
    chrome.permissions.request({ origins: [origin + '/*'] }, function (granted) {
      if (!granted) {
        setStatus('ブラウザのダイアログで許可されませんでした。');
        return;
      }
      storageGet([STORAGE_ORIGINS], function (r) {
        const list = (r[STORAGE_ORIGINS] || []).slice();
        if (list.indexOf(origin) >= 0) {
          setStatus('すでにリストにあります。');
          return;
        }
        list.push(origin);
        storageSet({ [STORAGE_ORIGINS]: list }, function () {
          loadOrigins();
          setStatus('追加しました。WebClass のタブを再読み込みしてください。');
          originInput.value = '';
        });
      });
    });
  }

  function removeOrigin(origin) {
    setStatus('');
    chrome.permissions.remove({ origins: [origin + '/*'] }, function () {
      storageGet([STORAGE_ORIGINS], function (r) {
        const list = (r[STORAGE_ORIGINS] || []).filter(function (o) {
          return o !== origin;
        });
        storageSet({ [STORAGE_ORIGINS]: list }, function () {
          loadOrigins();
          setStatus('削除しました。');
        });
      });
    });
  }

  storageGet([STORAGE_KEY], function (r) {
    toggle.checked = r[STORAGE_KEY] !== false;
  });
  loadOrigins();

  toggle.addEventListener('change', function () {
    storageSet({ [STORAGE_KEY]: toggle.checked });
  });

  addOriginBtn.addEventListener('click', function () {
    const parsed = normalizeOriginFromString(originInput.value);
    if (parsed.error) {
      setStatus(parsed.error);
      return;
    }
    addOriginFlow(parsed.origin);
  });

  originInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOriginBtn.click();
    }
  });
})();
