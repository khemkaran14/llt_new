/* In-hand salary calculator page. Depends on common.js, tax-engine.js and salary-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, S = window.SalaryEngine;
  var form = document.getElementById('salary-form');
  if (!form || !S) return;

  function row(label, value, cls) {
    return '<tr' + (cls === 'total' ? ' class="total"' : '') + '><th>' + label + '</th><td' + (cls === 'neg' ? ' class="neg"' : '') + '>' + value + '</td></tr>';
  }

  function update(v) {
    var r = S.inHand(v);
    L.set('monthly-out', L.money(r.monthlyInHand));
    L.set('yearly-out', L.short(r.yearlyInHand));
    L.set('tax-out', L.money(r.tax));
    var other = r.regime === 'new' ? r.taxOld : r.taxNew;
    L.set('regime-out', (r.regime === 'new' ? 'New' : 'Old') + ' regime' +
      (v.regime === 'best' ? (other > r.tax ? ' (saves ' + L.money(other - r.tax) + ' a year)' : ' (both cost the same)') : ''));

    var h = '';
    h += row('CTC', L.money(r.ctc));
    if (r.employerPF) h += row('Employer PF', '− ' + L.money(r.employerPF), 'neg');
    if (r.gratuity) h += row('Gratuity', '− ' + L.money(r.gratuity), 'neg');
    h += row('<strong>Gross salary</strong>', '<strong>' + L.money(r.gross) + '</strong>');
    if (r.employeePF) h += row('Your PF', '− ' + L.money(r.employeePF), 'neg');
    if (r.professionalTax) h += row('Professional tax', '− ' + L.money(r.professionalTax), 'neg');
    h += row('Income tax', '− ' + L.money(r.tax), 'neg');
    if (r.variable) h += row('Bonus / variable (paid separately)', '− ' + L.money(r.variable), 'neg');
    h += row('Monthly in-hand', L.money(r.monthlyInHand), 'total');
    document.getElementById('breakdown').innerHTML = h;

    var bonus = document.getElementById('bonus-out');
    bonus.hidden = !r.variable;
    if (r.variable) bonus.innerHTML = 'Plus your bonus of <strong>' + L.money(r.variable) + '</strong> when it\'s paid. The tax on it is already spread across the monthly figure above.';
  }

  L.calc(form, update, 'salary');
})();
