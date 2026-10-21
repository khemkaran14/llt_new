// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/assets/js/doc-engine.js');

test('invoice totals with CGST + SGST, discount and round-off', () => {
  const t = D.invoiceTotals([
    { qty: 2, rate: 500, gst: 18 },              // 1000 + 180
    { qty: 1, rate: 1000, gst: 5, discount: 10 }, // 900 + 45
    { qty: 3, rate: 33.33, gst: 18 }             // 99.99 + 18
  ], 'intra');
  assert.equal(t.taxable, 1999.99);
  assert.equal(t.tax, 243);
  assert.equal(t.cgst, 121.5);
  assert.equal(t.sgst, 121.5);
  assert.equal(t.igst, 0);
  assert.equal(t.grandTotal, 2243);
  assert.equal(t.roundOff, 0.01);
  assert.deepEqual(t.byRate.map(b => b.rate), [5, 18]);
});

test('IGST for other-state sales and no GST for bill of supply', () => {
  const items = [{ qty: 1, rate: 10000, gst: 18 }];
  assert.equal(D.invoiceTotals(items, 'inter').igst, 1800);
  const none = D.invoiceTotals(items, 'none');
  assert.equal(none.tax, 0);
  assert.equal(none.grandTotal, 10000);
});

test('template fill escapes HTML and drops empty optional parts', () => {
  const html = D.fill('From {payer}[[ (ref {ref})]] for {purpose}.', { payer: '<b>Asha</b>', purpose: 'fees', ref: '' });
  assert.equal(html, 'From <strong>&lt;b&gt;Asha&lt;/b&gt;</strong> for <strong>fees</strong>.');
  assert.ok(D.fill('[[ref {ref}]]', { ref: 'UTR123' }).includes('UTR123'));
});

test('UPI link and GSTIN checks', () => {
  assert.equal(D.upiLink({ vpa: 'shop@okicici', name: 'My Shop', amount: 1180, note: 'INV-1' }),
    'upi://pay?pa=shop@okicici&pn=My%20Shop&am=1180.00&cu=INR&tn=INV-1');
  assert.equal(D.upiLink({ vpa: 'not a vpa' }), '');
  assert.equal(D.validGstin('27AAPFU0939F1ZV'), true);
  assert.equal(D.validGstin('27AAPFU0939F1Z'), false);
});
