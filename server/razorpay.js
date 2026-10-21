/* Minimal Razorpay client: create orders and verify signatures. No npm packages needed. */
'use strict';
const https = require('https');
const crypto = require('crypto');

function createRazorpay({ keyId, keySecret }) {
  function createOrder({ amount, receipt, notes }) {
    const body = JSON.stringify({ amount, currency: 'INR', receipt, notes });
    return new Promise((resolve, reject) => {
      const req = https.request({
        method: 'POST', host: 'api.razorpay.com', path: '/v1/orders',
        auth: keyId + ':' + keySecret,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 15000
      }, res => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 300) return reject(new Error('Razorpay ' + res.statusCode + ': ' + (json.error && json.error.description || data)));
            resolve(json);
          } catch (e) { reject(e); }
        });
      });
      req.on('timeout', () => req.destroy(new Error('Razorpay timeout')));
      req.on('error', reject);
      req.end(body);
    });
  }
  return { keyId, createOrder, verifyPayment: (o) => verifyPayment(o, keySecret) };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
function verifyPayment({ orderId, paymentId, signature }, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex');
  return safeEqual(expected, signature);
}

// Webhook signature: HMAC_SHA256(raw body, webhook_secret)
function verifyWebhook(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

module.exports = { createRazorpay, verifyPayment, verifyWebhook, safeEqual };
