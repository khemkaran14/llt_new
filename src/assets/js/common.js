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
      var x = Number(v) || 0;
      if (Math.abs(x) >= 1e7) return '₹' + (x / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
      if (Math.abs(x) >= 1e5) return '₹' + (x / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
      return '₹' + inr.format(Math.round(x));
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
    }
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
  // Highlight current page
  var here = location.pathname;
  document.querySelectorAll('.site-nav a').forEach(function (a) {
    if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
  });
})();
