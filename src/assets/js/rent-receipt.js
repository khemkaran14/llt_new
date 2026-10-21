/* Rent receipt generator. Depends on common.js and words.js. Nothing is sent to a server. */
(function () {
  'use strict';
  var L = window.LLT, W = window.InWords;
  var form = document.getElementById('rr-form');
  if (!form || !W) return;
  var out = document.getElementById('receipts');
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function monthsBetween(from, to) {
    if (!from || !to) return [];
    var a = from.split('-').map(Number), b = to.split('-').map(Number);
    var list = [], y = a[0], m = a[1] - 1;
    while ((y < b[0] || (y === b[0] && m <= b[1] - 1)) && list.length < 24) {
      list.push({ y: y, m: m });
      m++; if (m > 11) { m = 0; y++; }
    }
    return list;
  }

  // Default period: this financial year, April to the current month.
  var now = new Date();
  var fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  if (!form.from.value) form.from.value = fyStart + '-04';
  if (!form.to.value) form.to.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  function update(v) {
    var months = monthsBetween(v.from, v.to);
    var rent = v.rent || 0;
    var cash = v.mode === 'Cash';
    var stamp = cash && rent > 5000;
    var pan = String(v.pan || '').toUpperCase();
    var yearly = rent * 12;
    var warn = [];
    if (yearly > 100000 && !pan) warn.push('Your rent is over ₹1 lakh a year, so your employer will ask for the landlord\'s PAN.');
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) warn.push('The PAN doesn\'t look right. It should be 10 characters, like ABCDE1234F.');
    if (!v.tenant || !v.landlord || !v.address || !rent) warn.push('Fill in your name, the landlord\'s name, the address and the rent to complete the receipts.');
    var w = document.getElementById('rr-warn');
    w.hidden = !warn.length;
    w.innerHTML = warn.join('<br>');

    L.set('rr-count', months.length + ' receipt' + (months.length === 1 ? '' : 's') + ' · total ' + L.money(rent * months.length));
    out.innerHTML = months.map(function (mm, i) {
      var day = Math.min(Number(v.day) || 1, new Date(mm.y, mm.m + 1, 0).getDate());
      var dateStr = String(day).padStart(2, '0') + '/' + String(mm.m + 1).padStart(2, '0') + '/' + mm.y;
      return '<div class="receipt">' +
        '<div class="receipt-head"><strong>RENT RECEIPT</strong><span>No. ' + (i + 1) + ' · Date: ' + dateStr + '</span></div>' +
        '<p>Received a sum of <strong>' + L.money(rent) + '</strong> (' + esc(W.rupees(rent)) + ') from <strong>' + esc(v.tenant || '__________') +
        '</strong> towards the rent of <strong>' + esc(v.address || '__________') + '</strong> for the month of <strong>' + MONTHS[mm.m] + ' ' + mm.y +
        '</strong>, paid by ' + esc(v.mode) + '.</p>' +
        '<div class="receipt-foot"><div>' + (stamp ? '<div class="stamp">Revenue<br>stamp</div>' : '') + '</div>' +
        '<div class="sign"><div class="sign-line"></div>' + esc(v.landlord || 'Landlord') + ' (Landlord)' +
        (pan ? '<br>PAN: ' + esc(pan) : '') + (v.landlordAddress ? '<br>' + esc(v.landlordAddress) : '') + '</div></div></div>';
    }).join('');
  }

  var calc = L.calc(form, update, 'rent-receipt');

  document.getElementById('rr-print').addEventListener('click', function () {
    document.documentElement.classList.add('print-receipts');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.documentElement.classList.remove('print-receipts'); });
  document.getElementById('rr-clear').addEventListener('click', function () {
    form.querySelectorAll('input[type="text"]').forEach(function (el) { el.value = ''; });
    calc.run();
  });
})();
