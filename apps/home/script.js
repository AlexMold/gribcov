// Theme: saved choice > browser preference (prefers-color-scheme) > dark default
(function () {
  var root = document.documentElement;
  var saved = localStorage.getItem('theme');
  var pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var theme = saved || pref;
  root.dataset.theme = theme;
  var btn = document.getElementById('theme-toggle');
  btn.textContent = theme === 'dark' ? '\u263E' : '\u2600';
  btn.addEventListener('click', function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    btn.textContent = theme === 'dark' ? '\u263E' : '\u2600';
  });
})();

// ─── Job-fit analyzer ────────────────────────────────────────────────────
// Sends a job posting (text, PDF or link) to /api/job-fit and renders the
// match/gap breakdown. Input caps are enforced here first, so oversized input
// fails immediately without spending a request.
(function () {
  var form = document.getElementById('fit-form');
  if (!form) return;

  var textEl = document.getElementById('fit-text');
  var urlEl = document.getElementById('fit-url');
  var fileEl = document.getElementById('fit-file');
  var statusEl = document.getElementById('fit-status');
  var resultEl = document.getElementById('fit-result');
  var submitEl = document.getElementById('fit-submit');

  var MAX_TEXT = 20000;
  var MAX_PDF = 2 * 1024 * 1024;
  var timers = [];

  function status(message, isError) {
    statusEl.hidden = !message;
    statusEl.textContent = message || '';
    statusEl.className = 'fit-status' + (isError ? ' error' : '');
  }

  function stopLoading() {
    timers.forEach(clearInterval);
    timers = [];
    submitEl.disabled = false;
    submitEl.textContent = 'Analyze fit';
  }

  // Best-effort identity for rate limiting. Not tracking: the value is hashed
  // server-side and only used as a counter key. Cross-browser it will differ,
  // which is why the server also counts per IP.
  function fingerprint() {
    var parts = [
      navigator.userAgent,
      navigator.language,
      (navigator.languages || []).join(','),
      screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.platform || '',
    ];
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 40;
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 100, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('gribcov.me/fit', 2, 15);
      parts.push(canvas.toDataURL());
    } catch (e) {
      /* canvas blocked - still fine, other signals remain */
    }
    var bytes = new TextEncoder().encode(parts.join('|'));
    return crypto.subtle.digest('SHA-256', bytes).then(function (hash) {
      return Array.prototype.map
        .call(new Uint8Array(hash), function (b) {
          return b.toString(16).padStart(2, '0');
        })
        .join('')
        .slice(0, 32);
    });
  }

  function inline(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // Minimal renderer for the fixed output format (h2/h3, bullets, bold).
  function render(markdown) {
    var out = [];
    var inList = false;
    markdown.split('\n').forEach(function (raw) {
      var line = raw.trim();
      if (/^[-*]\s+/.test(line)) {
        if (!inList) {
          out.push('<ul>');
          inList = true;
        }
        out.push('<li>' + inline(line.replace(/^[-*]\s+/, '')) + '</li>');
        return;
      }
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      if (!line) return;
      if (/^#{2,4}\s+/.test(line)) out.push('<h3>' + inline(line.replace(/^#{2,4}\s+/, '')) + '</h3>');
      else out.push('<p>' + inline(line) + '</p>');
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var text = (textEl.value || '').trim();
    var link = (urlEl.value || '').trim();
    var file = fileEl.files && fileEl.files[0];

    // Fail fast on oversized input, before any request is made.
    if (text.length > MAX_TEXT) {
      status('That posting is ' + text.length.toLocaleString() + ' characters - the limit is ' + MAX_TEXT.toLocaleString() + '. Trim it and try again.', true);
      return;
    }
    if (file && file.size > MAX_PDF) {
      status('That PDF is ' + (file.size / 1048576).toFixed(1) + ' MB - the limit is 2 MB.', true);
      return;
    }
    if (!text && !link && !file) {
      status('Paste a job description, add a link, or choose a PDF first.', true);
      return;
    }

    var body = new FormData();
    if (file) body.append('file', file);
    else if (text) body.append('text', text);
    else body.append('url', link);

    submitEl.disabled = true;
    submitEl.textContent = 'Analyzing...';
    resultEl.hidden = true;
    status('Reading the posting...');

    var messages = ['Reading the posting...', 'Comparing with my experience...', 'Checking the gaps...'];
    var step = 0;
    timers.push(
      setInterval(function () {
        step = (step + 1) % messages.length;
        statusEl.textContent = messages[step];
      }, 5000),
    );

    fingerprint()
      .then(function (fp) {
        return fetch('/api/job-fit', { method: 'POST', headers: { 'x-fingerprint': fp }, body: body });
      })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (out) {
        stopLoading();
        if (!out.ok || !out.data.ok) {
          status((out.data && out.data.message) || 'The analysis failed. Try again in a minute.', true);
          return;
        }
        resultEl.innerHTML = render(out.data.markdown);
        resultEl.hidden = false;
        var left = typeof out.data.remaining === 'number' ? out.data.remaining : null;
        status(left === null ? '' : left > 0 ? left + ' of 3 analyses left in this 5-hour window.' : 'That was your last analysis in this 5-hour window.');
      })
      .catch(function () {
        stopLoading();
        status('Network error - try again in a minute.', true);
      });
  });
})();
