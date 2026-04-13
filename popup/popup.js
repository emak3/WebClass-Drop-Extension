(function () {
  'use strict';

  const STORAGE_KEY = 'wcDropEnabled';
  const toggle = document.getElementById('toggleEnabled');

  function read(cb) {
    chrome.storage.sync.get([STORAGE_KEY], function (r) {
      if (chrome.runtime.lastError) {
        chrome.storage.local.get([STORAGE_KEY], cb);
      } else {
        cb(r);
      }
    });
  }

  function write(val) {
    chrome.storage.sync.set({ [STORAGE_KEY]: val }, function () {
      if (chrome.runtime.lastError) {
        chrome.storage.local.set({ [STORAGE_KEY]: val });
      }
    });
  }

  read(function (r) {
    toggle.checked = r[STORAGE_KEY] !== false;
  });

  toggle.addEventListener('change', function () {
    write(toggle.checked);
  });
})();
