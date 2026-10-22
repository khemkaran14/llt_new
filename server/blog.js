/*
 * Blog and email list.
 *
 * Posts are written in the admin dashboard (/admin → Blog) and stored as JSON
 * in DATA_DIR. Pages are rendered here using the site's own header and footer
 * (dist/_shell/blog.html, made by build.js), so the blog looks like the rest
 * of the site and needs no rebuild when you publish.
 *
 * Public URLs:
 *   /blog/                 latest posts (?page=2 …)
 *   /blog/topic/<section>/ posts in one section (tax, loans, savings, wedding, documents, general)
 *   /blog/tag/<tag>/       posts with one tag
 *   /blog/<slug>/          one post
 *   /blog/feed.xml         RSS feed (for feed readers, Feedly, WhatsApp channels, IFTTT/Zapier auto-sharing)
 *   /blog/sitemap.xml      for Google
 *   /blog-media/<file>     uploaded images
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const md = require('./markdown.js');
const { CATEGORIES, TOOLS, ICONS } = require('../src/tools.js');
const SEED = require('./blog-seed.js');
// The first four starters (before seeding was tracked per article)
const ORIGINAL_SEED_SLUGS = ['new-vs-old-tax-regime-fy-2026-27', 'sukanya-samriddhi-vs-ppf', 'passport-and-exam-photo-size-guide', 'wedding-budget-breakdown-india'];

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const RESERVED = new Set(['tag', 'topic', 'feed.xml', 'sitemap.xml', 'page']);
const TOPICS = CATEGORIES.map(c => ({ id: c.id, name: c.name })).concat([{ id: 'general', name: 'General' }]);
const PER_PAGE = 12;
const IMG_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MEDIA_TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const slugify = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
const topicName = id => (TOPICS.find(t => t.id === id) || TOPICS[TOPICS.length - 1]).name;
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const minutesOf = body => Math.max(1, Math.round(md.plain(body).split(' ').length / 220));
const jsonLd = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const xml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Graphic shown on cards for posts that have no cover image
function placeholder(cat) {
  const c = CATEGORIES.find(x => x.id === cat);
  const icon = ICONS[(c && c.icon) || 'doc'] || ICONS.doc;
  const name = md.esc(topicName(cat));
  return '<div class="post-cover-ph cat-' + md.esc(cat) + '" role="img" aria-label="' + name + '">' +
    '<svg class="ph-art" viewBox="0 0 400 210" aria-hidden="true"><circle cx="330" cy="30" r="90" fill="rgba(255,255,255,.10)"/><circle cx="40" cy="200" r="70" fill="rgba(255,255,255,.08)"/>' +
    '<path d="M0 170 C80 140 140 160 210 130 S330 80 400 90 V210 H0Z" fill="rgba(255,255,255,.10)"/>' +
    '<circle cx="200" cy="96" r="54" fill="rgba(255,255,255,.18)"/>' +
    '<g transform="translate(170 66) scale(2.5)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icon + '</g></svg>' +
    '<span>' + name + '</span></div>';
}

function toolCardHtml(p) {
  const t = TOOLS.find(x => x.path === p);
  if (!t) return '';
  return '<a class="card tool-card post-tool" href="' + t.path + '"><span class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONS[t.icon] || ICONS.doc) + '</svg></span><span><b>' + md.esc(t.name) + '</b><span class="muted small">' + md.esc(t.blurb) + '</span></span><span class="post-tool-go">Open →</span></a>';
}

function createBlog(opts) {
  const cfg = Object.assign({ siteUrl: 'https://livelifetricks.com', siteName: 'LiveLifeTricks', now: () => Date.now(), seed: true }, opts);
  const { posts, subscribers } = cfg; // stores (see store.js)
  const mediaDir = cfg.mediaDir;
  // Starter articles: each one is added once, by its slug. A starter you delete
  // or rename stays gone, and new starters in blog-seed.js appear on the next restart.
  if (cfg.seed) {
    let done = posts.meta('seededSlugs');
    if (!Array.isArray(done)) done = posts.meta('seeded') ? ORIGINAL_SEED_SLUGS.slice() : [];
    const fresh = SEED.filter(p => done.indexOf(p.slug) === -1);
    fresh.forEach(p => {
      if (!posts.findBy('slug', p.slug)) posts.insert(Object.assign({ id: newId(), status: 'published', author: 'LiveLifeTricks team', cover: '', coverAlt: '' }, p, { createdAt: p.publishedAt, updatedAt: p.publishedAt }));
      done.push(p.slug);
    });
    if (fresh.length || !Array.isArray(posts.meta('seededSlugs'))) posts.meta('seededSlugs', done);

    // Give starter articles their cover image once, if they don't have one yet
    // (a cover the owner removes or changes later is left alone).
    const covered = posts.meta('coverSlugs') || [];
    const todo = SEED.filter(p => p.cover && covered.indexOf(p.slug) === -1);
    todo.forEach(p => {
      const post = posts.findBy('slug', p.slug);
      if (post && !post.cover) posts.update(post.id, { cover: p.cover, coverAlt: p.coverAlt || '' });
      covered.push(p.slug);
    });
    if (todo.length) posts.meta('coverSlugs', covered);
  }

  function newId() { return 'p_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex'); }
  const live = () => posts.all().filter(p => p.status === 'published' && Date.parse(p.publishedAt) <= cfg.now())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const urlOf = p => '/blog/' + p.slug + '/';
  const absUrl = u => /^https?:/.test(u) ? u : cfg.siteUrl + u;

  // ---------- page shell ----------
  let shell = null, shellMtime = 0;
  function getShell() {
    try {
      const st = fs.statSync(cfg.shellFile);
      if (!shell || st.mtimeMs !== shellMtime) { shell = fs.readFileSync(cfg.shellFile, 'utf8'); shellMtime = st.mtimeMs; }
    } catch (e) {
      shell = '<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>@@TITLE@@</title><meta name="description" content="@@DESC@@">@@HEAD@@</head><body><main>@@BODY@@</main></body></html>';
    }
    return shell;
  }
  function page(o) {
    const v = {
      TITLE: md.esc(o.title), DESC: md.esc(o.description || ''), PATH: o.path, OGTYPE: o.ogType || 'website',
      OGIMAGE: md.esc(absUrl(o.image || '/og-image.png')), HEAD: o.head || '', BODY: o.body
    };
    return getShell().replace(/@@(TITLE|DESC|PATH|OGTYPE|OGIMAGE|HEAD|BODY)@@/g, (m, k) => v[k]);
  }

  // ---------- pieces ----------
  function card(p, big) {
    const cover = p.cover
      ? '<img src="' + md.esc(p.cover) + '" alt="' + md.esc(p.coverAlt || '') + '" loading="lazy" width="800" height="420">'
      : placeholder(p.category);
    return '<a class="card post-card' + (big ? ' post-card-big' : '') + '" href="' + urlOf(p) + '">' + cover +
      '<div class="post-card-body"><span class="post-meta">' + md.esc(topicName(p.category)) + ' · ' + fmtDate(p.publishedAt) + ' · ' + minutesOf(p.body) + ' min read</span>' +
      '<h' + (big ? 2 : 3) + '>' + md.esc(p.title) + '</h' + (big ? 2 : 3) + '><p class="muted small">' + md.esc(p.description) + '</p></div></a>';
  }
  function topicNav(current) {
    const counts = {};
    live().forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return '<nav class="blog-topics" aria-label="Topics"><a href="/blog/"' + (!current ? ' aria-current="page"' : '') + '>All</a>' +
      TOPICS.filter(t => counts[t.id]).map(t => '<a href="/blog/topic/' + t.id + '/"' + (current === t.id ? ' aria-current="page"' : '') + '>' + md.esc(t.name) + '</a>').join('') + '</nav>';
  }
  const feedLink = '<a class="feed-link" href="/blog/feed.xml"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19a1 1 0 1 1 0-.01M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>RSS feed</a>';

  function listPage(list, o) {
    const pageNo = Math.max(1, o.page || 1), pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const items = list.slice((pageNo - 1) * PER_PAGE, pageNo * PER_PAGE);
    const first = pageNo === 1 && !o.topic && !o.tag && items.length > 2 ? items.shift() : null;
    const base = o.path;
    let pager = '';
    if (pages > 1) {
      pager = '<nav class="pager" aria-label="Pages">' + (pageNo > 1 ? '<a class="btn" href="' + base + (pageNo > 2 ? '?page=' + (pageNo - 1) : '') + '">← Newer</a>' : '<span></span>') +
        '<span class="muted small">Page ' + pageNo + ' of ' + pages + '</span>' + (pageNo < pages ? '<a class="btn" href="' + base + '?page=' + (pageNo + 1) + '">Older →</a>' : '<span></span>') + '</nav>';
    }
    const body = '<section class="hero blog-hero"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › ' + (o.crumb ? '<a href="/blog/">Blog</a> › ' + md.esc(o.crumb) : 'Blog') + '</nav>' +
      '<div class="blog-hero-row"><div><h1>' + md.esc(o.h1) + '</h1><p class="lead">' + md.esc(o.lead) + '</p></div>' + feedLink + '</div>' + topicNav(o.topic) + '</div></section>' +
      '<section class="wrap blog-list">' + (first ? card(first, true) : '') +
      (items.length ? '<div class="post-grid">' + items.map(p => card(p)).join('') + '</div>' : (first ? '' : '<p class="muted">No articles here yet. Check back soon.</p>')) + pager + '</section>' +
      subscribeBox();
    const head = (pageNo > 1 || o.noindex ? '<meta name="robots" content="' + (o.noindex ? 'noindex, follow' : 'index, follow') + '">' : '') +
      jsonLd({ '@context': 'https://schema.org', '@type': 'Blog', name: cfg.siteName + ' blog', url: cfg.siteUrl + '/blog/', inLanguage: 'en-IN' });
    return page({ title: o.title + (pageNo > 1 ? ' – page ' + pageNo : ''), description: o.lead, path: base + (pageNo > 1 ? '?page=' + pageNo : ''), head, body });
  }
  function subscribeBox() {
    return '<section class="wrap blog-sub"><div class="card newsletter"><div><h2>Get new guides by email</h2><p class="muted">Tax deadlines, rate changes and new tools. One short email, no spam.</p></div>' +
      '<form class="nl-form" data-subscribe><label class="sr-only" for="sub-email">Email address</label><input id="sub-email" type="email" required placeholder="you@example.com" autocomplete="email"><button class="btn btn-primary" type="submit">Subscribe</button><p class="small muted nl-msg" role="status"></p></form></div></section>';
  }
  function shareBar(p) {
    const u = encodeURIComponent(cfg.siteUrl + urlOf(p)), t = encodeURIComponent(p.title);
    const links = [
      ['whatsapp', 'WhatsApp', 'https://wa.me/?text=' + t + '%20' + u],
      ['x', 'X', 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u],
      ['facebook', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['linkedin', 'LinkedIn', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u],
      ['telegram', 'Telegram', 'https://t.me/share/url?url=' + u + '&text=' + t]
    ];
    return '<div class="share-bar"><span class="muted small">Share</span>' + links.map(l => '<a class="share share-' + l[0] + '" href="' + l[2] + '" target="_blank" rel="noopener" aria-label="Share on ' + l[1] + '">' + l[1] + '</a>').join('') +
      '<button type="button" class="share share-copy" data-copy="' + md.esc(cfg.siteUrl + urlOf(p)) + '">Copy link</button><button type="button" class="share share-native" data-title="' + md.esc(p.title) + '" data-url="' + md.esc(cfg.siteUrl + urlOf(p)) + '" hidden>Share…</button></div>';
  }
  function postPage(p, preview) {
    const html = md.render(p.body, { toolCard: toolCardHtml });
    // Table of contents from the ## headings
    const heads = [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
    const toc = heads.length >= 3 ? '<nav class="toc card" aria-label="In this article"><b>In this article</b><ol>' + heads.map(h => '<li><a href="#' + h[1] + '">' + h[2].replace(/<[^>]+>/g, '') + '</a></li>').join('') + '</ol></nav>' : '';
    const tools = TOOLS.filter(t => t.cat === p.category).slice(0, 3);
    const more = live().filter(x => x.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
    const tags = (p.tags || []).map(t => '<a href="/blog/tag/' + encodeURIComponent(slugify(t)) + '/">#' + md.esc(t) + '</a>').join('');
    const body = (preview ? '<div class="draft-note">Preview: this post is a <b>' + md.esc(p.status) + '</b> and only you can see it.</div>' : '') +
      '<article class="wrap blog-post"><header class="post-head"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog/">Blog</a> › <a href="/blog/topic/' + md.esc(p.category) + '/">' + md.esc(topicName(p.category)) + '</a></nav>' +
      '<h1>' + md.esc(p.title) + '</h1><p class="lead">' + md.esc(p.description) + '</p>' +
      '<p class="post-byline"><span>' + md.esc(p.author || 'LiveLifeTricks team') + '</span> · <time datetime="' + md.esc(p.publishedAt) + '">' + fmtDate(p.publishedAt) + '</time>' +
      (p.updatedAt && Date.parse(p.updatedAt) - Date.parse(p.publishedAt) > 864e5 ? ' · Updated ' + fmtDate(p.updatedAt) : '') + ' · ' + minutesOf(p.body) + ' min read</p>' + shareBar(p) + '</header>' +
      (p.cover ? '<img class="post-cover" src="' + md.esc(p.cover) + '" alt="' + md.esc(p.coverAlt || '') + '" width="1200" height="630">' : '') +
      '<div class="post-layout"><div class="post-body content">' + toc + html + (tags ? '<p class="post-tags">' + tags + '</p>' : '') + shareBar(p) + '</div>' +
      (tools.length ? '<aside class="post-side"><div class="card"><b>Try these tools</b>' + tools.map(t => '<a href="' + t.path + '">' + md.esc(t.name) + ' →</a>').join('') + '</div></aside>' : '') + '</div></article>' +
      (more.length ? '<section class="wrap related"><div class="cat-head"><h2>Keep reading</h2><a href="/blog/">All articles →</a></div><div class="post-grid">' + more.map(x => card(x)).join('') + '</div></section>' : '') +
      subscribeBox();
    const url = cfg.siteUrl + urlOf(p);
    const head = (preview ? '<meta name="robots" content="noindex">' : '') +
      '<meta property="article:published_time" content="' + md.esc(p.publishedAt) + '">' +
      jsonLd({
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, url, mainEntityOfPage: url,
        datePublished: p.publishedAt, dateModified: p.updatedAt || p.publishedAt, inLanguage: 'en-IN',
        image: absUrl(p.cover || '/og-image.png'), author: { '@type': 'Organization', name: p.author || cfg.siteName },
        publisher: { '@type': 'Organization', name: cfg.siteName, logo: { '@type': 'ImageObject', url: cfg.siteUrl + '/favicon.svg' } }
      }) +
      jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: cfg.siteUrl + '/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: cfg.siteUrl + '/blog/' },
        { '@type': 'ListItem', position: 3, name: p.title, item: url }] });
    return page({ title: (p.seoTitle || p.title) + ' | LiveLifeTricks', description: p.description, path: urlOf(p), ogType: 'article', image: p.cover, head, body });
  }
  function feed() {
    const list = live().slice(0, 30);
    return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n<channel>\n' +
      '<title>' + xml(cfg.siteName) + ' blog</title><link>' + cfg.siteUrl + '/blog/</link><description>Money, tax, wedding and document guides for India</description><language>en-IN</language>\n' +
      '<atom:link href="' + cfg.siteUrl + '/blog/feed.xml" rel="self" type="application/rss+xml"/>\n' +
      (list[0] ? '<lastBuildDate>' + new Date(list[0].updatedAt || list[0].publishedAt).toUTCString() + '</lastBuildDate>\n' : '') +
      list.map(p => '<item><title>' + xml(p.title) + '</title><link>' + cfg.siteUrl + urlOf(p) + '</link><guid isPermaLink="true">' + cfg.siteUrl + urlOf(p) + '</guid>' +
        '<pubDate>' + new Date(p.publishedAt).toUTCString() + '</pubDate><category>' + xml(topicName(p.category)) + '</category><description>' + xml(p.description) + '</description>' +
        '<content:encoded><![CDATA[' + md.render(p.body, { toolCard: path => { const t = TOOLS.find(x => x.path === path); return t ? '<p><a href="' + cfg.siteUrl + t.path + '">' + t.name + '</a></p>' : ''; } }).replace(/\]\]>/g, ']]&gt;').replace(/(src|href)="\//g, '$1="' + cfg.siteUrl + '/') + ']]></content:encoded></item>').join('\n') +
      '\n</channel>\n</rss>\n';
  }
  function sitemap() {
    const list = live();
    const urls = [['/blog/', list[0] ? list[0].updatedAt || list[0].publishedAt : new Date(cfg.now()).toISOString()]].concat(list.map(p => [urlOf(p), p.updatedAt || p.publishedAt]));
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => '  <url><loc>' + cfg.siteUrl + u[0] + '</loc><lastmod>' + u[1].slice(0, 10) + '</lastmod></url>').join('\n') + '\n</urlset>\n';
  }

  // ---------- public handler ----------
  // Returns true if it handled the request.
  function handlePublic(req, res, isAdmin) {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    if (!(p === '/blog' || p.startsWith('/blog/') || p.startsWith('/blog-media/'))) return false;
    const send = (status, body, type, extra) => {
      res.writeHead(status, Object.assign({ 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store', 'X-Content-Type-Options': 'nosniff' }, extra || {}));
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') { send(405, 'Method not allowed', 'text/plain'); return true; }
    const notFound = () => send(404, listPage(live().slice(0, 6), { path: '/blog/', title: 'Page not found', h1: 'We could not find that article', lead: 'It may have moved. Here are our latest guides instead.', noindex: true }));

    if (p.startsWith('/blog-media/')) {
      const name = p.slice('/blog-media/'.length);
      if (!/^[a-z0-9_-]+\.(jpg|png|webp)$/.test(name)) { send(404, 'Not found', 'text/plain'); return true; }
      const file = path.join(mediaDir, name);
      fs.readFile(file, (err, buf) => {
        if (err) return send(404, 'Not found', 'text/plain');
        send(200, buf, MEDIA_TYPES[path.extname(name)], { 'Cache-Control': 'public, max-age=31536000, immutable' });
      });
      return true;
    }
    if (p === '/blog') { res.writeHead(301, { Location: '/blog/' + url.search }); res.end(); return true; }
    if (p === '/blog/feed.xml') { send(200, feed(), 'application/rss+xml; charset=utf-8'); return true; }
    if (p === '/blog/sitemap.xml') { send(200, sitemap(), 'application/xml; charset=utf-8'); return true; }
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + url.search }); res.end(); return true; }
    const parts = p.split('/').filter(Boolean); // ['blog', ...]
    const pageNo = Math.min(1000, Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1));
    if (parts.length === 1) {
      send(200, listPage(live(), { path: '/blog/', page: pageNo, title: 'Blog: tax, money and wedding guides for India', h1: 'Guides & updates', lead: 'Plain-English guides on tax, loans, savings, weddings and documents, with the numbers worked out.' }));
      return true;
    }
    if (parts.length === 3 && parts[1] === 'topic') {
      const t = TOPICS.find(x => x.id === parts[2]);
      if (!t) { notFound(); return true; }
      send(200, listPage(live().filter(x => x.category === t.id), { path: p, page: pageNo, topic: t.id, crumb: t.name, title: t.name + ' guides | LiveLifeTricks blog', h1: t.name + ' guides', lead: 'Articles about ' + t.name.toLowerCase() + ', with calculators to try your own numbers.' }));
      return true;
    }
    if (parts.length === 3 && parts[1] === 'tag') {
      const tag = decodeURIComponent(parts[2]);
      const list = live().filter(x => (x.tags || []).some(t => slugify(t) === tag));
      if (!list.length) { notFound(); return true; }
      const label = (list[0].tags.find(t => slugify(t) === tag) || tag);
      send(200, listPage(list, { path: p, page: pageNo, tag, crumb: '#' + label, title: 'Articles tagged ' + label + ' | LiveLifeTricks blog', h1: '#' + label, lead: list.length + ' article' + (list.length > 1 ? 's' : '') + ' tagged “' + label + '”.', noindex: list.length < 3 }));
      return true;
    }
    if (parts.length === 2) {
      const post = posts.findBy('slug', parts[1]);
      const visible = post && post.status === 'published' && Date.parse(post.publishedAt) <= cfg.now();
      if (!post || (!visible && !isAdmin(req))) { notFound(); return true; }
      send(200, postPage(post, !visible), null, visible ? null : { 'Cache-Control': 'no-store' });
      return true;
    }
    notFound();
    return true;
  }

  // ---------- API routes (merged into api.js routes) ----------
  function routes(h) {
    const { isAdmin, readJson, limited, clean, EMAIL_RE, readBody } = h;
    const need = req => { if (!isAdmin(req)) throw Object.assign(new Error('Please log in.'), { status: 401 }); };
    const summary = p => ({ placeholder: p.cover ? '' : placeholder(p.category), title: p.title, description: p.description, url: urlOf(p), cover: p.cover || '', coverAlt: p.coverAlt || '', category: p.category, categoryName: topicName(p.category), date: fmtDate(p.publishedAt), minutes: minutesOf(p.body) });

    return {
      'GET /api/blog/latest': (req) => {
        const n = Math.min(12, Math.max(1, parseInt(new URL(req.url, 'http://x').searchParams.get('limit'), 10) || 3));
        return { posts: live().slice(0, n).map(summary) };
      },
      'POST /api/subscribe': async (req, ip) => {
        if (limited(ip, 'subscribe', 8, 10 * 60 * 1000)) return [429, { error: 'Too many requests. Try again later.' }];
        const b = await readJson(req);
        const email = clean(b.email, 254).toLowerCase();
        if (!EMAIL_RE.test(email)) return [400, { error: 'Please enter a valid email address.' }];
        const old = subscribers.findBy('email', email);
        if (old) { if (old.status !== 'active') subscribers.update(old.id, { status: 'active', resubscribedAt: new Date(cfg.now()).toISOString() }); return { ok: true }; }
        subscribers.insert({ id: 's_' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'), email, source: clean(b.source, 40) || 'site', status: 'active', createdAt: new Date(cfg.now()).toISOString() });
        return { ok: true };
      },

      // Admin: posts
      'GET /api/admin/posts': (req) => {
        need(req);
        return {
          topics: TOPICS, tools: TOOLS.map(t => ({ path: t.path, name: t.name })),
          posts: posts.all().slice().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).map(p => Object.assign({}, p, { url: urlOf(p), minutes: minutesOf(p.body) }))
        };
      },
      'POST /api/admin/posts/save': async (req) => {
        need(req);
        const b = await readJson(req, 512 * 1024);
        const title = clean(b.title, 140);
        if (!title) return [400, { error: 'Add a title.' }];
        const body = String(b.body || '').slice(0, 200000);
        const slug = slugify(b.slug || title);
        if (!SLUG_RE.test(slug) || RESERVED.has(slug)) return [400, { error: 'Choose a different web address (slug).' }];
        const clash = posts.findBy('slug', slug);
        if (clash && clash.id !== b.id) return [409, { error: 'Another post already uses /blog/' + slug + '/. Change the web address.' }];
        const existing = b.id ? posts.get(String(b.id)) : null;
        if (b.id && !existing) return [404, { error: 'Post not found.' }];
        const status = b.status === 'published' ? 'published' : 'draft';
        const nowIso = new Date(cfg.now()).toISOString();
        let publishedAt = existing && existing.publishedAt;
        if (b.publishedAt && !isNaN(Date.parse(b.publishedAt))) publishedAt = new Date(b.publishedAt).toISOString();
        if (status === 'published' && !publishedAt) publishedAt = nowIso;
        const cover = md.safeUrl(b.cover) || '';
        const fields = {
          title, slug, body, status, publishedAt: publishedAt || '',
          description: clean(b.description, 300) || md.plain(body).slice(0, 155).replace(/\s\S*$/, '') + '…',
          seoTitle: clean(b.seoTitle, 70),
          category: TOPICS.some(t => t.id === b.category) ? b.category : 'general',
          tags: (Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',')).map(t => clean(t, 30)).filter(Boolean).slice(0, 8),
          cover, coverAlt: clean(b.coverAlt, 160), author: clean(b.author, 60) || 'LiveLifeTricks team', updatedAt: nowIso
        };
        const saved = existing ? posts.update(existing.id, fields) : posts.insert(Object.assign({ id: newId(), createdAt: nowIso }, fields));
        return { post: Object.assign({}, saved, { url: urlOf(saved), minutes: minutesOf(saved.body) }) };
      },
      'POST /api/admin/posts/delete': async (req) => {
        need(req);
        const b = await readJson(req);
        if (!posts.remove(String(b.id || ''))) return [404, { error: 'Post not found.' }];
        return { ok: true };
      },
      'POST /api/admin/posts/preview': async (req) => {
        need(req);
        const b = await readJson(req, 512 * 1024);
        return { rendered: md.render(String(b.body || ''), { toolCard: toolCardHtml }) };
      },
      'POST /api/admin/upload': async (req) => {
        need(req);
        const type = String(req.headers['content-type'] || '').split(';')[0].trim();
        const ext = IMG_TYPES[type];
        if (!ext) return [415, { error: 'Upload a JPG, PNG or WebP image.' }];
        const buf = await readBody(req, 4 * 1024 * 1024);
        const sig = buf.slice(0, 12).toString('hex');
        const ok = (ext === '.jpg' && sig.startsWith('ffd8ff')) || (ext === '.png' && sig.startsWith('89504e47')) || (ext === '.webp' && sig.startsWith('52494646') && buf.slice(8, 12).toString() === 'WEBP');
        if (!ok) return [415, { error: 'That file is not a valid image.' }];
        fs.mkdirSync(mediaDir, { recursive: true });
        const name = new Date(cfg.now()).toISOString().slice(0, 10) + '-' + crypto.randomBytes(6).toString('hex') + ext;
        fs.writeFileSync(path.join(mediaDir, name), buf);
        return { url: '/blog-media/' + name };
      },

      // Admin: email list
      'GET /api/admin/subscribers': (req) => {
        need(req);
        return { rows: subscribers.all().slice().reverse() };
      },
      'POST /api/admin/subscribers/delete': async (req) => {
        need(req);
        const b = await readJson(req);
        if (!subscribers.remove(String(b.id || ''))) return [404, { error: 'Not found.' }];
        return { ok: true };
      },
      'GET /api/admin/subscribers.csv': (req) => {
        if (!isAdmin(req)) return [401, 'Please log in.'];
        const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&") + '"';
        const cols = ['createdAt', 'email', 'source', 'status'];
        return { raw: [cols.join(',')].concat(subscribers.all().map(s => cols.map(c => q(s[c])).join(','))).join('\n'), headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="subscribers.csv"' } };
      }
    };
  }

  return { handlePublic, routes, live, slugify, flush() { posts.flush(); subscribers.flush(); } };
}

module.exports = { createBlog, slugify, TOPICS };
