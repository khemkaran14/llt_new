/* Income tax calculator page. Depends on common.js and tax-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, T = window.TaxEngine;
  var form = document.getElementById('tax-form');
  if (!form || !T) return;

  var fields = form.querySelectorAll('[data-key]');
  var defaults = {};
  var shown = 'new';
  var last = null;

  fields.forEach(function (el) {
    defaults[el.dataset.key] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.hasAttribute('data-money')) L.formatMoneyInput(el);
  });

  function readInputs() {
    var p = {};
    fields.forEach(function (el) {
      var k = el.dataset.key;
      if (el.type === 'checkbox') p[k] = el.checked;
      else if (el.hasAttribute('data-money')) p[k] = L.read(el);
      else p[k] = el.value;
    });
    return p;
  }

  function writeInputs(p) {
    fields.forEach(function (el) {
      var k = el.dataset.key;
      if (!(k in p)) return;
      if (el.type === 'checkbox') el.checked = p[k] === true || p[k] === '1' || p[k] === 'true';
      else if (el.hasAttribute('data-money')) el.value = Number(p[k]) ? L.num(p[k]) : '';
      else el.value = p[k];
    });
  }

  function row(label, value, cls) {
    return '<tr' + (cls === 'total' ? ' class="total"' : '') + '><th>' + label + '</th><td' +
      (cls === 'neg' ? ' class="neg"' : '') + '>' + value + '</td></tr>';
  }

  function renderBreakdown(r) {
    var h = '';
    h += row('Gross income', L.money(r.grossIncome));
    if (r.exemptions) h += row('Exemptions (HRA, LTA…)', '− ' + L.money(r.exemptions), 'neg');
    if (r.standardDeduction) h += row('Standard deduction', '− ' + L.money(r.standardDeduction), 'neg');
    if (r.professionalTax) h += row('Professional tax', '− ' + L.money(r.professionalTax), 'neg');
    if (r.homeLoanInterest) h += row('Home loan interest', '− ' + L.money(r.homeLoanInterest), 'neg');
    if (r.totalDeductions) h += row('Chapter VI-A deductions', '− ' + L.money(r.totalDeductions), 'neg');
    h += row('<strong>Taxable income</strong>', '<strong>' + L.money(r.taxableIncome) + '</strong>');
    h += row('Tax as per slabs', L.money(r.slabTax));
    if (r.rebate) h += row('Rebate u/s 87A', '− ' + L.money(r.rebate), 'neg');
    if (r.marginalRelief) h += row('Marginal relief', '− ' + L.money(r.marginalRelief), 'neg');
    if (r.surcharge) h += row('Surcharge (' + L.pct(r.surchargeRate, 0) + ')', L.money(r.surcharge));
    h += row('Health &amp; education cess (4%)', L.money(r.cess));
    h += row('Total tax payable', L.money(r.totalTax), 'total');
    h += row('Effective tax rate', L.pct(r.effectiveRate));
    h += row('Income after tax (yearly)', L.money(r.inHand));
    document.getElementById('breakdown').innerHTML = h;

    var body = '';
    r.slabRows.forEach(function (s) {
      var range = s.to === Infinity ? 'Above ' + L.money(s.from) : L.money(s.from) + ' – ' + L.money(s.to);
      body += '<tr><td>' + range + '</td><td>' + (s.rate ? L.pct(s.rate, 0) : 'Nil') + '</td><td>' +
        L.money(s.amount) + '</td><td>' + L.money(s.tax) + '</td></tr>';
    });
    body += '<tr><td colspan="3"><strong>' + (r.regime === 'new' ? 'New' : 'Old') + ' regime tax before rebate, surcharge and cess</strong></td><td><strong>' + L.money(r.slabTax) + '</strong></td></tr>';
    document.querySelector('#slab-table tbody').innerHTML = body;
  }

  function update() {
    var p = readInputs();
    var c = T.compare(p);
    last = c;

    document.getElementById('new-total').textContent = L.money(c.new.totalTax);
    document.getElementById('old-total').textContent = L.money(c.old.totalTax);
    document.getElementById('new-month').textContent = L.money(c.new.monthlyTax) + ' / month';
    document.getElementById('old-month').textContent = L.money(c.old.monthlyTax) + ' / month';

    ['new', 'old'].forEach(function (k) {
      var box = document.getElementById('box-' + k);
      var win = c.better === k && c.saving > 0;
      box.classList.toggle('win', win);
      var tag = box.querySelector('.win-tag');
      if (win && !tag) box.querySelector('.k').insertAdjacentHTML('beforeend', '<span class="win-tag">Lower</span>');
      if (!win && tag) tag.remove();
    });

    var v = document.getElementById('verdict');
    if (c.saving === 0) {
      v.innerHTML = '<strong>Both regimes cost the same</strong>' + (c.new.totalTax === 0 ? 'You pay no income tax.' : 'Pick either one.');
    } else {
      v.innerHTML = '<strong>The ' + c.better + ' regime saves you ' + L.money(c.saving) + '</strong>' +
        'That\'s about ' + L.money(c.saving / 12) + ' more in your pocket every month.';
    }

    var tip = document.getElementById('tip');
    if (c.better === 'new' && c.breakEven > 0 && c.new.totalTax > 0) {
      tip.hidden = false;
      tip.innerHTML = 'The old regime would match the new one only if you claimed about <strong>' + L.money(c.breakEven) +
        '</strong> more in deductions than you entered.';
    } else if (c.better === 'old' && c.saving > 0) {
      tip.hidden = false;
      tip.innerHTML = 'Tell your employer you want the <strong>old regime</strong> so less tax is deducted from your salary, and keep proof of your investments ready.';
    } else {
      tip.hidden = true;
    }

    renderBreakdown(c[shown]);

    var hra = T.hraExemption(p, p.fy);
    var metroHint = document.getElementById('metro-hint');
    var cityName = form.querySelector('#city option:checked').textContent;
    var isMetro = T.YEARS[p.fy].metroCities.indexOf(p.city) !== -1;
    metroHint.textContent = p.city === 'other' ? '40% of basic counts for HRA.' :
      cityName + ': ' + (isMetro ? '50%' : '40%') + ' of basic counts for HRA in FY ' + p.fy + '.';
    document.getElementById('hra-out').textContent = hra.exempt ? 'Tax-free HRA: ' + L.money(hra.exempt) + '.' : '';

    L.store.set('tax', p);
  }

  form.addEventListener('input', L.debounce(update, 80));
  form.addEventListener('change', update);

  document.querySelectorAll('[data-show]').forEach(function (b) {
    b.addEventListener('click', function () {
      shown = b.dataset.show;
      document.querySelectorAll('[data-show]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      if (last) renderBreakdown(last[shown]);
    });
  });

  document.getElementById('reset').addEventListener('click', function () {
    writeInputs(defaults);
    history.replaceState(null, '', location.pathname);
    update();
  });

  document.getElementById('share').addEventListener('click', function () {
    var p = readInputs(), q = new URLSearchParams();
    Object.keys(p).forEach(function (k) {
      var v = p[k];
      if (v === true) q.set(k, '1');
      else if (v) q.set(k, v);
    });
    var url = location.origin + location.pathname + (q.toString() ? '?' + q : '');
    var btn = this;
    var done = function () { btn.textContent = 'Link copied ✓'; setTimeout(function () { btn.textContent = 'Copy link to this result'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
    else prompt('Copy this link:', url);
  });

  // Start from a shared link, else the last values used on this device.
  var params = new URLSearchParams(location.search);
  if ([].some.call(fields, function (el) { return params.has(el.dataset.key); })) {
    var p = {};
    params.forEach(function (v, k) { p[k] = v; });
    fields.forEach(function (el) { if (el.type === 'checkbox' && !(el.dataset.key in p)) p[el.dataset.key] = false; });
    writeInputs(p);
    document.getElementById('other-income').open = true;
  } else {
    var saved = L.store.get('tax');
    if (saved) writeInputs(saved);
  }
  update();
})();
