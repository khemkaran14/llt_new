/* Homepage: tool search, quick EMI/SIP calculator, latest blog posts and email sign-up. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  function short(n) {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
    return inr(n);
  }

  // ---------- Tool search ----------
  var tools = [];
  try { tools = JSON.parse($('tool-index').textContent); } catch (e) { /* no index */ }
  var q = $('ts-q'), list = $('ts-results'), active = -1, shown = [];
  // Extra words people type that aren't in the tool names
  var ALIAS = { loan: 'emi', marriage: 'biodata', shaadi: 'biodata', rishta: 'biodata', card: 'invitation', kundali: 'kundli', guna: 'kundli', photo: 'passport', signature: 'passport', qr: 'upi', pf: 'epf', pension: 'nps', retire: 'retirement', bigha: 'land', gaj: 'land', tax: 'tax', rent: 'rent', bill: 'invoice', gst: 'gst', mutual: 'sip', fund: 'sip', daughter: 'sukanya' };
  function score(t, words) {
    var hay = (t.n + ' ' + t.b + ' ' + t.c).toLowerCase(), s = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i], a = ALIAS[w];
      if (t.n.toLowerCase().indexOf(w) === 0) s += 6;
      else if (t.n.toLowerCase().indexOf(w) !== -1) s += 4;
      else if (hay.indexOf(w) !== -1) s += 2;
      else if (a && hay.indexOf(a) !== -1) s += 2;
      else return 0;
    }
    return s;
  }
  function renderSearch() {
    var words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { list.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
    shown = tools.map(function (t) { return [score(t, words), t]; }).filter(function (x) { return x[0] > 0; })
      .sort(function (a, b) { return b[0] - a[0]; }).slice(0, 7).map(function (x) { return x[1]; });
    active = shown.length ? 0 : -1;
    list.innerHTML = shown.length ? shown.map(function (t, i) {
      return '<li role="option" id="ts-o' + i + '"' + (i === active ? ' aria-selected="true"' : '') + '><a href="' + t.p + '"><b>' + esc(t.n) + '</b><span>' + esc(t.c) + ' · ' + esc(t.b) + '</span></a></li>';
    }).join('') : '<li class="ts-none">No tool found. Try “tax”, “loan” or “photo”.</li>';
    list.hidden = false; q.setAttribute('aria-expanded', 'true');
    q.setAttribute('aria-activedescendant', active >= 0 ? 'ts-o' + active : '');
  }
  if (q) {
    q.addEventListener('input', renderSearch);
    q.addEventListener('keydown', function (e) {
      if (list.hidden || !shown.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
        [].forEach.call(list.children, function (li, i) { li.setAttribute('aria-selected', i === active ? 'true' : 'false'); });
        q.setAttribute('aria-activedescendant', 'ts-o' + active);
      } else if (e.key === 'Escape') { list.hidden = true; }
    });
    $('tool-search').addEventListener('submit', function (e) {
      e.preventDefault();
      if (shown[active]) location.href = shown[active].p;
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.tool-search')) list.hidden = true; });
  }

  // ---------- Quick calculator ----------
  var C = 2 * Math.PI * 46, tab = 'emi';
  function setArc(frac) { $('qc-arc').setAttribute('stroke-dasharray', (C * frac).toFixed(1) + ' ' + C.toFixed(1)); }
  function val(id) { return Number($(id).value); }
  function calc() {
    if (!$('qc-big')) return;
    if (tab === 'emi') {
      var P = val('qe-p'), r = val('qe-r'), y = val('qe-y');
      var emi = window.EmiEngine ? EmiEngine.emi(P, r, y * 12) : 0, interest = emi * y * 12 - P;
      $('qe-p-o').textContent = short(P); $('qe-r-o').textContent = r.toFixed(2).replace(/0$/, '') + '%'; $('qe-y-o').textContent = y + ' yrs';
      $('qc-k').textContent = 'Monthly EMI'; $('qc-big').textContent = inr(emi);
      $('qc-a-k').textContent = 'Principal'; $('qc-a').textContent = short(P);
      $('qc-b-k').textContent = 'Interest'; $('qc-b').textContent = short(interest);
      setArc(P / (P + interest));
      $('qe-link').href = '/emi-calculator/?amount=' + P + '&rate=' + r + '&tenure=' + y + '&unit=years';
    } else {
      var m = val('qs-m'), sr = val('qs-r'), sy = val('qs-y');
      var res = window.Fin ? Fin.sip({ monthly: m, annualRate: sr, years: sy }) : { invested: 0, value: 0, gains: 0 };
      $('qs-m-o').textContent = inr(m); $('qs-r-o').textContent = sr + '%'; $('qs-y-o').textContent = sy + ' yrs';
      $('qc-k').textContent = 'Value after ' + sy + ' years'; $('qc-big').textContent = short(res.value);
      $('qc-a-k').textContent = 'Invested'; $('qc-a').textContent = short(res.invested);
      $('qc-b-k').textContent = 'Growth'; $('qc-b').textContent = short(res.gains);
      setArc(res.value ? res.invested / res.value : 0);
      $('qs-link').href = '/sip-calculator/?monthly=' + m + '&rate=' + sr + '&years=' + sy;
    }
  }
  document.querySelectorAll('.qc-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-tab');
      document.querySelectorAll('.qc-tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      document.querySelectorAll('.qc-inputs').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== tab; });
      calc();
    });
  });
  document.querySelectorAll('.qc-inputs input').forEach(function (i) { i.addEventListener('input', calc); });
  calc();

  // ---------- Latest blog posts (from the API; the section stays hidden if there are none) ----------
  var box = $('latest-posts');
  if (box && window.fetch) {
    fetch('/api/blog/latest?limit=3').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.posts || !j.posts.length) return;
      $('latest-list').innerHTML = j.posts.map(function (p) {
        return '<a class="card post-card" href="' + esc(p.url) + '">' +
          (p.cover ? '<img src="' + esc(p.cover) + '" alt="' + esc(p.coverAlt) + '" loading="lazy" width="400" height="210">' : (p.placeholder || '')) +
          '<div class="post-card-body"><span class="post-meta">' + esc(p.date) + ' · ' + p.minutes + ' min read</span><h3>' + esc(p.title) + '</h3><p class="muted small">' + esc(p.description) + '</p></div></a>';
      }).join('');
      box.hidden = false;
    }).catch(function () {});
  }

  // ---------- Email sign-up ----------
  var nl = $('nl-form');
  if (nl) nl.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('nl-msg'), btn = nl.querySelector('button');
    btn.disabled = true; msg.textContent = 'Saving…';
    fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('nl-email').value, source: 'home' }) })
      .then(function (r) { return r.json().then(function (j) { return [r.ok, j]; }); })
      .then(function (x) { msg.textContent = x[0] ? 'Done! You will get reminders at ' + $('nl-email').value + '.' : (x[1].error || 'Could not save. Please try again.'); if (x[0]) nl.reset(); })
      .catch(function () { msg.textContent = 'Could not save. Please try again.'; })
      .then(function () { btn.disabled = false; });
  });
})();
