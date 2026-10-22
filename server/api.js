/*
 * HTTP API for the biodata builder and its admin dashboard.
 *
 * Privacy: the biodata itself (names, photo, family details) never reaches
 * this server. We only store the email, name, template, payment status and a
 * fingerprint (SHA-256) of the finished biodata, which is how "no edits after
 * download" is enforced for paid designs.
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Biodata = require('../src/assets/js/biodata-templates.js');
const { verifyWebhook, safeEqual } = require('./razorpay.js');

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const HASH_RE = /^[a-f0-9]{64}$/;

function createApp(opts) {
  const cfg = Object.assign({
    pricePaise: 2000,          // biodata
    invitePricePaise: 2900,    // wedding invitation
    downloadWindowHours: 48,
    maxDownloads: 10,
    adminPassword: '',
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    razorpay: null,          // { keyId, createOrder, verifyPayment }
    webhookSecret: '',
    devPayments: false,      // lets you test payments without Razorpay (never in production)
    now: () => Date.now()
  }, opts);
  // A missing setting must not override the default (server.js passes undefined when SESSION_SECRET is unset)
  if (!cfg.sessionSecret) cfg.sessionSecret = crypto.randomBytes(32).toString('hex');
  const store = cfg.store;
  const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

  // ---------- helpers ----------
  const hits = new Map();
  function limited(ip, bucket, max, windowMs) {
    const key = bucket + ':' + ip, t = cfg.now();
    const list = (hits.get(key) || []).filter(x => t - x < windowMs);
    list.push(t);
    hits.set(key, list);
    if (hits.size > 50000) hits.clear();
    return list.length > max;
  }
  function ipOf(req) {
    return String(req.headers['x-real-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '').trim();
  }
  function send(res, status, body, headers) {
    const isStr = typeof body === 'string';
    res.writeHead(status, Object.assign({
      'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }, headers || {}));
    res.end(isStr ? body : JSON.stringify(body));
  }
  function readBody(req, limit) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', c => {
        size += c.length;
        if (size > limit) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); return; }
        chunks.push(c);
      });
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }
  async function json(req, limit) {
    const raw = await readBody(req, limit || 16 * 1024);
    try { return JSON.parse(raw.toString('utf8') || '{}'); } catch (e) { throw Object.assign(new Error('Bad JSON'), { status: 400 }); }
  }
  const hmac = s => crypto.createHmac('sha256', cfg.sessionSecret).update(s).digest('hex');
  const tokenFor = id => hmac('dl:' + id).slice(0, 40);
  const newId = () => 'bd_' + Date.now().toString(36) + crypto.randomBytes(5).toString('hex');
  const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

  function publicOrder(o) {
    return { orderId: o.id, tier: o.tier, status: o.status, templateId: o.templateId };
  }

  // ---------- admin session ----------
  function sessionCookie() {
    const exp = cfg.now() + 12 * 3600 * 1000;
    return 'llt_admin=' + exp + '.' + hmac('admin:' + exp) + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200';
  }
  function isAdmin(req) {
    const m = String(req.headers.cookie || '').match(/(?:^|;\s*)llt_admin=(\d+)\.([a-f0-9]{64})/);
    if (!m) return false;
    return Number(m[1]) > cfg.now() && safeEqual(m[2], hmac('admin:' + m[1]));
  }

  // ---------- handlers ----------
  const routes = {
    'GET /api/health': () => ({ ok: true }),

    'GET /api/biodata/config': () => ({
      price: cfg.pricePaise / 100,
      prices: { biodata: cfg.pricePaise / 100, invite: cfg.invitePricePaise / 100 },
      keyId: cfg.razorpay ? cfg.razorpay.keyId : '',
      payments: !!cfg.razorpay || cfg.devPayments,
      devPayments: cfg.devPayments && !cfg.razorpay
    }),

    'POST /api/biodata/start': async (req, ip) => {
      if (limited(ip, 'start', 20, 10 * 60 * 1000)) return [429, { error: 'Too many requests. Please try again in a few minutes.' }];
      const b = await json(req);
      const email = clean(b.email, 254).toLowerCase();
      if (!EMAIL_RE.test(email)) return [400, { error: 'Please enter a valid email address.' }];
      const product = b.product === 'invite' ? 'invite' : 'biodata';
      const tpl = product === 'invite' ? Biodata.inviteById(String(b.templateId || '')) : Biodata.byId(String(b.templateId || ''));
      if (!tpl) return [400, { error: 'Unknown design.' }];
      const pricePaise = product === 'invite' ? cfg.invitePricePaise : cfg.pricePaise;
      const hash = String(b.dataHash || '');
      if (!HASH_RE.test(hash)) return [400, { error: 'Missing biodata fingerprint.' }];
      const order = {
        id: newId(), createdAt: new Date(cfg.now()).toISOString(), email, name: clean(b.name, 80), product,
        templateId: tpl.id, templateName: tpl.name, tier: tpl.tier,
        amount: tpl.tier === 'premium' ? pricePaise / 100 : 0,
        status: tpl.tier === 'premium' ? 'created' : 'free',
        consent: !!b.consent, dataHash: hash, downloads: []
      };
      if (tpl.tier === 'free') {
        store.insert(order);
        return { orderId: order.id, free: true, token: tokenFor(order.id) };
      }
      if (cfg.razorpay) {
        let rzp;
        try {
          rzp = await cfg.razorpay.createOrder({ amount: pricePaise, receipt: order.id, notes: { product, template: tpl.id, email } });
        } catch (e) {
          console.error('Razorpay order failed:', e.message);
          return [502, { error: 'Payment service is not responding. Please try again.' }];
        }
        order.rzpOrderId = rzp.id;
        store.insert(order);
        return { orderId: order.id, free: false, razorpayOrderId: rzp.id, amount: pricePaise, keyId: cfg.razorpay.keyId };
      }
      if (cfg.devPayments) {
        order.rzpOrderId = 'dev_' + order.id;
        store.insert(order);
        return { orderId: order.id, free: false, dev: true, razorpayOrderId: order.rzpOrderId, amount: pricePaise };
      }
      return [503, { error: 'Payments are not set up yet. Please try a free design.' }];
    },

    'POST /api/biodata/verify': async (req, ip) => {
      if (limited(ip, 'verify', 60, 10 * 60 * 1000)) return [429, { error: 'Too many requests.' }];
      const b = await json(req);
      const order = store.get(String(b.orderId || ''));
      if (!order || order.tier !== 'premium') return [404, { error: 'Order not found.' }];
      if (order.status === 'paid') return { token: tokenFor(order.id) };
      let ok = false;
      if (cfg.razorpay) {
        ok = b.razorpay_order_id === order.rzpOrderId &&
          cfg.razorpay.verifyPayment({ orderId: order.rzpOrderId, paymentId: b.razorpay_payment_id, signature: b.razorpay_signature });
      } else if (cfg.devPayments) {
        ok = b.dev === true;
      }
      if (!ok) return [400, { error: 'Payment could not be verified. If money was deducted, it will be refunded automatically by your bank or contact us.' }];
      store.update(order.id, { status: 'paid', paidAt: new Date(cfg.now()).toISOString(), paymentId: clean(b.razorpay_payment_id || 'dev', 60) });
      return { token: tokenFor(order.id) };
    },

    'POST /api/biodata/download': async (req, ip) => {
      if (limited(ip, 'download', 120, 10 * 60 * 1000)) return [429, { error: 'Too many requests.' }];
      const b = await json(req);
      const order = store.get(String(b.orderId || ''));
      if (!order || !safeEqual(String(b.token || ''), tokenFor(order.id))) return [403, { error: 'This download link is not valid.' }];
      const kind = b.kind === 'jpg' ? 'jpg' : 'pdf';
      const hash = String(b.dataHash || '');
      if (!HASH_RE.test(hash)) return [400, { error: 'Missing biodata fingerprint.' }];
      if (order.tier === 'premium') {
        if (order.status !== 'paid') return [402, { error: 'Payment is needed for this design.' }];
        if (hash !== order.dataHash) return [409, { error: 'This ' + (order.product === 'invite' ? 'invitation' : 'biodata') + ' was changed after payment. Each paid download is for one final version — start a new edit (₹' + order.amount + ') to download changes.', code: 'changed' }];
        const age = cfg.now() - Date.parse(order.paidAt);
        if (age > cfg.downloadWindowHours * 3600 * 1000) return [410, { error: 'This download has expired. Start a new edit to download again.', code: 'expired' }];
        if (order.downloads.length >= cfg.maxDownloads) return [429, { error: 'Download limit reached for this order.', code: 'limit' }];
      }
      store.update(order.id, r => ({ downloads: r.downloads.concat([{ kind, at: new Date(cfg.now()).toISOString() }]), dataHash: order.tier === 'free' ? hash : r.dataHash }));
      return { ok: true, remaining: order.tier === 'premium' ? cfg.maxDownloads - order.downloads.length : null };
    },

    // Razorpay webhook (optional, recommended): marks orders paid even if the buyer closes the browser.
    'POST /api/biodata/webhook': async (req) => {
      const raw = await readBody(req, 256 * 1024);
      if (!verifyWebhook(raw, req.headers['x-razorpay-signature'], cfg.webhookSecret)) return [400, { error: 'Bad signature' }];
      let ev;
      try { ev = JSON.parse(raw.toString('utf8')); } catch (e) { return [400, { error: 'Bad JSON' }]; }
      const pay = ev && ev.payload && ev.payload.payment && ev.payload.payment.entity;
      if ((ev.event === 'payment.captured' || ev.event === 'order.paid') && pay && pay.order_id) {
        const order = store.findBy('rzpOrderId', pay.order_id);
        if (order && order.status !== 'paid') store.update(order.id, { status: 'paid', paidAt: new Date(cfg.now()).toISOString(), paymentId: clean(pay.id, 60), via: 'webhook' });
      }
      return { ok: true };
    },

    // ---------- admin ----------
    'GET /admin': () => ({ html: adminHtml }),
    'POST /api/admin/login': async (req, ip) => {
      if (limited(ip, 'login', 10, 10 * 60 * 1000)) return [429, { error: 'Too many attempts. Wait 10 minutes.' }];
      const b = await json(req);
      if (!cfg.adminPassword) return [503, { error: 'Set ADMIN_PASSWORD on the server first.' }];
      const given = crypto.createHash('sha256').update(String(b.password || '')).digest('hex');
      const want = crypto.createHash('sha256').update(cfg.adminPassword).digest('hex');
      if (!safeEqual(given, want)) return [401, { error: 'Wrong password.' }];
      return { body: { ok: true }, headers: { 'Set-Cookie': sessionCookie() } };
    },
    'POST /api/admin/logout': () => ({ body: { ok: true }, headers: { 'Set-Cookie': 'llt_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' } }),
    'GET /api/admin/orders': (req) => {
      if (!isAdmin(req)) return [401, { error: 'Please log in.' }];
      const rows = store.all().slice().reverse().map(o => ({
        id: o.id, createdAt: o.createdAt, email: o.email, name: o.name, product: o.product || 'biodata', template: o.templateName, tier: o.tier,
        amount: o.status === 'paid' ? o.amount : 0, status: o.status, paymentId: o.paymentId || '', paidAt: o.paidAt || '',
        downloads: o.downloads.length, lastDownload: o.downloads.length ? o.downloads[o.downloads.length - 1].at : '', consent: !!o.consent
      }));
      const paid = rows.filter(r => r.status === 'paid');
      return {
        summary: {
          orders: rows.length, free: rows.filter(r => r.tier === 'free').length, paid: paid.length,
          revenue: paid.reduce((a, r) => a + r.amount, 0), emails: new Set(rows.map(r => r.email)).size,
          downloads: rows.reduce((a, r) => a + r.downloads, 0), abandoned: rows.filter(r => r.status === 'created').length
        },
        rows
      };
    },
    'GET /api/admin/orders.csv': (req) => {
      if (!isAdmin(req)) return [401, 'Please log in.'];
      const cols = ['createdAt', 'email', 'name', 'product', 'templateName', 'tier', 'status', 'amount', 'paymentId', 'paidAt', 'downloads', 'consent'];
      const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&") + '"';
      const lines = [cols.join(',')].concat(store.all().map(o => cols.map(c => q(c === 'downloads' ? o.downloads.length : c === 'amount' ? (o.status === 'paid' ? o.amount : 0) : c === 'product' ? (o.product || 'biodata') : o[c])).join(',')));
      return { raw: lines.join('\n'), headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="biodata-orders.csv"' } };
    }
  };

  // Blog pages, feed and email list (server/blog.js)
  if (cfg.blog) Object.assign(routes, cfg.blog.routes({ isAdmin, readJson: json, readBody, limited, clean, EMAIL_RE }));

  return async function handle(req, res) {
    if (cfg.blog && cfg.blog.handlePublic(req, res, isAdmin)) return;
    const url = new URL(req.url, 'http://x');
    let p = url.pathname.replace(/\/+$/, '') || '/';
    const route = routes[req.method + ' ' + p];
    if (!route) return send(res, 404, { error: 'Not found' });
    try {
      let out = await route(req, ipOf(req));
      let status = 200;
      if (Array.isArray(out)) { status = out[0]; out = out[1]; }
      if (out && out.html) {
        return send(res, status, out.html, { 'Content-Type': 'text/html; charset=utf-8', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' });
      }
      if (out && out.raw != null) return send(res, status, out.raw, out.headers);
      if (out && out.body) return send(res, status, out.body, out.headers);
      return send(res, status, out);
    } catch (e) {
      if (e.status) return send(res, e.status, { error: e.message });
      console.error(e);
      return send(res, 500, { error: 'Something went wrong.' });
    }
  };
}

module.exports = { createApp };
