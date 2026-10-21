/* Receipt generator pages. Reads the page's receipt config. Depends on common.js, words.js and doc-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, D = window.DocEngine, W = window.InWords;
  var form = document.getElementById('rc-form');
  var cfgEl = document.getElementById('receipt-config');
  if (!form || !D || !cfgEl) return;
  var cfg = JSON.parse(cfgEl.textContent);
  var out = document.getElementById('rc-docs');
  var key = 'receipt:' + location.pathname.replace(/\W+/g, '');
  var fmt2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rs = function (v) { var x = Number(v) || 0; return '₹' + (x % 1 ? fmt2.format(x) : L.num(x)); };
  var esc = D.esc;

  function niceDate(d) { if (!d) return ''; var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  // Plain fill (no bold) for headers and signature names
  function plain(t, v) { return D.fill(t, v).replace(/<\/?strong>/g, ''); }

  function receipt(v, copy) {
    var issuer = cfg.issuer.map(function (k) { return v[k] || ''; });
    var signers = cfg.signers.map(function (s) {
      var name = plain(s.name, v);
      return '<div class="rc-sign"><div class="sign-line"></div><div>' + esc(s.label) + (name ? ': ' + name : '') + '</div>' +
        (s.sub ? '<div class="doc-muted">' + plain(s.sub, v) + '</div>' : '') + '</div>';
    }).join('');
    return '<div class="doc rc-doc">' +
      (copy ? '<div class="doc-copy">' + copy + '</div>' : '') +
      '<div class="doc-top"><div><div class="doc-biz">' + esc(issuer[0] || '') + '</div>' +
        (issuer[1] ? '<div class="doc-muted">' + esc(issuer[1]) + '</div>' : '') + '</div>' +
        '<div class="doc-meta"><div class="doc-title">' + esc(cfg.docTitle) + '</div>' +
        (v.receiptNo ? '<div>No. <strong>' + esc(v.receiptNo) + '</strong></div>' : '') +
        (v.date ? '<div>Date: ' + niceDate(v.date) + '</div>' : '') + '</div></div>' +
      '<p class="rc-text">' + D.fill(cfg.sentence, v) + '</p>' +
      (cfg.extra && D.fill(cfg.extra, v) ? '<p class="rc-text">' + D.fill(cfg.extra, v) + '</p>' : '') +
      (cfg.note && v[cfg.note] ? '<div class="doc-label">Terms</div><p class="rc-text doc-pre">' + esc(v[cfg.note]) + '</p>' : '') +
      '<div class="rc-bottom"><div class="rc-amount">' + rs(v.amount) + '</div><div class="rc-signs">' + signers + '</div></div>' +
      '</div>';
  }

  function update(v) {
    var amount = Number(v.amount) || 0;
    v.amountFmt = amount ? rs(amount) : '';
    v.amountWords = amount ? W.rupees(amount) : '';
    v.dateFmt = niceDate(v.date);
    v.balanceFmt = Number(v.balance) > 0 ? rs(v.balance) : '';
    if (v.landlordPan) v.landlordPan = String(v.landlordPan).toUpperCase();

    L.set('rc-amount', amount ? rs(amount) : '₹0');
    L.set('rc-words', v.amountWords);

    var warn = [];
    if (!amount) warn.push('Enter the amount received.');
    if (v.mode === 'Cash' && amount > 5000) warn.push('Cash over ₹5,000: it\'s common to sign across a revenue stamp on the receipt.');
    if (v.mode === 'Cash' && amount >= 200000) warn.push('Cash receipts of ₹2 lakh or more for a single transaction aren\'t allowed under income tax rules (Section 269ST). Use a bank transfer or UPI.');
    if (v.landlordPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.landlordPan)) warn.push('The PAN doesn\'t look right. It should be 10 characters, like ABCDE1234F.');
    var w = document.getElementById('rc-warn');
    w.hidden = !warn.length;
    w.innerHTML = warn.join('<br>');

    out.innerHTML = v.copies ? receipt(v, 'Original') + receipt(v, 'Duplicate (office copy)') : receipt(v, '');
  }

  var dateEl = form.querySelector('[data-key="date"]');
  var calc = L.calc(form, update, key);
  if (dateEl && !dateEl.value) { dateEl.value = new Date().toISOString().slice(0, 10); calc.run(); }

  document.getElementById('rc-print').addEventListener('click', function () {
    document.documentElement.classList.add('print-doc');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.documentElement.classList.remove('print-doc'); });

  // Next receipt: bump the number, clear who paid and how much, keep your own details.
  var keepKeys = cfg.issuer.concat(['mode', 'terms', 'society', 'societyReg', 'treasurer', 'institute', 'instituteAddress', 'landlord', 'landlordContact', 'landlordPan', 'receiver', 'receiverAddress', 'course', 'seller', 'sellerAddress']);
  document.getElementById('rc-next').addEventListener('click', function () {
    form.querySelectorAll('[data-key]').forEach(function (el) {
      var k = el.dataset.key;
      if (k === 'receiptNo') {
        var m = String(el.value).match(/^(.*?)(\d+)(\D*)$/);
        if (m) el.value = m[1] + String(Number(m[2]) + 1).padStart(m[2].length, '0') + m[3];
      } else if (k === 'date') el.value = new Date().toISOString().slice(0, 10);
      else if (el.type !== 'checkbox' && el.tagName !== 'SELECT' && keepKeys.indexOf(k) === -1) el.value = '';
    });
    calc.run();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  });
})();
