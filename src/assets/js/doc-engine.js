/*
 * Shared logic for the invoice and receipt generators.
 * Browser: window.DocEngine. Node: module.exports.
 */
(function (root) {
  'use strict';

  function n(v) { var x = Number(v); return isFinite(x) ? x : 0; }
  function r2(v) { return Math.round(v * 100) / 100; }

  /*
   * items: [{ qty, rate, gst (%) , discount (%) }]
   * supply: 'intra' (CGST + SGST) | 'inter' (IGST) | 'none' (no GST)
   */
  function invoiceTotals(items, supply) {
    var lines = (items || []).map(function (it) {
      var gross = n(it.qty) * n(it.rate);
      var disc = gross * Math.min(100, Math.max(0, n(it.discount))) / 100;
      var taxable = r2(gross - disc);
      var rate = supply === 'none' ? 0 : Math.max(0, n(it.gst));
      var tax = r2(taxable * rate / 100);
      return { taxable: taxable, rate: rate, tax: tax, total: r2(taxable + tax) };
    });
    var sum = function (k) { return r2(lines.reduce(function (a, l) { return a + l[k]; }, 0)); };
    var taxable = sum('taxable'), tax = sum('tax');
    // GST split by rate, as shown on most Indian invoices
    var byRate = {};
    lines.forEach(function (l) {
      if (!l.rate) return;
      var b = byRate[l.rate] || (byRate[l.rate] = { rate: l.rate, taxable: 0, tax: 0 });
      b.taxable = r2(b.taxable + l.taxable);
      b.tax = r2(b.tax + l.tax);
    });
    var exact = r2(taxable + tax);
    var rounded = Math.round(exact);
    return {
      lines: lines,
      taxable: taxable,
      tax: tax,
      cgst: supply === 'intra' ? r2(tax / 2) : 0,
      sgst: supply === 'intra' ? r2(tax - r2(tax / 2)) : 0,
      igst: supply === 'inter' ? tax : 0,
      byRate: Object.keys(byRate).map(function (k) { return byRate[k]; }).sort(function (a, b) { return a.rate - b.rate; }),
      roundOff: r2(rounded - exact),
      grandTotal: rounded
    };
  }

  /*
   * Fill "{key}" placeholders with HTML-escaped values.
   * A part wrapped in [[ ... ]] is dropped when any placeholder inside it is empty.
   */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fill(template, values) {
    var get = function (k) { var v = values[k]; return v == null ? '' : String(v); };
    var out = String(template).replace(/\[\[([\s\S]*?)\]\]/g, function (all, inner) {
      var keys = inner.match(/\{(\w+)\}/g) || [];
      for (var i = 0; i < keys.length; i++) if (!get(keys[i].slice(1, -1)).trim()) return '';
      return inner;
    });
    return out.replace(/\{(\w+)\}/g, function (all, k) { return '<strong>' + esc(get(k)) + '</strong>'; });
  }

  // UPI payment link for QR codes. https://www.npci.org.in/ (UPI linking spec)
  function upiLink(o) {
    var vpa = String(o.vpa || '').trim();
    if (!/^[\w.\-]{2,256}@[a-zA-Z][\w]{1,64}$/.test(vpa)) return '';
    var q = 'pa=' + encodeURIComponent(vpa).replace('%40', '@');
    if (o.name) q += '&pn=' + encodeURIComponent(o.name);
    if (n(o.amount) > 0) q += '&am=' + n(o.amount).toFixed(2);
    q += '&cu=INR';
    if (o.note) q += '&tn=' + encodeURIComponent(String(o.note).slice(0, 80));
    return 'upi://pay?' + q;
  }

  // Basic GSTIN format check: 2-digit state, PAN, entity number, Z, checksum.
  function validGstin(g) { return /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(g || '').toUpperCase()); }

  var api = { invoiceTotals: invoiceTotals, fill: fill, esc: esc, upiLink: upiLink, validGstin: validGstin };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DocEngine = api;
})(this);
