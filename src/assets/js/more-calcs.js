/* UI for SSY, NPS, EPF, gratuity, capital gains, home loan eligibility, retirement,
   inflation and land area pages. Each block runs only if its form is on the page.
   Depends on common.js and finance-engines.js (land page: land-units.js). */
(function () {
  'use strict';
  var L = window.LLT, F = window.Fin;
  var $ = function (id) { return document.getElementById(id); };
  function donut(id, share) { var el = $(id); if (el) L.donut(el, share); }
  function table(id, head, rows) {
    var el = $(id);
    if (!el) return;
    el.innerHTML = '<thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
  }
  function kv(id, rows) {
    var el = $(id);
    if (el) el.innerHTML = rows.map(function (r) { return '<tr' + (r[2] ? ' class="' + r[2] + '"' : '') + '><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('');
  }

  // ---- Sukanya Samriddhi ----
  if ($('ssy-form')) L.calc($('ssy-form'), function (v) {
    var r = F.ssy({ yearly: v.yearly, annualRate: v.rate, girlAge: v.age, startYear: v.start });
    L.set('out-big', L.money(r.maturity));
    L.set('out-invested', L.short(r.invested));
    L.set('out-interest', L.short(r.interest));
    L.set('out-when', 'Matures in ' + r.maturityYear + ', when she turns ' + r.maturityAge);
    donut('donut-2', r.maturity ? r.interest / r.maturity : 0);
    table('ssy-table', ['Year', 'Her age', 'Deposit', 'Interest', 'Balance'], r.rows.map(function (x) { return [x.year, x.age, L.money(x.deposit), L.money(x.interest), L.money(x.balance)]; }));
    $('out-warn').hidden = !r.capped && v.age <= 10;
    $('out-warn').textContent = v.age > 10 ? 'An SSY account can only be opened before the girl turns 10.' : 'The maximum deposit is ₹1,50,000 a year.';
  }, 'ssy');

  // ---- NPS ----
  if ($('nps-form')) L.calc($('nps-form'), function (v) {
    var minPct = v.sector === 'govt' ? 40 : 20;
    var r = F.nps({ monthly: v.monthly, age: v.age, retireAge: v.retireAge, annualReturn: v.rate, stepUp: v.stepUp, annuityPct: v.annuityPct, annuityRate: v.annuityRate, current: v.current, minAnnuity: minPct });
    $('out-warn').hidden = (v.annuityPct || 0) >= minPct && !r.taxableLump;
    $('out-warn').textContent = (v.annuityPct || 0) < minPct ? 'At least ' + minPct + '% must go to the annuity, so we\'ve used ' + minPct + '%.' :
      'Only 60% of the corpus is tax-free. ' + L.money(r.taxableLump) + ' of your lump sum would be taxed at your slab rate.';
    L.set('out-big', L.money(r.corpus));
    L.set('out-invested', L.short(r.invested));
    L.set('out-lump', L.short(r.lumpSum) + ' (' + Math.round((1 - r.annuityPct) * 100) + '%)');
    L.set('out-pension', L.money(r.monthlyPension) + ' / month');
    L.set('out-annuity', L.short(r.annuityCorpus));
    donut('donut-2', r.corpus ? (r.corpus - r.invested - (v.current || 0)) / r.corpus : 0);
    table('nps-table', ['Age', 'Monthly', 'Invested so far', 'Value'], r.rows.filter(function (x, i) { return i % 5 === 4 || i === r.rows.length - 1; }).map(function (x) { return [x.age, L.money(x.monthly), L.money(x.invested), L.money(x.value)]; }));
  }, 'nps');

  // ---- EPF ----
  if ($('epf-form')) L.calc($('epf-form'), function (v) {
    var r = F.epf({ basic: v.basic, age: v.age, retireAge: v.retireAge, annualRate: v.rate, hike: v.hike, current: v.current });
    L.set('out-big', L.money(r.corpus));
    L.set('out-contrib', L.short(r.contributed + (v.current || 0)));
    L.set('out-interest', L.short(r.interest));
    var eps = Math.min(v.basic || 0, 15000) * 0.0833;
    L.set('out-monthly', L.money((v.basic || 0) * 0.24 - eps) + ' / month');
    donut('donut-2', r.corpus ? r.interest / r.corpus : 0);
    table('epf-table', ['Age', 'Basic + DA', 'Your share', 'Employer share', 'Interest', 'Balance'], r.rows.map(function (x) { return [x.age, L.money(x.basic), L.money(x.employee), L.money(x.employer), L.money(x.interest), L.money(x.balance)]; }));
  }, 'epf');

  // ---- Gratuity ----
  if ($('grat-form')) L.calc($('grat-form'), function (v) {
    var r = F.gratuity({ salary: v.salary, years: v.years, months: v.months, covered: v.covered !== 'no', exemptLimit: v.govt ? 2500000 : 2000000 });
    L.set('out-big', L.money(r.amount));
    kv('grat-kv', [
      ['Years counted', r.countedYears + (v.covered !== 'no' && v.months >= 6 ? ' (6+ months rounds up)' : '')],
      ['Formula', (v.covered !== 'no' ? '15 ÷ 26' : '15 ÷ 30') + ' × ' + L.money(v.salary) + ' × ' + r.countedYears],
      ['Tax-free', L.money(r.exempt), 'neg'], ['Taxable', L.money(r.taxable)], ['Gratuity', L.money(r.amount), 'total']]);
    $('out-warn').hidden = r.eligible;
    $('out-warn').textContent = 'Gratuity is usually paid only after 5 years of continuous service (4 years 240 days in many cases). Exceptions: death or disability.';
  }, 'gratuity');

  // ---- Capital gains ----
  if ($('cg-form')) L.calc($('cg-form'), function (v) {
    var r = F.capitalGains({ asset: v.asset, buyDate: v.buyDate, sellDate: v.sellDate, buy: v.buy, sell: v.sell, expenses: v.expenses, fmv2018: v.fmv2018, otherLtcg: v.otherLtcg, slabRate: v.slab });
    $('fmv-field').hidden = !(v.asset === 'equity' && v.buyDate && v.buyDate < '2018-02-01');
    $('slab-field').hidden = v.asset === 'equity';
    $('ltcg-field').hidden = v.asset !== 'equity';
    var bad = !v.buyDate || !v.sellDate || v.sellDate < v.buyDate;
    L.set('out-big', bad ? '–' : L.money(r.loss ? 0 : r.total));
    L.set('out-kind', bad ? 'Enter both dates' : (r.loss ? 'Capital loss: no tax' : r.kind) + (bad ? '' : ' · held ' + Math.floor(r.held / 12) + ' yr ' + (r.held % 12) + ' mo'));
    if (!bad) kv('cg-kv', [
      ['Sale value', L.money(v.sell)], ['Cost' + (r.grandfathered ? ' (31 Jan 2018 value used)' : ''), '− ' + L.money(r.cost), 'neg'],
      ['Expenses', '− ' + L.money(v.expenses || 0), 'neg'], [r.loss ? 'Loss' : 'Gain', L.money(r.gain)],
      ['Tax-free (₹1.25 lakh a year)', '− ' + L.money(r.exemptionUsed), 'neg'], ['Taxable gain', L.money(r.taxableGain)],
      ['Tax rate', (r.rate * 100).toFixed(1).replace('.0', '') + '%'], ['Tax', L.money(r.tax)], ['Cess (4%)', L.money(r.cess)],
      ['Total tax', L.money(r.loss ? 0 : r.total), 'total']]);
    var tip = $('cg-tip');
    tip.hidden = !(r.loss || (!r.longTerm && v.asset === 'equity' && r.held >= 9));
    tip.textContent = r.loss ? 'A loss can be set off against other capital gains and carried forward for 8 years, if you file your return on time.'
      : 'You\'ve held this for ' + r.held + ' months. Waiting until it\'s over 12 months makes it long-term: 12.5% instead of 20%, plus the ₹1.25 lakh exemption.';
  }, 'cg');

  // ---- Home loan eligibility ----
  if ($('hle-form')) L.calc($('hle-form'), function (v) {
    var r = F.homeLoanEligibility({ income: v.income, coIncome: v.coIncome, otherEmis: v.otherEmis, annualRate: v.rate, tenure: v.tenure, age: v.age, foir: v.foir });
    L.set('out-big', L.money(Math.round(r.loan / 1000) * 1000));
    kv('hle-kv', [['EMI you can afford', L.money(r.maxEmi) + ' / month'], ['Tenure', r.tenureYears + ' years' + (r.tenureCapped ? ' (limited by age)' : '')],
      ['Bank lends up to', Math.round(r.ltv * 100) + '% of property value'], ['Property budget', L.money(r.property)], ['Your down payment', L.money(r.downPayment)],
      ['Plus registration & stamp duty', 'about 6–8% of property value']]);
    $('out-warn').hidden = r.maxEmi > 0;
    $('out-warn').textContent = 'Your existing EMIs already use up the share of income banks usually allow. Clearing a loan or adding a co-applicant would help.';
  }, 'hle');

  // ---- Retirement ----
  if ($('ret-form')) L.calc($('ret-form'), function (v) {
    var r = F.retirement({ age: v.age, retireAge: v.retireAge, lifeExpectancy: v.life, monthlyExpense: v.expense, inflation: v.inflation, preReturn: v.preReturn, postReturn: v.postReturn, savings: v.savings });
    L.set('out-big', L.money(r.corpus));
    L.set('out-sip', L.money(Math.ceil(r.monthlySip / 100) * 100) + ' / month');
    kv('ret-kv', [['Years to retirement', r.yearsToRetire], ['Monthly expenses at retirement', L.money(r.monthlyExpenseAtRetirement)],
      ['Years in retirement', r.yearsInRetirement], ['Your savings will grow to', L.money(r.savingsFv)], ['Still needed', L.money(r.gap)],
      ['FIRE number (25× yearly expenses, today\'s money)', L.money(r.fireNumberToday)]]);
  }, 'retirement');

  // ---- Inflation ----
  if ($('inf-form')) L.calc($('inf-form'), function (v) {
    var r = F.inflation({ amount: v.amount, rate: v.rate, years: v.years });
    var future = v.mode !== 'past';
    L.set('out-label', future ? 'Will cost in ' + v.years + ' years' : 'Today\'s value of that money');
    L.set('out-big', L.money(future ? r.future : r.purchasingPower));
    L.set('out-sub', future ? 'Prices rise ' + r.factor.toFixed(2) + '× at ' + v.rate + '% a year.' : 'Your ' + L.money(v.amount) + ' buys only what ' + L.money(r.purchasingPower) + ' buys today.');
    L.set('out-loss', L.pct(r.lossPct, 0));
    var rows = [];
    for (var y = 5; y <= Math.max(5, Math.min(40, v.years)); y += 5) { var x = F.inflation({ amount: v.amount, rate: v.rate, years: y }); rows.push([y + ' years', L.money(x.future), L.money(x.purchasingPower)]); }
    table('inf-table', ['After', 'Same things will cost', 'Your money will be worth'], rows);
  }, 'inflation');

  // ---- Land area ----
  if ($('land-form') && window.LandUnits) {
    var LU = window.LandUnits, fromSel = $('l-from');
    var fill = function (state, keep) {
      var u = LU.units(state);
      fromSel.innerHTML = Object.keys(u).map(function (k) { return '<option value="' + k + '">' + u[k].name + (u[k].local ? ' (' + state + ')' : '') + '</option>'; }).join('');
      if (keep && u[keep]) fromSel.value = keep;
    };
    var st = $('l-state');
    st.innerHTML = '<option value="">All India (common units)</option>' + Object.keys(LU.STATES).map(function (s) { return '<option>' + s + '</option>'; }).join('');
    var saved = L.store.get('land') || {};
    if (saved.state) st.value = saved.state;
    fill(st.value, saved.from || 'acre');
    st.addEventListener('change', function () { fill(st.value, fromSel.value); });
    L.calc($('land-form'), function (v) {
      if (fromSel.value !== v.from && v.from) fromSel.value = v.from;
      var u = LU.units(v.state, v.customBigha);
      var from = u[v.from] ? v.from : 'acre';
      var sqft = (v.value || 0) * u[from].sqft;
      $('custom-bigha-field').hidden = !u.bigha;
      L.set('out-big', L.num(sqft) + ' sq ft');
      L.set('out-sub', (v.value || 0) + ' ' + u[from].name + ' = ' + (sqft / 10.7639104).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' sq m');
      var keys = Object.keys(u).filter(function (k) { return k !== from; });
      keys.sort(function (a, b) { return (u[b].local ? 1 : 0) - (u[a].local ? 1 : 0) || u[b].sqft - u[a].sqft; });
      table('land-table', ['Unit', 'Value', '1 unit ='], keys.map(function (k) {
        var val = sqft / u[k].sqft;
        return [u[k].name + (u[k].local ? ' <span class="tag-new">' + (v.state || '') + '</span>' : ''),
          '<strong>' + val.toLocaleString('en-IN', { maximumFractionDigits: val < 1 ? 6 : 3 }) + '</strong>', L.num(u[k].sqft) + ' sq ft'];
      }));
    }, 'land');
  }
})();
