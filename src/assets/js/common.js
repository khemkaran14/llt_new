/* Shared helpers: Indian number formatting, number inputs, mobile menu. */
(function () {
  'use strict';

  var inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  window.LLT = {
    // ₹12,34,567
    money: function (v) {
      var x = Math.round(Number(v) || 0);
      return (x < 0 ? '−₹' : '₹') + inr.format(Math.abs(x));
    },
    num: function (v) { return inr.format(Math.round(Number(v) || 0)); },
    // ₹12.3 L / ₹1.2 Cr
    short: function (v) {
      var x = Number(v) || 0, sign = x < 0 ? '−' : '', a = Math.abs(x);
      if (a >= 1e7) return sign + '₹' + (a / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
      if (a >= 1e5) return sign + '₹' + (a / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
      return sign + '₹' + inr.format(Math.round(a));
    },
    pct: function (v, d) { return ((Number(v) || 0) * 100).toFixed(d == null ? 1 : d) + '%'; },
    // Read a formatted money input ("12,00,000") as a number.
    read: function (el) {
      if (!el) return 0;
      var x = parseFloat(String(el.value).replace(/[^0-9.]/g, ''));
      return isFinite(x) ? x : 0;
    },
    // Keep money inputs formatted with Indian commas as the user types.
    formatMoneyInput: function (el) {
      el.addEventListener('input', function () {
        var raw = el.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
        var fromEnd = el.value.length - (el.selectionStart || 0);
        el.value = raw ? inr.format(Number(raw)) : '';
        var pos = Math.max(0, el.value.length - fromEnd);
        try { el.setSelectionRange(pos, pos); } catch (e) { /* not focused */ }
      });
      if (el.value) el.value = inr.format(Number(String(el.value).replace(/[^0-9]/g, '')));
    },
    debounce: function (fn, ms) {
      var t;
      return function () { clearTimeout(t); t = setTimeout(fn, ms || 120); };
    },
    store: {
      get: function (k) { try { return JSON.parse(localStorage.getItem('llt:' + k)); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem('llt:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
    },

    /*
     * Wire up a calculator form:
     *  - inputs with data-money get Indian comma formatting
     *  - <input type="range" data-for="id"> stays in sync with input #id
     *  - [data-key] fields are read/written by values()/fill() and saved per page
     *  - <div class="seg" data-key="x"> button groups act like a select
     * Calls update() on every change. Returns { values, fill }.
     */
    calc: function (form, update, storeKey) {
      var L = window.LLT;
      var keyed = form.querySelectorAll('[data-key]');
      form.querySelectorAll('[data-money]').forEach(L.formatMoneyInput);
      form.querySelectorAll('input[type="range"][data-for]').forEach(function (range) {
        var box = document.getElementById(range.dataset.for);
        var money = box.hasAttribute('data-money');
        range.addEventListener('input', function () { box.value = money ? L.num(range.value) : range.value; run(); });
        box.addEventListener('input', function () { range.value = money ? L.read(box) : box.value; });
      });
      form.querySelectorAll('.seg[data-key]').forEach(function (seg) {
        seg.addEventListener('click', function (e) {
          var b = e.target.closest('button');
          if (!b) return;
          setSeg(seg, b.dataset.value);
          run();
        });
      });
      function setSeg(seg, v) {
        seg.dataset.value = v;
        seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.value === v ? 'true' : 'false'); });
      }
      function values() {
        var o = {};
        keyed.forEach(function (el) {
          var k = el.dataset.key;
          if (el.classList.contains('seg')) o[k] = el.dataset.value;
          else if (el.type === 'checkbox') o[k] = el.checked;
          else if (el.hasAttribute('data-money')) o[k] = L.read(el);
          else if (el.type === 'number' || el.type === 'range') o[k] = parseFloat(el.value) || 0;
          else o[k] = el.value;
        });
        return o;
      }
      function fill(o) {
        if (!o) return;
        keyed.forEach(function (el) {
          var k = el.dataset.key;
          if (!(k in o) || o[k] == null) return;
          if (el.classList.contains('seg')) setSeg(el, String(o[k]));
          else if (el.type === 'checkbox') el.checked = o[k] === true || o[k] === '1' || o[k] === 'true';
          else if (el.hasAttribute('data-money')) el.value = Number(o[k]) ? L.num(o[k]) : '';
          else el.value = o[k];
        });
        form.querySelectorAll('input[type="range"][data-for]').forEach(function (range) {
          var box = document.getElementById(range.dataset.for);
          range.value = box.hasAttribute('data-money') ? L.read(box) : box.value;
        });
      }
      function run() {
        update(values());
        if (storeKey) L.store.set(storeKey, values());
      }
      form.addEventListener('input', L.debounce(run, 80));
      form.addEventListener('change', run);

      // Start from a shared link, else the last values used on this device.
      var params = new URLSearchParams(location.search), fromUrl = {}, has = false;
      params.forEach(function (v, k) { fromUrl[k] = v; has = true; });
      fill(has ? fromUrl : (storeKey ? L.store.get(storeKey) : null));

      var share = document.querySelector('[data-share]');
      if (share) share.addEventListener('click', function () {
        var v = values(), q = new URLSearchParams();
        Object.keys(v).forEach(function (k) { if (v[k] === true) q.set(k, '1'); else if (v[k] !== false && v[k] !== '' && v[k] != null) q.set(k, v[k]); });
        var url = location.origin + location.pathname + '?' + q;
        var label = share.textContent;
        var done = function () { share.textContent = 'Link copied ✓'; setTimeout(function () { share.textContent = label; }, 2000); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
        else prompt('Copy this link:', url);
      });

      run();
      return { values: values, fill: fill, run: run };
    },

    // Set a donut chart's second ring to `share` (0–1).
    donut: function (circle, share) {
      var s = Math.max(0, Math.min(1, share || 0)) * 100;
      circle.setAttribute('stroke-dasharray', s.toFixed(2) + ' ' + (100 - s).toFixed(2));
    },

    set: function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  };

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  // Inside another website: open our links in a new tab.
  if (document.documentElement.classList.contains('embed')) {
    document.querySelectorAll('a[href]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
  }

  // Highlight current page
  var here = location.pathname;
  document.querySelectorAll('.site-nav a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
})();
