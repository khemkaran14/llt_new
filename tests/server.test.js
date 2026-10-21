// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const crypto = require('crypto');
const { createApp } = require('../server/api.js');
const { createStore } = require('../server/store.js');
const { verifyPayment } = require('../server/razorpay.js');

const SECRET = 'rzp_secret_test';
const fakeRazorpay = {
  keyId: 'rzp_test_abc',
  createOrder: async ({ amount }) => ({ id: 'order_' + crypto.randomBytes(4).toString('hex'), amount }),
  verifyPayment: (o) => verifyPayment(o, SECRET)
};
const sign = (orderId, paymentId) => crypto.createHmac('sha256', SECRET).update(orderId + '|' + paymentId).digest('hex');
const H1 = 'a'.repeat(64), H2 = 'b'.repeat(64);

async function withServer(opts, fn) {
  let now = Date.parse('2026-10-21T10:00:00Z');
  const app = createApp(Object.assign({ store: createStore(null), razorpay: fakeRazorpay, adminPassword: 'pw123', webhookSecret: 'wh', now: () => now }, opts));
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (method, path, body, headers) => {
    const r = await fetch(base + path, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch (e) { /* not json */ }
    return { status: r.status, json, text, headers: r.headers };
  };
  try { await fn(call, ms => { now += ms; }); } finally { server.close(); }
}

test('free design: email required, then downloads allowed and edits allowed', () => withServer({}, async (call) => {
  let r = await call('POST', '/api/biodata/start', { email: 'bad', templateId: 'classic-maroon', dataHash: H1 });
  assert.equal(r.status, 400);
  r = await call('POST', '/api/biodata/start', { email: 'Asha@Example.com', name: 'Asha', templateId: 'classic-maroon', dataHash: H1, consent: true });
  assert.equal(r.status, 200);
  assert.equal(r.json.free, true);
  const { orderId, token } = r.json;
  r = await call('POST', '/api/biodata/download', { orderId, token, kind: 'pdf', dataHash: H1 });
  assert.equal(r.json.ok, true);
  r = await call('POST', '/api/biodata/download', { orderId, token, kind: 'jpg', dataHash: H2 });
  assert.equal(r.json.ok, true, 'free designs can be edited and downloaded again');
  r = await call('POST', '/api/biodata/download', { orderId, token: 'x'.repeat(40), kind: 'pdf', dataHash: H1 });
  assert.equal(r.status, 403);
}));

test('premium design: pay, download PDF and JPG, then edits need a new payment', () => withServer({}, async (call, advance) => {
  let r = await call('POST', '/api/biodata/start', { email: 'ravi@example.com', name: 'Ravi', templateId: 'royal-maroon', dataHash: H1 });
  assert.equal(r.json.free, false);
  assert.equal(r.json.amount, 2000);
  const { orderId, razorpayOrderId } = r.json;
  // Not paid yet
  r = await call('POST', '/api/biodata/verify', { orderId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'pay_1', razorpay_signature: 'f'.repeat(64) });
  assert.equal(r.status, 400, 'bad signature rejected');
  r = await call('POST', '/api/biodata/verify', { orderId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: 'pay_1', razorpay_signature: sign(razorpayOrderId, 'pay_1') });
  assert.equal(r.status, 200);
  const token = r.json.token;
  r = await call('POST', '/api/biodata/download', { orderId, token, kind: 'pdf', dataHash: H1 });
  assert.equal(r.json.ok, true);
  r = await call('POST', '/api/biodata/download', { orderId, token, kind: 'jpg', dataHash: H1 });
  assert.equal(r.json.ok, true);
  r = await call('POST', '/api/biodata/download', { orderId, token, kind: 'pdf', dataHash: H2 });
  assert.equal(r.status, 409);
  assert.equal(r.json.code, 'changed');
  advance(49 * 3600 * 1000);
  r = await call('POST', '/api/biodata/download', { orderId, token, kind: 'pdf', dataHash: H1 });
  assert.equal(r.status, 410);
}));

test('premium price cannot be skipped by claiming a design is free', () => withServer({}, async (call) => {
  const r = await call('POST', '/api/biodata/start', { email: 'x@example.com', templateId: 'midnight-gold', tier: 'free', dataHash: H1 });
  assert.equal(r.json.free, false);
}));

test('without Razorpay keys, premium is refused unless dev payments are on', async () => {
  await withServer({ razorpay: null }, async (call) => {
    const r = await call('POST', '/api/biodata/start', { email: 'x@example.com', templateId: 'royal-maroon', dataHash: H1 });
    assert.equal(r.status, 503);
  });
  await withServer({ razorpay: null, devPayments: true }, async (call) => {
    let r = await call('POST', '/api/biodata/start', { email: 'x@example.com', templateId: 'royal-maroon', dataHash: H1 });
    assert.equal(r.json.dev, true);
    r = await call('POST', '/api/biodata/verify', { orderId: r.json.orderId, dev: true });
    assert.ok(r.json.token);
  });
});

test('webhook marks an order paid only with a valid signature', () => withServer({}, async (call) => {
  let r = await call('POST', '/api/biodata/start', { email: 'w@example.com', templateId: 'peacock-band', dataHash: H1 });
  const { orderId, razorpayOrderId } = r.json;
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_9', order_id: razorpayOrderId } } } });
  r = await call('POST', '/api/biodata/webhook', body, { 'X-Razorpay-Signature': 'nope' });
  assert.equal(r.status, 400);
  const sig = crypto.createHmac('sha256', 'wh').update(body).digest('hex');
  r = await call('POST', '/api/biodata/webhook', body, { 'X-Razorpay-Signature': sig });
  assert.equal(r.status, 200);
  r = await call('POST', '/api/biodata/verify', { orderId });
  assert.ok(r.json.token, 'already paid via webhook');
}));

test('admin: login required, wrong password refused, orders and CSV visible after login', () => withServer({}, async (call) => {
  await call('POST', '/api/biodata/start', { email: 'a@example.com', name: 'A', templateId: 'classic-maroon', dataHash: H1 });
  let r = await call('GET', '/api/admin/orders');
  assert.equal(r.status, 401);
  r = await call('POST', '/api/admin/login', { password: 'wrong' });
  assert.equal(r.status, 401);
  r = await call('POST', '/api/admin/login', { password: 'pw123' });
  assert.equal(r.status, 200);
  const cookie = r.headers.get('set-cookie').split(';')[0];
  r = await call('GET', '/api/admin/orders', null, { Cookie: cookie });
  assert.equal(r.json.summary.orders, 1);
  assert.equal(r.json.rows[0].email, 'a@example.com');
  r = await call('GET', '/api/admin/orders.csv', null, { Cookie: cookie });
  assert.match(r.text, /a@example.com/);
  r = await call('GET', '/admin');
  assert.match(r.text, /LiveLifeTricks admin/);
}));

test('wedding invitations: own price, own designs, product shown in admin', () => withServer({ invitePricePaise: 2900 }, async (call) => {
  let r = await call('GET', '/api/biodata/config');
  assert.equal(r.json.prices.invite, 29);
  r = await call('POST', '/api/biodata/start', { product: 'invite', email: 'i@example.com', templateId: 'inv-royal-maroon', dataHash: H1 });
  assert.equal(r.json.amount, 2900);
  r = await call('POST', '/api/biodata/start', { product: 'invite', email: 'i@example.com', templateId: 'inv-classic-maroon', dataHash: H1 });
  assert.equal(r.json.free, true);
  r = await call('POST', '/api/biodata/start', { product: 'invite', email: 'i@example.com', templateId: 'royal-maroon', dataHash: H1 });
  assert.equal(r.status, 400, 'biodata design ids are not invitation designs');
  r = await call('POST', '/api/admin/login', { password: 'pw123' });
  const cookie = r.headers.get('set-cookie').split(';')[0];
  r = await call('GET', '/api/admin/orders', null, { Cookie: cookie });
  assert.ok(r.json.rows.every(x => x.product === 'invite'));
}));
