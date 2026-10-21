/* FD and RD calculator pages. Depends on common.js and finance-engines.js. */
(function () {
  'use strict';
  var L = window.LLT, F = window.Fin;
  if (!F) return;

  function shares(deposit, total) {
    var s = total > 0 ? (total - deposit) / total : 0;
    L.donut(document.getElementById('donut-2'), s);
    L.set('share-1', L.pct(1 - s, 0));
    L.set('share-2', L.pct(s, 0));
  }

  var fdForm = document.getElementById('fd-form');
  if (fdForm) {
    L.calc(fdForm, function (v) {
      var months = Math.round((v.years || 0) * 12 + (v.months || 0));
      var r = F.fd({ principal: v.principal, annualRate: v.rate, months: months, compounding: Number(v.compounding) || 4 });
      L.set('maturity-out', L.money(r.maturity));
      L.set('invested-out', L.short(r.principal));
      L.set('interest-out', L.short(r.interest));
      L.set('yield-out', L.pct(r.effectiveYield, 2));
      shares(r.principal, r.maturity);

      var perYear = months ? r.interest / (months / 12) : 0;
      var tds = document.getElementById('tds-out');
      tds.hidden = perYear <= 50000;
      if (perYear > 50000) tds.innerHTML = 'You earn about <strong>' + L.money(perYear) + '</strong> interest a year. That\'s over ₹50,000 (₹1 lakh for seniors), so the bank will deduct 10% TDS.';

      var html = '';
      r.rows.forEach(function (row, i) {
        var label = (i === r.rows.length - 1 && months % 12) ? 'Year ' + row.year + ' (maturity)' : row.year;
        html += '<tr><td>' + label + '</td><td>' + L.money(row.value) + '</td><td>' + L.money(row.value - r.principal) + '</td></tr>';
      });
      document.querySelector('#growth tbody').innerHTML = html;
    }, 'fd');
  }

  var rdForm = document.getElementById('rd-form');
  if (rdForm) {
    L.calc(rdForm, function (v) {
      var r = F.rd({ monthly: v.monthly, annualRate: v.rate, months: v.tenure });
      L.set('maturity-out', L.money(r.maturity));
      L.set('invested-out', L.short(r.invested));
      L.set('interest-out', L.short(r.interest));
      shares(r.invested, r.maturity);
    }, 'rd');
  }
})();
