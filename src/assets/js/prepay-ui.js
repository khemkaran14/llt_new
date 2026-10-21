/* Prepay-or-invest page. Depends on common.js and finance-engines.js. */
(function () {
  'use strict';
  var L = window.LLT, F = window.Fin;
  var form = document.getElementById('pi-form');
  if (!form || !F) return;

  function yearsMonths(m) {
    var y = Math.floor(m / 12), r = m % 12;
    return (y ? y + ' yr' : '') + (y && r ? ' ' : '') + (r ? r + ' mo' : '') || '0 mo';
  }

  // Minimal SVG line chart for two series.
  function chart(svg, series) {
    var W = 640, H = 280, P = { l: 64, r: 12, t: 12, b: 28 };
    var vals = []; series.forEach(function (s) { vals.push(s.a, s.b); });
    var min = Math.min(0, Math.min.apply(null, vals)), max = Math.max.apply(null, vals) || 1;
    var maxM = series[series.length - 1].m || 1;
    var x = function (m) { return P.l + (W - P.l - P.r) * m / maxM; };
    var y = function (v) { return P.t + (H - P.t - P.b) * (1 - (v - min) / (max - min)); };
    var path = function (k) { return series.map(function (s, i) { return (i ? 'L' : 'M') + x(s.m).toFixed(1) + ' ' + y(s[k]).toFixed(1); }).join(' '); };
    var g = '';
    for (var i = 0; i <= 4; i++) {
      var v = min + (max - min) * i / 4, yy = y(v).toFixed(1);
      g += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--line)" stroke-width="1"/>' +
        '<text x="' + (P.l - 8) + '" y="' + yy + '" dy="4" text-anchor="end" font-size="11" fill="var(--muted)">' + L.short(v) + '</text>';
    }
    var yearsTotal = Math.ceil(maxM / 12), step = yearsTotal > 20 ? 5 : yearsTotal > 10 ? 2 : 1;
    for (var yr = 0; yr <= yearsTotal; yr += step) {
      g += '<text x="' + x(Math.min(yr * 12, maxM)).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + (yr ? 'Yr ' + yr : 'Now') + '</text>';
    }
    if (min < 0) g += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y(0).toFixed(1) + '" y2="' + y(0).toFixed(1) + '" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3"/>';
    g += '<path d="' + path('a') + '" fill="none" stroke="var(--chart-1)" stroke-width="2.5" stroke-linejoin="round"/>';
    g += '<path d="' + path('b') + '" fill="none" stroke="var(--chart-2)" stroke-width="2.5" stroke-linejoin="round"/>';
    svg.innerHTML = g;
  }

  L.calc(form, function (v) {
    var o = { balance: v.balance, loanRate: v.loanRate, months: Math.round(v.years * 12), extra: v.extra, lumpsum: v.lumpsum, investReturn: v.investReturn, gainsTax: v.gainsTax };
    var r = F.prepayVsInvest(o);
    var be = F.breakEvenReturn(o);
    var win = r.winner;

    L.set('prepay-final', L.short(r.prepay.final));
    L.set('invest-final', L.short(r.invest.final));
    L.set('prepay-sub', r.prepay.closedAt != null ? 'Loan closes in ' + yearsMonths(r.prepay.closedAt) : '');
    L.set('invest-sub', 'Loan runs full ' + v.years + ' yrs');
    document.getElementById('box-prepay').classList.toggle('win', win === 'prepay');
    document.getElementById('box-invest').classList.toggle('win', win === 'invest');

    var verdict = document.getElementById('verdict');
    var pct = Math.min(r.prepay.final, r.invest.final) > 0 ? r.difference / Math.min(r.prepay.final, r.invest.final) : 0;
    if (pct < 0.02) verdict.innerHTML = '<strong>It\'s practically a tie</strong>The difference is under 2%. Pick whichever you\'re more comfortable with.';
    else verdict.innerHTML = '<strong>' + (win === 'prepay' ? 'Prepaying' : 'Investing') + ' leaves you ' + L.short(r.difference) + ' richer</strong>' +
      'after ' + v.years + ' years, compared with ' + (win === 'prepay' ? 'investing' : 'prepaying') + ' the same money.';

    var t = '';
    t += '<tr><th>Your EMI</th><td>' + L.money(r.emi) + '</td></tr>';
    t += '<tr><th>Interest paid if you prepay</th><td>' + L.money(r.prepay.interest) + '</td></tr>';
    t += '<tr><th>Interest paid if you invest</th><td>' + L.money(r.invest.interest) + '</td></tr>';
    t += '<tr><th>Interest saved by prepaying</th><td class="neg">' + L.money(r.invest.interest - r.prepay.interest) + '</td></tr>';
    document.getElementById('pi-table').innerHTML = t;

    var tip = document.getElementById('pi-tip');
    tip.innerHTML = be == null ? 'Prepaying wins even at very high investment returns.' :
      'Investing wins only if your investments earn more than <strong>' + be.toFixed(1) + '% a year</strong> on average (before tax). ' +
      (be > v.investReturn ? 'You expect ' + v.investReturn + '%, which is below that.' : 'You expect ' + v.investReturn + '%, which is above that. But remember, market returns aren\'t guaranteed, while prepaying is a sure saving.');

    chart(document.getElementById('pi-chart'), r.series);
  }, 'prepay');
})();
