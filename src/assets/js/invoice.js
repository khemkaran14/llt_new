/* Invoice / quotation generator. Depends on common.js, vendor/qrcode.js, words.js and doc-engine.js. */
(function () {
  'use strict';
  var L = window.LLT, D = window.DocEngine, W = window.InWords;
  var form = document.getElementById('inv-form');
  if (!form || !D) return;

  var page = location.pathname.replace(/\W+/g, '');
  var itemsEl = document.getElementById('items');
  var docEl = document.getElementById('doc');
  var GST_RATES = [0, 0.25, 3, 5, 18, 40];
  var fmt2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rs = function (v) { return '₹' + fmt2.format(v || 0); };
  var esc = D.esc;
  var calc;

  // ---- items ----
  function itemRow(it) {
    it = it || {};
    var opts = GST_RATES.map(function (r) { return '<option value="' + r + '"' + (Number(it.gst != null ? it.gst : 18) === r ? ' selected' : '') + '>' + r + '%</option>'; }).join('');
    var div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML =
      '<div class="field it-desc"><label>Item / service</label><input type="text" data-f="desc" maxlength="120" value="' + esc(it.desc || '') + '"></div>' +
      '<div class="field it-hsn"><label>HSN/SAC</label><input type="text" data-f="hsn" maxlength="10" value="' + esc(it.hsn || '') + '"></div>' +
      '<div class="field it-qty"><label>Qty</label><input type="number" data-f="qty" min="0" step="any" value="' + (it.qty != null ? it.qty : 1) + '"></div>' +
      '<div class="field it-rate"><label>Rate (₹)</label><input type="number" data-f="rate" min="0" step="any" value="' + (it.rate != null ? it.rate : '') + '"></div>' +
      '<div class="field it-disc"><label>Disc %</label><input type="number" data-f="discount" min="0" max="100" step="any" value="' + (it.discount || '') + '"></div>' +
      '<div class="field it-gst"><label>GST</label><select data-f="gst">' + opts + '</select></div>' +
      '<button type="button" class="btn it-del" aria-label="Remove item">✕</button>';
    itemsEl.appendChild(div);
  }
  function readItems() {
    return [].map.call(itemsEl.querySelectorAll('.item-row'), function (row) {
      var o = {};
      row.querySelectorAll('[data-f]').forEach(function (el) { o[el.dataset.f] = el.type === 'number' || el.tagName === 'SELECT' ? parseFloat(el.value) || 0 : el.value; });
      return o;
    });
  }
  itemsEl.addEventListener('click', function (e) {
    var del = e.target.closest('.it-del');
    if (!del) return;
    if (itemsEl.children.length > 1) del.closest('.item-row').remove();
    calc.run();
  });
  document.getElementById('add-item').addEventListener('click', function () { itemRow({ gst: lastGst() }); calc.run(); itemsEl.lastChild.querySelector('input').focus(); });
  function lastGst() { var s = itemsEl.querySelectorAll('select[data-f="gst"]'); return s.length ? Number(s[s.length - 1].value) : 18; }

  // ---- logo ----
  var logo = null;
  try { logo = localStorage.getItem('llt:invoice-logo'); } catch (e) { /* private mode */ }
  var logoInput = document.getElementById('logo'), logoRemove = document.getElementById('logo-remove');
  logoRemove.hidden = !logo;
  logoInput.addEventListener('change', function () {
    var f = logoInput.files[0];
    if (!f) return;
    if (f.size > 300 * 1024) { alert('Please choose a logo under 300 KB.'); logoInput.value = ''; return; }
    var r = new FileReader();
    r.onload = function () {
      logo = r.result;
      try { localStorage.setItem('llt:invoice-logo', logo); } catch (e) { /* storage full */ }
      logoRemove.hidden = false;
      calc.run();
    };
    r.readAsDataURL(f);
  });
  logoRemove.addEventListener('click', function () {
    logo = null; logoInput.value = ''; logoRemove.hidden = true;
    try { localStorage.removeItem('llt:invoice-logo'); } catch (e) { /* ignore */ }
    calc.run();
  });

  function qrSvg(text) {
    if (!text || !window.qrcode) return '';
    var q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
  }
  function niceDate(d) {
    if (!d) return '';
    var p = d.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  // ---- render ----
  function update(v) {
    var items = readItems();
    var isChallan = v.docType === 'Delivery Challan';
    var supply = v.supply || 'intra';
    var t = D.invoiceTotals(items, supply);
    var gstOn = supply !== 'none';
    var dueLabel = { 'Quotation': 'Valid until', 'Proforma Invoice': 'Valid until', 'Delivery Challan': 'Delivery date' }[v.docType] || 'Due date';
    L.set('due-label', dueLabel);
    L.set('sum-title', v.docType + ' total');
    L.set('sum-total', rs(t.grandTotal));

    var sum = '<tr><th>Taxable value</th><td>' + rs(t.taxable) + '</td></tr>';
    if (supply === 'intra') sum += '<tr><th>CGST</th><td>' + rs(t.cgst) + '</td></tr><tr><th>SGST</th><td>' + rs(t.sgst) + '</td></tr>';
    if (supply === 'inter') sum += '<tr><th>IGST</th><td>' + rs(t.igst) + '</td></tr>';
    if (t.roundOff) sum += '<tr><th>Round off</th><td>' + rs(t.roundOff) + '</td></tr>';
    sum += '<tr class="total"><th>Total</th><td>' + rs(t.grandTotal) + '</td></tr>';
    document.getElementById('sum-table').innerHTML = sum;

    var warn = [];
    var gstin = String(v.sGstin || '').toUpperCase();
    if (gstOn && !gstin) warn.push('You\'re charging GST but haven\'t entered your GSTIN. Only GST-registered businesses can charge GST. Choose "No GST" if you aren\'t registered.');
    if (gstin && !D.validGstin(gstin)) warn.push('Your GSTIN doesn\'t look right. It should be 15 characters, like 27ABCDE1234F1Z5.');
    if (v.docType === 'Tax Invoice' && !gstOn) warn.push('A "Tax Invoice" is for GST-registered sellers charging GST. Without GST, choose "Invoice (no GST)".');
    if (v.bGstin && !D.validGstin(v.bGstin)) warn.push('The customer\'s GSTIN doesn\'t look right.');
    if (String(v.number || '').length > 16 && /Invoice/.test(v.docType)) warn.push('GST invoice numbers can be at most 16 characters.');
    var w = document.getElementById('inv-warn');
    w.hidden = !warn.length;
    w.innerHTML = warn.join('<br><br>');

    // Document preview
    var upi = (!isChallan && v.docType !== 'Quotation') ? D.upiLink({ vpa: v.upi, name: v.sName, amount: t.grandTotal, note: v.number }) : '';
    var rows = items.map(function (it, i) {
      var l = t.lines[i];
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(it.desc || '—') + (it.hsn ? '<div class="doc-muted">HSN/SAC ' + esc(it.hsn) + '</div>' : '') + '</td>' +
        '<td class="num">' + (it.qty || 0) + '</td><td class="num">' + rs(it.rate) + '</td>' +
        (items.some(function (x) { return x.discount; }) ? '<td class="num">' + (it.discount ? it.discount + '%' : '—') + '</td>' : '') +
        '<td class="num">' + rs(l.taxable) + '</td>' + (gstOn ? '<td class="num">' + l.rate + '%</td><td class="num">' + rs(l.tax) + '</td>' : '') +
        '<td class="num">' + rs(l.total) + '</td></tr>';
    }).join('');
    var hasDisc = items.some(function (x) { return x.discount; });
    var head = '<tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate</th>' + (hasDisc ? '<th class="num">Disc</th>' : '') +
      '<th class="num">Taxable</th>' + (gstOn ? '<th class="num">GST</th><th class="num">Tax</th>' : '') + '<th class="num">Amount</th></tr>';

    var taxRows = '';
    if (gstOn) t.byRate.forEach(function (b) {
      taxRows += supply === 'intra'
        ? '<tr><td>CGST ' + b.rate / 2 + '% + SGST ' + b.rate / 2 + '% on ' + rs(b.taxable) + '</td><td class="num">' + rs(b.tax) + '</td></tr>'
        : '<tr><td>IGST ' + b.rate + '% on ' + rs(b.taxable) + '</td><td class="num">' + rs(b.tax) + '</td></tr>';
    });

    docEl.innerHTML =
      '<div class="doc-top">' +
        '<div class="doc-from">' + (logo ? '<img class="doc-logo" src="' + logo + '" alt="">' : '') +
          '<div><div class="doc-biz">' + esc(v.sName || 'Your Business Name') + '</div>' +
          '<div class="doc-muted">' + esc(v.sAddress || '') + '</div>' +
          (v.sPhone || v.sEmail ? '<div class="doc-muted">' + esc([v.sPhone, v.sEmail].filter(Boolean).join(' · ')) + '</div>' : '') +
          (gstin ? '<div class="doc-muted">GSTIN: ' + esc(gstin) + '</div>' : '') + '</div></div>' +
        '<div class="doc-meta"><div class="doc-title">' + esc(v.docType.toUpperCase()) + '</div>' +
          '<div>No. <strong>' + esc(v.number || '') + '</strong></div>' +
          (v.date ? '<div>Date: ' + niceDate(v.date) + '</div>' : '') +
          (v.due ? '<div>' + dueLabel + ': ' + niceDate(v.due) + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="doc-to"><div class="doc-label">' + (isChallan ? 'Deliver to' : v.docType === 'Quotation' ? 'Quotation for' : 'Bill to') + '</div>' +
        '<div><strong>' + esc(v.bName || 'Customer name') + '</strong></div><div class="doc-muted">' + esc(v.bAddress || '') + '</div>' +
        (v.bGstin ? '<div class="doc-muted">GSTIN: ' + esc(String(v.bGstin).toUpperCase()) + '</div>' : '') +
        (supply === 'inter' ? '<div class="doc-muted">Supply to another state (IGST)</div>' : '') + '</div>' +
      '<table class="doc-items"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>' +
      '<div class="doc-bottom">' +
        '<div class="doc-left">' +
          '<div class="doc-label">Amount in words</div><div>' + esc(W.rupees(t.grandTotal)) + '</div>' +
          (taxRows ? '<table class="doc-taxsum">' + taxRows + '</table>' : '') +
          (upi ? '<div class="doc-pay"><div class="doc-qr">' + qrSvg(upi) + '</div><div><div class="doc-label">Scan to pay with any UPI app</div><div>' + esc(v.upi) + '</div><div class="doc-muted">Amount ' + rs(t.grandTotal) + '</div></div></div>' : '') +
          (v.bank ? '<div class="doc-label">Bank details</div><div class="doc-pre">' + esc(v.bank) + '</div>' : '') +
          (v.notes ? '<div class="doc-label">Notes</div><div class="doc-pre">' + esc(v.notes) + '</div>' : '') +
        '</div>' +
        '<div class="doc-right"><table class="doc-totals">' +
          '<tr><td>Taxable value</td><td class="num">' + rs(t.taxable) + '</td></tr>' +
          (supply === 'intra' ? '<tr><td>CGST</td><td class="num">' + rs(t.cgst) + '</td></tr><tr><td>SGST</td><td class="num">' + rs(t.sgst) + '</td></tr>' : '') +
          (supply === 'inter' ? '<tr><td>IGST</td><td class="num">' + rs(t.igst) + '</td></tr>' : '') +
          (t.roundOff ? '<tr><td>Round off</td><td class="num">' + rs(t.roundOff) + '</td></tr>' : '') +
          '<tr class="grand"><td>Total</td><td class="num">' + rs(t.grandTotal) + '</td></tr></table>' +
          '<div class="doc-sign"><div>For ' + esc(v.sName || 'Your Business Name') + '</div><div class="sign-line"></div><div>' + esc(v.signer || 'Authorised signatory') + '</div></div>' +
        '</div>' +
      '</div>' +
      (isChallan ? '<p class="doc-muted doc-foot">Goods sent on delivery challan, not a sale.</p>' : '');

    try { localStorage.setItem('llt:items:' + page, JSON.stringify(items)); } catch (e) { /* ignore */ }
  }

  // Start with saved items, or one example row.
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('llt:items:' + page)); } catch (e) { /* ignore */ }
  (saved && saved.length ? saved : [{ desc: '', qty: 1, rate: '', gst: 18 }]).forEach(itemRow);

  if (!form.date.value) form.date.value = new Date().toISOString().slice(0, 10);
  calc = L.calc(form, update, 'invoice:' + page);
  if (window.LLT_DEFAULT_DOC && !L.store.get('invoice:' + page)) { form.docType.value = window.LLT_DEFAULT_DOC; calc.run(); }
  if (!form.date.value) { form.date.value = new Date().toISOString().slice(0, 10); calc.run(); }

  document.getElementById('inv-print').addEventListener('click', function () {
    document.documentElement.classList.add('print-doc');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.documentElement.classList.remove('print-doc'); });

  // Next document: keep your business details, clear the customer and items, bump the number.
  document.getElementById('inv-new').addEventListener('click', function () {
    var num = String(form.number.value || '');
    var m = num.match(/^(.*?)(\d+)(\D*)$/);
    if (m) form.number.value = m[1] + String(Number(m[2]) + 1).padStart(m[2].length, '0') + m[3];
    ['bName', 'bGstin', 'bAddress', 'due'].forEach(function (k) { form[k].value = ''; });
    form.date.value = new Date().toISOString().slice(0, 10);
    itemsEl.innerHTML = '';
    itemRow({ gst: lastGst() });
    calc.run();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  });
})();
