/* PPF calculator page. Depends on common.js and finance-engines.js. */
(function () {
  'use strict';
  var L = window.LLT, F = window.Fin;
  var form = document.getElementById('ppf-form');
  if (!form || !F) return;

  L.calc(form, function (v) {
    var r = F.ppf({ yearly: v.yearly, annualRate: v.rate, years: Number(v.years) || 15 });
    L.set('maturity-out', L.money(r.maturity));
    L.set('invested-out', L.short(r.invested));
    L.set('interest-out', L.short(r.interest));
    var s = r.maturity > 0 ? r.interest / r.maturity : 0;
    L.donut(document.getElementById('donut-2'), s);
    L.set('share-1', L.pct(1 - s, 0));
    L.set('share-2', L.pct(s, 0));
    var html = '';
    r.rows.forEach(function (row) {
      html += '<tr><td>' + row.year + '</td><td>' + L.money(row.opening) + '</td><td>' + L.money(row.deposit) + '</td><td>' +
        L.money(row.interest) + '</td><td>' + L.money(row.closing) + '</td></tr>';
    });
    document.querySelector('#growth tbody').innerHTML = html;
  }, 'ppf');
})();
