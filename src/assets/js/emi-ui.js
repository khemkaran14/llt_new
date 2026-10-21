/* EMI calculator page. Depends on common.js and emi-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, E = window.EmiEngine;
  var form = document.getElementById('emi-form');
  if (!form || !E) return;

  var $ = function (id) { return document.getElementById(id); };
  var amount = $('amount'), amountRange = $('amount-range');
  var rate = $('rate'), rateRange = $('rate-range');
  var tenure = $('tenure'), tenureRange = $('tenure-range');
  var start = $('start'), extra = $('extra');
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var PRESETS = {
    home: { amount: 5000000, rate: 8.5, years: 20, max: 20000000, maxYears: 30 },
    car: { amount: 800000, rate: 9.5, years: 5, max: 5000000, maxYears: 8 },
    personal: { amount: 500000, rate: 12, years: 3, max: 4000000, maxYears: 7 },
    education: { amount: 1500000, rate: 10, years: 10, max: 10000000, maxYears: 15 }
  };
  var state = { type: 'home', unit: 'years' };
  var result = null;

  L.formatMoneyInput(amount);
  L.formatMoneyInput(extra);

  var now = new Date();
  start.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  function pressed(groupId, attr, value) {
    $(groupId).querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset[attr] === value ? 'true' : 'false');
    });
  }

  function setTenureRange() {
    var p = PRESETS[state.type];
    if (state.unit === 'years') { tenureRange.min = 1; tenureRange.max = p.maxYears; tenureRange.step = 1; }
    else { tenureRange.min = 3; tenureRange.max = p.maxYears * 12; tenureRange.step = 1; }
  }

  function applyPreset(type) {
    state.type = type;
    var p = PRESETS[type];
    pressed('loan-type', 'type', type);
    amountRange.max = p.max;
    amount.value = L.num(p.amount);
    amountRange.value = p.amount;
    rate.value = p.rate; rateRange.value = p.rate;
    state.unit = 'years';
    pressed('tenure-unit', 'unit', 'years');
    setTenureRange();
    tenure.value = p.years; tenureRange.value = p.years;
  }

  function months() {
    var t = Math.max(0, Number(tenure.value) || 0);
    return Math.round(state.unit === 'years' ? t * 12 : t);
  }

  function update() {
    var P = L.read(amount);
    var R = Math.max(0, Number(rate.value) || 0);
    var n = months();
    var sm = start.value ? start.value.split('-') : [now.getFullYear(), now.getMonth() + 1];
    var opts = { principal: P, annualRate: R, months: n, extraMonthly: L.read(extra), startYear: Number(sm[0]), startMonth: Number(sm[1]) - 1 };
    var r = E.withExtra(opts);
    var s = r.extra || r.base;
    result = s;

    $('amount-short').textContent = P >= 1e5 ? '(' + L.short(P) + ')' : '';
    $('emi-out').textContent = L.money(r.base.emi);
    $('principal-out').textContent = L.short(P);
    $('interest-out').textContent = L.short(s.totalInterest);
    $('total-out').textContent = L.short(s.totalPayment);

    var share = s.totalPayment > 0 ? s.totalInterest / s.totalPayment : 0;
    $('donut-interest').setAttribute('stroke-dasharray', (share * 100).toFixed(2) + ' ' + (100 - share * 100).toFixed(2));
    $('p-share').textContent = L.pct(1 - share, 0);
    $('i-share').textContent = L.pct(share, 0);
    var last = s.rows[s.rows.length - 1];
    $('payoff').textContent = last ? 'Loan ends ' + MONTHS[last.month] + ' ' + last.year : '';

    var ex = $('extra-out');
    if (r.extra && r.interestSaved > 0) {
      var y = Math.floor(r.monthsSaved / 12), m = r.monthsSaved % 12;
      var time = (y ? y + ' year' + (y > 1 ? 's' : '') : '') + (y && m ? ' ' : '') + (m ? m + ' month' + (m > 1 ? 's' : '') : '');
      ex.hidden = false;
      ex.innerHTML = 'Paying ' + L.money(opts.extraMonthly) + ' extra a month saves <span class="save">' + L.money(r.interestSaved) +
        '</span> in interest and clears the loan <strong>' + (time || 'a little') + ' sooner</strong>.';
    } else {
      ex.hidden = true;
    }

    renderSchedule(s);
    L.store.set('emi', { type: state.type, unit: state.unit, amount: P, rate: R, tenure: tenure.value, extra: L.read(extra) });
  }

  function renderSchedule(s) {
    var tbody = document.querySelector('#schedule tbody');
    var paid = 0, html = '';
    s.years.forEach(function (y, i) {
      paid += y.principal;
      html += '<tr class="year-row" data-i="' + i + '" tabindex="0" aria-expanded="false"><td><span class="caret">▸</span> ' + y.year + '</td><td>' +
        L.money(y.principal) + '</td><td>' + L.money(y.interest) + '</td><td>' + L.money(y.payment) + '</td><td>' +
        L.money(y.balance) + '</td><td>' + L.pct(s.principal ? paid / s.principal : 0, 0) + '</td></tr>';
    });
    tbody.innerHTML = html;
  }

  function toggleYear(tr) {
    var i = Number(tr.dataset.i);
    var open = tr.classList.toggle('open');
    tr.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) {
      var nxt = tr.nextElementSibling;
      while (nxt && nxt.classList.contains('month-row')) { var t = nxt.nextElementSibling; nxt.remove(); nxt = t; }
      return;
    }
    var rows = result.years[i].months.map(function (m) {
      return '<tr class="month-row"><td>' + MONTHS[m.month] + ' ' + m.year + '</td><td>' + L.money(m.principal) + '</td><td>' +
        L.money(m.interest) + '</td><td>' + L.money(m.payment) + '</td><td>' + L.money(m.balance) + '</td><td></td></tr>';
    }).join('');
    tr.insertAdjacentHTML('afterend', rows);
  }

  document.querySelector('#schedule tbody').addEventListener('click', function (e) {
    var tr = e.target.closest('tr.year-row');
    if (tr) toggleYear(tr);
  });
  document.querySelector('#schedule tbody').addEventListener('keydown', function (e) {
    var tr = e.target.closest('tr.year-row');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleYear(tr); }
  });

  // Keep number boxes and sliders in sync
  amountRange.addEventListener('input', function () { amount.value = L.num(amountRange.value); update(); });
  amount.addEventListener('input', L.debounce(function () { amountRange.value = L.read(amount); update(); }));
  rateRange.addEventListener('input', function () { rate.value = rateRange.value; update(); });
  rate.addEventListener('input', L.debounce(function () { rateRange.value = rate.value; update(); }));
  tenureRange.addEventListener('input', function () { tenure.value = tenureRange.value; update(); });
  tenure.addEventListener('input', L.debounce(function () { tenureRange.value = tenure.value; update(); }));
  start.addEventListener('change', update);
  extra.addEventListener('input', L.debounce(update));

  $('loan-type').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    applyPreset(b.dataset.type);
    update();
  });
  $('tenure-unit').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.dataset.unit === state.unit) return;
    var n = months();
    state.unit = b.dataset.unit;
    pressed('tenure-unit', 'unit', state.unit);
    setTenureRange();
    tenure.value = state.unit === 'years' ? +(n / 12).toFixed(1) : n;
    tenureRange.value = tenure.value;
    update();
  });

  $('csv').addEventListener('click', function () {
    if (!result) return;
    var lines = ['Month,Payment,Principal,Interest,Balance'];
    result.rows.forEach(function (r) {
      lines.push([MONTHS[r.month] + ' ' + r.year, r.payment.toFixed(2), r.principal.toFixed(2), r.interest.toFixed(2), r.balance.toFixed(2)].join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'emi-schedule-livelifetricks.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  $('share').addEventListener('click', function () {
    var q = new URLSearchParams({ type: state.type, amount: L.read(amount), rate: rate.value, tenure: tenure.value, unit: state.unit });
    if (L.read(extra)) q.set('extra', L.read(extra));
    var url = location.origin + location.pathname + '?' + q;
    var btn = this;
    var done = function () { btn.textContent = 'Link copied ✓'; setTimeout(function () { btn.textContent = 'Copy link to this result'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
    else prompt('Copy this link:', url);
  });

  // Start from a shared link, else the last values used on this device.
  var q = new URLSearchParams(location.search);
  var init = q.has('amount') ? {
    type: q.get('type'), amount: q.get('amount'), rate: q.get('rate'), tenure: q.get('tenure'), unit: q.get('unit'), extra: q.get('extra')
  } : L.store.get('emi');
  applyPreset(init && PRESETS[init.type] ? init.type : 'home');
  if (init) {
    if (Number(init.amount) > 0) { amount.value = L.num(init.amount); amountRange.value = init.amount; }
    if (init.rate != null && init.rate !== '') { rate.value = init.rate; rateRange.value = init.rate; }
    if (init.unit === 'months') { state.unit = 'months'; pressed('tenure-unit', 'unit', 'months'); setTenureRange(); }
    if (Number(init.tenure) > 0) { tenure.value = init.tenure; tenureRange.value = init.tenure; }
    if (Number(init.extra) > 0) extra.value = L.num(init.extra);
  }
  update();
})();
