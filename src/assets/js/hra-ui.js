/* HRA calculator page. Depends on common.js and tax-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, T = window.TaxEngine;
  var form = document.getElementById('hra-form');
  if (!form || !T) return;

  L.calc(form, function (v) {
    var p = { basicDA: v.basic * 12, hraReceived: v.hra * 12, rentPaid: v.rent * 12, city: v.city };
    var r = T.hraExemption(p, v.fy);
    var hraYear = v.hra * 12;
    L.set('exempt-out', L.money(r.exempt));
    L.set('taxable-out', L.money(Math.max(0, hraYear - r.exempt)));
    L.set('monthly-out', L.money(r.exempt / 12));

    var parts = r.parts || { hraReceived: hraYear, rentMinus10: Math.max(0, v.rent * 12 - 0.1 * v.basic * 12), pctOfBasic: (r.metro ? 0.5 : 0.4) * v.basic * 12 };
    var isMetro = T.YEARS[v.fy].metroCities.indexOf(v.city) !== -1;
    var items = [
      ['HRA received', parts.hraReceived],
      ['Rent paid − 10% of basic', parts.rentMinus10],
      [(isMetro ? '50%' : '40%') + ' of basic' + (isMetro ? ' (listed city)' : ''), parts.pctOfBasic]
    ];
    var min = Math.min(items[0][1], items[1][1], items[2][1]);
    var marked = false;
    document.getElementById('parts').innerHTML = items.map(function (it) {
      var lowest = !marked && it[1] === min && (marked = true);
      return '<tr' + (lowest ? ' class="total"' : '') + '><th>' + it[0] + (lowest ? ' ← lowest' : '') + '</th><td>' + L.money(it[1]) + '</td></tr>';
    }).join('');

    var tip = document.getElementById('tip-out');
    if (!v.rent) { tip.hidden = false; tip.textContent = 'You need to pay rent to claim HRA. Without rent, all of your HRA is taxable.'; }
    else if (v.rent * 12 > 100000) { tip.hidden = false; tip.textContent = 'Your rent is over ₹1 lakh a year, so you need your landlord\'s PAN to claim HRA.'; }
    else tip.hidden = true;
  }, 'hra');
})();
