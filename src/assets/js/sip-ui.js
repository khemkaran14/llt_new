/* SIP calculator page. Depends on common.js and finance-engines.js. */
(function () {
  'use strict';
  var L = window.LLT, F = window.Fin;
  var form = document.getElementById('sip-form');
  if (!form || !F) return;

  function update(v) {
    var isSip = v.mode !== 'lumpsum';
    form.querySelectorAll('[data-show]').forEach(function (el) { el.hidden = el.dataset.show !== (isSip ? 'sip' : 'lumpsum'); });
    var r = isSip
      ? F.sip({ monthly: v.monthly, annualRate: v.rate, years: v.years, stepUp: v.stepUp })
      : F.lumpsum({ amount: v.amount, annualRate: v.rate, years: v.years });

    L.set('value-out', L.money(r.value));
    L.set('invested-out', L.short(r.invested));
    L.set('gains-out', L.short(r.gains));
    var share = r.value > 0 ? r.gains / r.value : 0;
    L.donut(document.getElementById('donut-2'), share);
    L.set('share-1', L.pct(1 - share, 0));
    L.set('share-2', L.pct(share, 0));
    L.set('multiple', r.invested > 0 ? 'Your money grows ' + (r.value / r.invested).toFixed(1) + '×' : '');

    var goal = document.getElementById('goal-out');
    if (isSip && v.target > 0 && v.years > 0) {
      var need = F.sipForGoal({ target: v.target, annualRate: v.rate, years: v.years });
      goal.hidden = false;
      goal.innerHTML = 'To reach <strong>' + L.short(v.target) + '</strong> in ' + v.years + ' years at ' + v.rate +
        '%, invest about <strong>' + L.money(Math.ceil(need / 100) * 100) + ' a month</strong> (without step-up).';
    } else {
      goal.hidden = true;
    }

    document.getElementById('col-monthly').hidden = !isSip;
    var html = '';
    r.rows.forEach(function (row) {
      html += '<tr><td>' + row.year + '</td>' + (isSip ? '<td>' + L.money(row.monthly) + '</td>' : '') +
        '<td>' + L.money(row.invested) + '</td><td>' + L.money(row.value) + '</td><td>' + L.money(row.value - row.invested) + '</td></tr>';
    });
    document.querySelector('#growth tbody').innerHTML = html;
  }

  L.calc(form, update, 'sip');
})();
