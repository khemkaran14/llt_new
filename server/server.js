#!/usr/bin/env node
/*
 * LiveLifeTricks API server (biodata payments, downloads, blog, email list and admin).
 * No npm packages needed. Configure with environment variables:
 *
 *   PORT=3077
 *   DATA_DIR=/var/lib/llt-api
 *   ADMIN_PASSWORD=...            (required for /admin)
 *   SESSION_SECRET=...            (long random string; keeps download links and logins valid across restarts)
 *   RAZORPAY_KEY_ID=rzp_live_...  (or rzp_test_... for testing)
 *   RAZORPAY_KEY_SECRET=...
 *   RAZORPAY_WEBHOOK_SECRET=...   (optional, recommended)
 *   BIODATA_PRICE=20              (rupees)
 *   INVITE_PRICE=29               (rupees, wedding invitations)
 *   SITE_URL=https://livelifetricks.com  (used in blog links, RSS and sitemap)
 *   DEV_PAYMENTS=1                (local testing only: fake payments without Razorpay)
 */
'use strict';
const http = require('http');
const path = require('path');
const { createApp } = require('./api.js');
const { createStore } = require('./store.js');
const { createRazorpay } = require('./razorpay.js');

const env = process.env;
const dataDir = env.DATA_DIR || path.join(__dirname, 'data');
const store = createStore(path.join(dataDir, 'biodata-orders.json'));
const { createBlog } = require('./blog.js');
const blog = createBlog({
  posts: createStore(path.join(dataDir, 'blog-posts.json')),
  subscribers: createStore(path.join(dataDir, 'subscribers.json')),
  mediaDir: path.join(dataDir, 'blog-media'),
  // Page shell with the site header/footer, made by build.js
  shellFile: env.SHELL_FILE || path.join(__dirname, '..', 'dist', '_shell', 'blog.html'),
  siteUrl: env.SITE_URL || 'https://livelifetricks.com'
});
const razorpay = env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? createRazorpay({ keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET }) : null;

if (!env.SESSION_SECRET) console.warn('SESSION_SECRET is not set: download links and admin logins will reset when the server restarts.');
if (!env.ADMIN_PASSWORD) console.warn('ADMIN_PASSWORD is not set: /admin is disabled.');
if (!razorpay && !env.DEV_PAYMENTS) console.warn('Razorpay keys are not set: premium designs cannot be bought yet.');

const app = createApp({
  store,
  razorpay,
  pricePaise: Math.round(Number(env.BIODATA_PRICE || 20) * 100),
  invitePricePaise: Math.round(Number(env.INVITE_PRICE || 29) * 100),
  adminPassword: env.ADMIN_PASSWORD || '',
  sessionSecret: env.SESSION_SECRET || undefined,
  webhookSecret: env.RAZORPAY_WEBHOOK_SECRET || '',
  devPayments: !!env.DEV_PAYMENTS,
  blog
});

// Optional: also serve the built site (handy for local testing; on the VPS nginx serves it).
const fs = require('fs');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
function handler(req, res) {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!env.STATIC_DIR || p.startsWith('/api/') || p === '/admin' || p === '/admin/' || p === '/blog' || p.startsWith('/blog/') || p.startsWith('/blog-media/')) return app(req, res);
  const root = path.resolve(env.STATIC_DIR);
  let file = path.resolve(root, '.' + p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : 'Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const port = Number(env.PORT || 3077);
const server = http.createServer(handler);
server.listen(port, '127.0.0.1', () => console.log('LiveLifeTricks API listening on 127.0.0.1:' + port + (razorpay ? ' (Razorpay ' + (razorpay.keyId.startsWith('rzp_test') ? 'TEST' : 'LIVE') + ' mode)' : '')));

function shutdown() { store.flush(); blog.flush && blog.flush(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
