/* UPI QR standee maker. Depends on common.js, vendor/qrcode.js and doc-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, D = window.DocEngine;
  var form = document.getElementById('upi-form');
  if (!form || !D || !window.qrcode) return;
  var sheet = document.getElementById('u-sheet');
  var THEMES = {
    teal: { band: '#0f766e', bandInk: '#ffffff', bg: '#f0faf8', accent: '#0f766e' },
    saffron: { band: '#e8730c', bandInk: '#ffffff', bg: '#fff7ec', accent: '#c25a00' },
    navy: { band: '#1d3d85', bandInk: '#ffffff', bg: '#f1f4fb', accent: '#1d3d85' },
    royal: { band: '#111111', bandInk: '#f3d47c', bg: '#fffaf0', accent: '#8a6a1f' }
  };
  var esc = D.esc;

  function qrSvg(text) {
    var q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  function standee(v, link) {
    var t = THEMES[v.theme] || THEMES.teal;
    return '<div class="upi-card" style="--u-band:' + t.band + ';--u-band-ink:' + t.bandInk + ';--u-bg:' + t.bg + ';--u-accent:' + t.accent + '">' +
      '<div class="upi-band"><div class="upi-shop">' + esc(v.shop || 'Your Shop Name') + '</div></div>' +
      '<div class="upi-body">' +
        '<div class="upi-scan">SCAN &amp; PAY</div>' +
        '<div class="upi-qrbox">' + (link ? qrSvg(link) : '<div class="upi-qr-empty">Enter your UPI ID</div>') + '</div>' +
        (Number(v.amount) > 0 ? '<div class="upi-amount">Amount: ' + L.money(v.amount) + '</div>' : '') +
        '<div class="upi-id">' + esc(v.vpa || 'yourname@bank') + '</div>' +
        (v.payee ? '<div class="upi-payee">' + esc(v.payee) + '</div>' : '') +
        '<div class="upi-apps">Pay with any UPI app<br><span>Google Pay · PhonePe · Paytm · BHIM · bank apps</span></div>' +
        (v.phone ? '<div class="upi-phone">📞 ' + esc(v.phone) + '</div>' : '') +
      '</div>' +
      '<div class="upi-foot">Made free at livelifetricks.com</div>' +
      '</div>';
  }

  function update(v) {
    var link = D.upiLink({ vpa: v.vpa, name: v.payee || v.shop, amount: v.amount, note: v.note });
    var w = document.getElementById('u-warn');
    w.hidden = !v.vpa || !!link;
    w.textContent = 'That UPI ID doesn\'t look right. It should look like name@bank, e.g. sharmastore@okicici.';
    var copies = v.size === 'a6' ? 4 : v.size === 'a5' ? 2 : 1;
    sheet.className = 'upi-sheet upi-' + (v.size || 'a4');
    var html = '';
    for (var i = 0; i < copies; i++) html += standee(v, link);
    sheet.innerHTML = html;
  }

  var calc = L.calc(form, update, 'upi');
  document.getElementById('u-print').addEventListener('click', function () {
    document.documentElement.classList.add('print-upi');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.documentElement.classList.remove('print-upi'); });
  document.getElementById('u-png').addEventListener('click', function () {
    var btn = this, card = sheet.querySelector('.upi-card');
    btn.textContent = 'Preparing…';
    var go = function () {
      window.html2canvas(card, { scale: 3, backgroundColor: '#ffffff', logging: false }).then(function (c) {
        var a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = 'upi-qr-' + String(form.querySelector('[data-key="shop"]').value || 'shop').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        btn.textContent = 'Download PNG';
      });
    };
    if (window.html2canvas) go();
    else {
      var s = document.createElement('script');
      s.src = '/assets/js/vendor/html2canvas.min.js';
      s.onload = go;
      document.head.appendChild(s);
    }
  });
  calc.run();
})();
