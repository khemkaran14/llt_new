/* GST calculator page. Depends on common.js and finance-engines.js. */
(function () {
  'use strict';
  var L = window.LLT, F = window.Fin;
  var form = document.getElementById('gst-form');
  if (!form || !F) return;

  // Keep paise for GST amounts.
  var fmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rs = function (v) { return '₹' + fmt.format(v || 0); };
  var lines = [];

  L.calc(form, function (v) {
    var rate = v.custom > 0 ? v.custom : Number(v.rate) || 0;
    var r = F.gst({ amount: v.amount, rate: rate, mode: v.mode });
    var add = v.mode !== 'remove';
    L.set('amount-label', add ? 'Price before GST' : 'Price including GST');
    L.set('result-title', add ? 'Total price with GST' : 'Price before GST');
    L.set('total-out', rs(add ? r.total : r.base));

    lines = [['Price before GST', r.base]];
    if (v.supply === 'inter') lines.push(['IGST (' + rate + '%)', r.igst]);
    else lines.push(['CGST (' + rate / 2 + '%)', r.cgst], ['SGST (' + rate / 2 + '%)', r.sgst]);
    lines.push(['Total GST', r.gst], ['Total price', r.total]);
    document.getElementById('breakdown').innerHTML = lines.map(function (l, i) {
      return '<tr' + (i === lines.length - 1 ? ' class="total"' : '') + '><th>' + l[0] + '</th><td>' + rs(l[1]) + '</td></tr>';
    }).join('');
  }, 'gst');

  document.getElementById('copy').addEventListener('click', function () {
    var text = lines.map(function (l) { return l[0] + ': ' + rs(l[1]); }).join('\n');
    var btn = this;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied ✓';
      setTimeout(function () { btn.textContent = 'Copy breakdown'; }, 2000);
    });
  });
})();
