(function () {
  'use strict';

  const STORAGE_KEY = 'wcDropEnabled';
  const ATTR = 'data-wc-drop-enhanced';

  const EXT_MAP = {
    doc: 'Word',
    docx: 'Word',
    docm: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    xlsm: 'Excel',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    pptm: 'PowerPoint',
    txt: 'Text',
    pdf: 'PDF',
  };

  const IMAGE_EXT = {
    jpg: 1,
    jpeg: 1,
    png: 1,
    gif: 1,
    webp: 1,
    bmp: 1,
    svg: 1,
  };

  function getExtension(name) {
    const i = name.lastIndexOf('.');
    if (i <= 0) return '';
    return name.slice(i + 1).toLowerCase();
  }

  function getReportFileType(fileName) {
    const ext = getExtension(fileName);
    return EXT_MAP[ext] || '';
  }

  function getPreviewKind(file) {
    if (!file) return 'doc';
    const mime = (file.type || '').toLowerCase();
    if (mime === 'application/pdf') return 'pdf';
    if (mime.indexOf('image/') === 0) return 'image';
    const ext = getExtension(file.name);
    if (ext === 'pdf') return 'pdf';
    if (IMAGE_EXT[ext]) return 'image';
    return 'doc';
  }

  function getDocPreviewClass(fileName) {
    const ext = getExtension(fileName);
    if (['doc', 'docx', 'docm'].indexOf(ext) >= 0) return 'word';
    if (['xls', 'xlsx', 'xlsm'].indexOf(ext) >= 0) return 'excel';
    if (['ppt', 'pptx', 'pptm'].indexOf(ext) >= 0) return 'ppt';
    return 'generic';
  }

  function getDocPreviewLetter(fileName) {
    const k = getDocPreviewClass(fileName);
    if (k === 'word') return 'W';
    if (k === 'excel') return 'X';
    if (k === 'ppt') return 'P';
    const ext = getExtension(fileName);
    return ext.length ? ext.charAt(0).toUpperCase() : '?';
  }

  function getDocPreviewHint(fileName) {
    const k = getDocPreviewClass(fileName);
    if (k === 'word' || k === 'excel' || k === 'ppt') {
      return 'Word / Excel / PowerPoint の本文はブラウザでは開けません。名前とサイズをご確認ください。';
    }
    return 'このファイルは内容のプレビューがありません。名前とサイズをご確認ください。';
  }

  function clearFileInput(input) {
    const dt = new DataTransfer();
    input.files = dt.files;
    try {
      input.value = '';
    } catch (e) {}
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function checkExtension(acceptableFileType, fileName) {
    const ft = getReportFileType(fileName);
    if (acceptableFileType.length === 0) return true;
    if (!ft) return false;
    return acceptableFileType.indexOf(ft) >= 0;
  }

  const REPORT_TYPE_ACCEPT = {
    PDF: '.pdf,application/pdf',
    Word:
      '.doc,.docm,.docx,application/msword,application/vnd.ms-word,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    Excel:
      '.xls,.xlsm,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    PowerPoint:
      '.ppt,.pptm,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    Text: '.txt,text/plain',
  };

  function parseDataTypeLimitAttr(raw) {
    if (!raw || typeof raw !== 'string') return [];
    const out = [];
    const seen = {};
    const canon = ['PDF', 'Word', 'Excel', 'PowerPoint', 'Text'];
    raw.split(',').forEach(function (part) {
      const t = part.trim();
      if (canon.indexOf(t) >= 0 && !seen[t]) {
        seen[t] = 1;
        out.push(t);
      }
    });
    return out;
  }

  function tipTokenToReportType(s) {
    if (!s) return '';
    const canon = { PDF: 1, Word: 1, Excel: 1, PowerPoint: 1, Text: 1 };
    if (canon[s]) return s;
    const low = s.toLowerCase();
    if (low === 'pdf') return 'PDF';
    if (low === 'word' || s.indexOf('ワード') >= 0) return 'Word';
    if (low === 'excel' || s.indexOf('エクセル') >= 0) return 'Excel';
    if (low.indexOf('powerpoint') >= 0 || s.indexOf('パワーポイント') >= 0 || s.indexOf('パワポ') >= 0)
      return 'PowerPoint';
    if (low === 'text' || s.indexOf('テキスト') >= 0) return 'Text';
    return '';
  }

  function parseTipsAllowedTypes(fieldset) {
    if (!fieldset) return [];
    const out = [];
    const seen = {};
    const nodes = fieldset.querySelectorAll('.tips, p.tips');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const fullText = (el.textContent || '').replace(/\s+/g, ' ');
      if (!/指定\s*された\s*型式|型式のファイル|受け付けます/.test(fullText)) continue;
      const bs = el.querySelectorAll('b');
      for (let j = 0; j < bs.length; j++) {
        const raw = (bs[j].textContent || '').trim();
        if (!raw) continue;
        raw.split(/[,、，\/|｜]/).forEach(function (piece) {
          const rt = tipTokenToReportType(piece.trim());
          if (rt && !seen[rt]) {
            seen[rt] = 1;
            out.push(rt);
          }
        });
      }
    }
    return out;
  }

  function inferTypesFromAccept(accept) {
    if (!accept || !String(accept).trim()) return [];
    const out = [];
    const seen = {};
    function add(t) {
      if (t && !seen[t]) {
        seen[t] = 1;
        out.push(t);
      }
    }
    if (/\.pdf|application\/pdf/i.test(accept)) add('PDF');
    if (/\.doc|wordprocessingml|msword/i.test(accept)) add('Word');
    if (/\.xls|spreadsheetml|vnd\.ms-excel/i.test(accept)) add('Excel');
    if (/\.ppt|presentationml|ms-powerpoint/i.test(accept)) add('PowerPoint');
    if (/\.txt|text\/plain/i.test(accept)) add('Text');
    return out;
  }

  function buildAcceptAttribute(allowedTypes) {
    const parts = [];
    allowedTypes.forEach(function (t) {
      if (REPORT_TYPE_ACCEPT[t]) parts.push(REPORT_TYPE_ACCEPT[t]);
    });
    return parts.join(',');
  }

  function syncFileInputAccept(fileInput) {
    const limits = getLimitsForInput(fileInput);
    if (limits.allowedTypes.length > 0) {
      const acc = buildAcceptAttribute(limits.allowedTypes);
      if (acc) fileInput.setAttribute('accept', acc);
    }
  }

  function formatFileSize(bytes) {
    if (typeof bytes !== 'number') return '';
    const Mega = 1024 * 1024;
    const Giga = Mega * 1024;
    if (bytes >= Giga) return (bytes / Giga).toFixed(2) + ' GB';
    if (bytes >= Mega) return (bytes / Mega).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  }

  function getLimitsForInput(fileInput) {
    const fieldset = fileInput.closest('fieldset');
    let maxSize = 314572800;
    let allowedTypes = [];

    if (fieldset && fieldset.getAttribute('data-size-limit')) {
      maxSize = parseInt(fieldset.getAttribute('data-size-limit'), 10) || maxSize;
    } else {
      const form = fileInput.form;
      const maxHidden = form && form.querySelector('input[name="MAX_FILE_SIZE"]');
      if (maxHidden && maxHidden.value) {
        const v = parseInt(maxHidden.value, 10);
        if (!isNaN(v) && v > 0) maxSize = v;
      }
    }

    if (fieldset) {
      allowedTypes = parseDataTypeLimitAttr(fieldset.getAttribute('data-type-limit') || '');
    }
    if (allowedTypes.length === 0 && fieldset) {
      let el = fileInput.parentElement;
      while (el && el !== fieldset) {
        const tl = el.getAttribute && el.getAttribute('data-type-limit');
        if (tl) {
          allowedTypes = parseDataTypeLimitAttr(tl);
          break;
        }
        el = el.parentElement;
      }
    }
    if (allowedTypes.length === 0) {
      allowedTypes = parseDataTypeLimitAttr(fileInput.getAttribute('data-type-limit') || '');
    }
    if (allowedTypes.length === 0 && fieldset) {
      allowedTypes = parseTipsAllowedTypes(fieldset);
    }
    if (allowedTypes.length === 0) {
      allowedTypes = inferTypesFromAccept(fileInput.getAttribute('accept') || '');
    }

    return { maxSize, allowedTypes };
  }

  function validateFile(file, limits) {
    if (!file || file.size < 1) {
      return { ok: false, message: '空のファイルはアップロードできません。' };
    }
    if (file.size > limits.maxSize) {
      return {
        ok: false,
        message:
          'ファイルサイズが上限（' +
          formatFileSize(limits.maxSize) +
          '）を超えています。現在: ' +
          formatFileSize(file.size),
      };
    }
    if (limits.allowedTypes.length > 0 && !checkExtension(limits.allowedTypes, file.name)) {
      return {
        ok: false,
        message:
          'この提出で選べる形式は次のとおりです: ' + limits.allowedTypes.join('、') + '。',
      };
    }
    const ext = getExtension(file.name);
    if (['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt'].indexOf(ext) >= 0 && file.size < 1000) {
      return {
        ok: false,
        message: 'Office ファイルとして無効な可能性があります。正しいファイルを選び直してください。',
      };
    }
    return { ok: true, message: '' };
  }

  function assignFileToInput(fileInput, file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function showToast(message, isError) {
    let host = document.getElementById('wc-drop-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'wc-drop-toast-host';
      document.documentElement.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = 'wc-drop-toast' + (isError ? ' wc-drop-toast--error' : '');
    t.textContent = message;
    host.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add('wc-drop-toast--visible');
    });
    setTimeout(function () {
      t.classList.remove('wc-drop-toast--visible');
      setTimeout(function () {
        t.remove();
      }, 280);
    }, 3200);
  }

  function createDropZone(fileInput) {
    const zone = document.createElement('div');
    zone.className = 'wc-drop-zone';
    zone.setAttribute('role', 'group');
    zone.setAttribute('aria-label', 'ファイルのドロップまたは選択');
    zone.setAttribute('tabindex', '0');
    zone.innerHTML =
      '<div class="wc-drop-zone__inner">' +
      '<span class="wc-drop-zone__icon" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" focusable="false">' +
      '<path fill="currentColor" d="M10 16h4c.55 0 1-.45 1-1v-5h1.59c.89 0 1.34-1.08.71-1.71L12.71 3.7a.996.996 0 0 0-1.41 0L6.71 8.29c-.63.63-.19 1.71.7 1.71H9v5c0 .55.45 1 1 1m-4 2h12c.55 0 1 .45 1 1s-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1"/>' +
      '</svg></span>' +
      '<p class="wc-drop-zone__title">ファイルをここにドラッグ＆ドロップ</p>' +
      '<p class="wc-drop-zone__subtitle">またはクリックして選択</p>' +
      '<div class="wc-drop-zone__preview wc-drop-is-hidden">' +
      '<div class="wc-drop-zone__preview-pdf-branch wc-drop-is-hidden">' +
      '<div class="wc-drop-zone__preview-pdf-shell">' +
      '<iframe class="wc-drop-zone__preview-pdf" title="PDFのプレビュー"></iframe>' +
      '</div></div>' +
      '<img class="wc-drop-zone__preview-img wc-drop-is-hidden" alt="" />' +
      '<div class="wc-drop-zone__preview-doc wc-drop-is-hidden">' +
      '<div class="wc-drop-zone__preview-doc-icon" aria-hidden="true"></div>' +
      '<div class="wc-drop-zone__preview-doc-text">' +
      '<span class="wc-drop-zone__preview-doc-type"></span>' +
      '<span class="wc-drop-zone__preview-doc-meta"></span>' +
      '<span class="wc-drop-zone__preview-doc-hint"></span>' +
      '</div></div></div>' +
      '<div class="wc-drop-zone__file-row wc-drop-is-hidden">' +
      '<p class="wc-drop-zone__file" aria-live="polite"></p>' +
      '<button type="button" class="wc-drop-zone__clear">選択を解除</button>' +
      '</div>' +
      '</div>';

    const fileLabel = zone.querySelector('.wc-drop-zone__file');
    const fileRow = zone.querySelector('.wc-drop-zone__file-row');
    const clearBtn = zone.querySelector('.wc-drop-zone__clear');
    const previewRoot = zone.querySelector('.wc-drop-zone__preview');
    const pdfBranch = zone.querySelector('.wc-drop-zone__preview-pdf-branch');
    const pdfFrame = zone.querySelector('.wc-drop-zone__preview-pdf');
    const imgEl = zone.querySelector('.wc-drop-zone__preview-img');
    const docRoot = zone.querySelector('.wc-drop-zone__preview-doc');
    const docIcon = zone.querySelector('.wc-drop-zone__preview-doc-icon');
    const docTypeEl = zone.querySelector('.wc-drop-zone__preview-doc-type');
    const docMetaEl = zone.querySelector('.wc-drop-zone__preview-doc-meta');
    const docHintEl = zone.querySelector('.wc-drop-zone__preview-doc-hint');

    let dragCounter = 0;
    let previewObjectUrl = null;

    function setHidden(el, on) {
      el.classList.toggle('wc-drop-is-hidden', on);
    }

    function revokePreview() {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
      }
      pdfFrame.removeAttribute('src');
      setHidden(pdfBranch, true);
      imgEl.removeAttribute('src');
      setHidden(imgEl, true);
      setHidden(docRoot, true);
      docIcon.className = 'wc-drop-zone__preview-doc-icon';
      docIcon.textContent = '';
      docHintEl.textContent = '';
    }

    function applyDocPreview(file) {
      const cls = getDocPreviewClass(file.name);
      const label = getReportFileType(file.name) || 'ファイル';
      docIcon.textContent = getDocPreviewLetter(file.name);
      docIcon.className = 'wc-drop-zone__preview-doc-icon wc-drop-zone__preview-doc-icon--' + cls;
      docTypeEl.textContent = label;
      docMetaEl.textContent = formatFileSize(file.size);
      docHintEl.textContent = getDocPreviewHint(file.name);
      setHidden(docRoot, false);
    }

    function updatePreview(file) {
      revokePreview();
      if (!file) {
        setHidden(previewRoot, true);
        return;
      }
      setHidden(previewRoot, false);
      const kind = getPreviewKind(file);
      if (kind === 'pdf') {
        previewObjectUrl = URL.createObjectURL(file);
        pdfFrame.src = previewObjectUrl;
        setHidden(pdfBranch, false);
        return;
      }
      if (kind === 'image') {
        previewObjectUrl = URL.createObjectURL(file);
        imgEl.src = previewObjectUrl;
        imgEl.alt = file.name;
        setHidden(imgEl, false);
        return;
      }
      applyDocPreview(file);
    }

    function setActive(on) {
      zone.classList.toggle('wc-drop-zone--active', on);
    }

    function refreshSelectionUI() {
      const f = fileInput.files && fileInput.files[0];
      fileLabel.textContent = f ? f.name : '';
      setHidden(fileRow, !f);
      updatePreview(f || null);
    }

    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      clearFileInput(fileInput);
      refreshSelectionUI();
      showToast('ファイルの選択を解除しました。', false);
    });

    zone.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      if (e.target.closest('.wc-drop-zone__clear')) return;
      if (e.target.closest('.wc-drop-zone__preview')) return;
      if (e.target.closest('.wc-drop-zone__file-row')) return;
      fileInput.click();
    });

    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    zone.addEventListener('dragenter', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      setActive(true);
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });

    zone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        setActive(false);
      }
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setActive(false);
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      const file = files[0];
      const limits = getLimitsForInput(fileInput);
      const v = validateFile(file, limits);
      if (!v.ok) {
        showToast(v.message, true);
        return;
      }
      assignFileToInput(fileInput, file);
      refreshSelectionUI();
      showToast('「' + file.name + '」をセットしました。提出ボタンでアップロードしてください。', false);
    });

    fileInput.addEventListener('change', function () {
      const f = fileInput.files && fileInput.files[0];
      if (f) {
        const limits = getLimitsForInput(fileInput);
        const v = validateFile(f, limits);
        if (!v.ok) {
          showToast(v.message, true);
          clearFileInput(fileInput);
        }
      }
      refreshSelectionUI();
    });
    refreshSelectionUI();

    return zone;
  }

  function wrapInput(fileInput) {
    if (!fileInput || fileInput.getAttribute(ATTR)) return;
    if (fileInput.type !== 'file') return;
    if (!fileInput.name) return;

    fileInput.setAttribute(ATTR, '1');
    syncFileInputAccept(fileInput);

    const wrapper = document.createElement('div');
    wrapper.className = 'wc-drop-wrapper';

    const parent = fileInput.parentNode;
    if (!parent) return;

    parent.insertBefore(wrapper, fileInput);
    wrapper.appendChild(fileInput);

    const zone = createDropZone(fileInput);
    wrapper.appendChild(zone);

    fileInput.classList.add('wc-drop-native-file');
  }

  function scan() {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(function (inp) {
      const inForm = inp.closest('form');
      if (!inForm) return;
      const method = (inForm.getAttribute('method') || '').toLowerCase();
      const enc = (inForm.getAttribute('enctype') || '').toLowerCase();
      if (method === 'post' && enc.indexOf('multipart') >= 0) {
        wrapInput(inp);
      }
    });
  }

  function initWhenEnabled(enabled) {
    if (!enabled) {
      document.documentElement.classList.remove('wc-drop-extension-on');
      return;
    }
    document.documentElement.classList.add('wc-drop-extension-on');
    scan();
    const obs = new MutationObserver(function () {
      scan();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function readEnabled(done) {
    try {
      chrome.storage.sync.get([STORAGE_KEY], function (r) {
        if (chrome.runtime.lastError) {
          chrome.storage.local.get([STORAGE_KEY], done);
        } else {
          done(r);
        }
      });
    } catch (e) {
      done({});
    }
  }

  function load() {
    readEnabled(function (r) {
      const enabled = r[STORAGE_KEY] !== false;
      initWhenEnabled(enabled);
    });
  }

  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== 'sync' && area !== 'local') return;
      if (!changes[STORAGE_KEY]) return;
      location.reload();
    });
  } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
