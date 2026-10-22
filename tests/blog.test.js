// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createApp } = require('../server/api.js');
const { createStore } = require('../server/store.js');
const { createBlog } = require('../server/blog.js');
const md = require('../server/markdown.js');

const SHELL = '<!doctype html><html><head><title>@@TITLE@@</title><link rel="canonical" href="https://x.test@@PATH@@"><meta property="og:image" content="@@OGIMAGE@@">@@HEAD@@</head><body>@@BODY@@</body></html>';

async function withBlog(fn, opts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llt-blog-'));
  fs.writeFileSync(path.join(dir, 'shell.html'), SHELL);
  let now = Date.parse('2026-10-21T10:00:00Z');
  const blog = createBlog(Object.assign({ posts: createStore(null), subscribers: createStore(null), mediaDir: path.join(dir, 'media'), shellFile: path.join(dir, 'shell.html'), now: () => now }, opts));
  const app = createApp({ store: createStore(null), adminPassword: 'pw123', blog, now: () => now });
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  let cookie = '';
  const call = async (method, p, body, headers) => {
    const raw = Buffer.isBuffer(body);
    const r = await fetch(base + p, { method, redirect: 'manual', headers: Object.assign({ 'Content-Type': 'application/json', cookie }, headers || {}), body: body == null ? undefined : raw ? body : JSON.stringify(body) });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch (e) { /* html */ }
    return { status: r.status, json, text, headers: r.headers };
  };
  const login = async () => { const r = await call('POST', '/api/admin/login', { password: 'pw123' }); cookie = r.headers.get('set-cookie').split(';')[0]; };
  const logout = () => { cookie = ''; };
  try { await fn({ call, login, logout, advance: ms => { now += ms; } }); } finally { server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}

test('markdown escapes HTML and blocks unsafe links', () => {
  const html = md.render('Hi <script>alert(1)</script> [x](javascript:alert(1)) [ok](/emi-calculator/) ![a](https://e.com/i.png)\n\n## Head **b**');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('<a href="/emi-calculator/">ok</a>'));
  assert.ok(html.includes('<img src="https://e.com/i.png"'));
  assert.ok(html.includes('<h2 id="head-b">Head <strong>b</strong></h2>'));
  const t = md.render('| A | B |\n|---|---|\n| 1 | 2 |');
  assert.ok(t.includes('<th>A</th>') && t.includes('<td>2</td>'));
});

test('blog starts with the seed articles and serves list, post, feed and sitemap', () => withBlog(async ({ call }) => {
  let r = await call('GET', '/blog/');
  assert.equal(r.status, 200);
  assert.ok(r.text.includes('Guides &amp; updates'));
  assert.ok(r.text.includes('/blog/sukanya-samriddhi-vs-ppf/'));
  r = await call('GET', '/blog');
  assert.equal(r.status, 301);
  r = await call('GET', '/blog/sukanya-samriddhi-vs-ppf/');
  assert.equal(r.status, 200);
  assert.ok(r.text.includes('<link rel="canonical" href="https://x.test/blog/sukanya-samriddhi-vs-ppf/">'));
  assert.ok(r.text.includes('"@type":"BlogPosting"'));
  assert.ok(r.text.includes('class="card tool-card post-tool" href="/sukanya-samriddhi-calculator/"'), 'tool card rendered');
  r = await call('GET', '/blog/feed.xml');
  assert.match(r.headers.get('content-type'), /rss/);
  assert.equal((r.text.match(/<item>/g) || []).length, 4);
  r = await call('GET', '/blog/sitemap.xml');
  assert.ok(r.text.includes('<loc>https://livelifetricks.com/blog/new-vs-old-tax-regime-fy-2026-27/</loc>'));
  r = await call('GET', '/blog/topic/wedding/');
  assert.ok(r.text.includes('wedding-budget-breakdown-india') && !r.text.includes('sukanya-samriddhi-vs-ppf/"'));
  r = await call('GET', '/blog/no-such-post/');
  assert.equal(r.status, 404);
  r = await call('GET', '/api/blog/latest?limit=2');
  assert.equal(r.json.posts.length, 2);
  assert.equal(r.json.posts[0].url, '/blog/wedding-budget-breakdown-india/');
}));

test('admin writes, previews, schedules, publishes and deletes posts', () => withBlog(async ({ call, login, logout, advance }) => {
  let r = await call('POST', '/api/admin/posts/save', { title: 'Nope' });
  assert.equal(r.status, 401, 'needs sign-in');
  await login();
  r = await call('POST', '/api/admin/posts/preview', { body: '## Hi' });
  assert.equal(r.json.rendered, '<h2 id="hi">Hi</h2>');
  r = await call('POST', '/api/admin/posts/save', { title: 'Advance tax dates', body: 'Pay on time.', status: 'draft', category: 'tax', tags: 'tax, deadlines' });
  assert.equal(r.status, 200);
  const id = r.json.post.id;
  assert.equal(r.json.post.slug, 'advance-tax-dates');
  assert.deepEqual(r.json.post.tags, ['tax', 'deadlines']);
  logout();
  assert.equal((await call('GET', '/blog/advance-tax-dates/')).status, 404, 'drafts are hidden from visitors');
  await login();
  assert.equal((await call('GET', '/blog/advance-tax-dates/')).status, 200, 'admin can preview a draft');
  // Duplicate slug is refused
  r = await call('POST', '/api/admin/posts/save', { title: 'Advance tax dates', body: 'x' });
  assert.equal(r.status, 409);
  // Schedule for tomorrow
  r = await call('POST', '/api/admin/posts/save', { id, title: 'Advance tax dates', body: 'Pay on time.', status: 'published', publishedAt: '2026-10-22T10:00:00Z', category: 'tax' });
  logout();
  assert.equal((await call('GET', '/blog/advance-tax-dates/')).status, 404, 'scheduled post not live yet');
  advance(36 * 3600 * 1000);
  r = await call('GET', '/blog/advance-tax-dates/');
  assert.equal(r.status, 200);
  assert.ok(r.text.includes('<title>Advance tax dates | LiveLifeTricks</title>'));
  await login();
  r = await call('POST', '/api/admin/posts/delete', { id });
  assert.equal(r.json.ok, true);
  assert.equal((await call('GET', '/blog/advance-tax-dates/')).status, 404);
}));

test('image upload accepts real images only and serves them', () => withBlog(async ({ call, login }) => {
  await login();
  const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex');
  let r = await call('POST', '/api/admin/upload', Buffer.from('<svg onload=alert(1)>'), { 'Content-Type': 'image/png' });
  assert.equal(r.status, 415);
  r = await call('POST', '/api/admin/upload', png, { 'Content-Type': 'image/svg+xml' });
  assert.equal(r.status, 415);
  r = await call('POST', '/api/admin/upload', png, { 'Content-Type': 'image/png' });
  assert.equal(r.status, 200);
  assert.match(r.json.url, /^\/blog-media\/[a-z0-9-]+\.png$/);
  r = await call('GET', r.json.url);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/png');
  assert.equal((await call('GET', '/blog-media/../../etc/passwd')).status, 404);
}));

test('email sign-up stores each address once and admin can export it', () => withBlog(async ({ call, login }) => {
  let r = await call('POST', '/api/subscribe', { email: 'not-an-email' });
  assert.equal(r.status, 400);
  r = await call('POST', '/api/subscribe', { email: 'Reader@Example.com', source: 'home' });
  assert.equal(r.json.ok, true);
  await call('POST', '/api/subscribe', { email: 'reader@example.com', source: 'blog' });
  assert.equal((await call('GET', '/api/admin/subscribers')).status, 401);
  await login();
  r = await call('GET', '/api/admin/subscribers');
  assert.equal(r.json.rows.length, 1);
  assert.equal(r.json.rows[0].email, 'reader@example.com');
  r = await call('GET', '/api/admin/subscribers.csv');
  assert.ok(r.text.includes('"reader@example.com","home","active"'));
}));
