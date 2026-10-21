#!/usr/bin/env node
/*
 * Builds the static site into dist/.
 *   node build.js
 *
 * Each file in src/pages starts with a meta block:
 *   <!--meta {"title": "...", "description": "...", "path": "/x/", ...} -->
 * The page body is placed inside src/layout.html.
 *
 * Pages can also be generated from code: every module in src/generators
 * exports a function returning [{ meta, body }].
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name), b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

function hashOf(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
}

function asset(rel) {
  return '/assets/' + rel + '?v=' + hashOf(path.join(SRC, 'assets', rel));
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

fs.rmSync(DIST, { recursive: true, force: true });
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(SRC, 'static'), DIST);

const layout = fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8');
const { ICONS, CATEGORIES, TOOLS } = require('./src/tools.js');
const catOf = id => CATEGORIES.find(c => c.id === id);
const toolOf = p => TOOLS.find(t => t.path === p);

function iconSvg(name) {
  return '<span class="tool-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.doc) + '</svg></span>';
}
function toolCard(t) {
  return '<a class="card tool-card" href="' + t.path + '">' + iconSvg(t.icon) + '<h3>' + t.name + (t.isNew ? ' <span class="tag-new">New</span>' : '') + '</h3><p>' + t.blurb + '</p></a>';
}
function toolsIn(catId) {
  const list = TOOLS.filter(t => t.cat === catId);
  return list.filter(t => t.popular).concat(list.filter(t => !t.popular));
}
const navHtml = current => CATEGORIES.map(c => '<a href="' + c.path + '"' + (c.id === current ? ' aria-current="page"' : '') + '>' + c.short + '</a>').join('\n      ') + '\n      <a href="/about/">About</a>';
const footerCols = CATEGORIES.map(c => '<div>\n      <h2 class="footer-h">' + c.name.replace('&', '&amp;') + '</h2>\n      <ul>\n' +
  toolsIn(c.id).slice(0, 6).map(t => '        <li><a href="' + t.path + '">' + t.name + '</a></li>').join('\n') +
  '\n        <li><a href="' + c.path + '"><strong>All ' + c.short.toLowerCase() + ' tools →</strong></a></li>\n      </ul>\n    </div>').join('\n    ');
const homeSections = CATEGORIES.map(c => {
  const list = toolsIn(c.id);
  return '<section class="wrap home-cat" id="' + c.id + '">\n  <div class="cat-head"><h2>' + c.name.replace('&', '&amp;') + '</h2><a href="' + c.path + '">All ' + list.length + ' tools →</a></div>\n  <div class="tool-grid">' +
    list.slice(0, 6).map(toolCard).join('') + '</div>\n</section>';
}).join('\n');

// One page per section, listing all its tools
function categoryPage(c) {
  const list = toolsIn(c.id);
  return {
    meta: { title: c.name + ' Tools & Calculators | LiveLifeTricks', description: c.intro, path: c.path, priority: '0.8', breadcrumb: c.name },
    body: '<section class="hero"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › ' + c.name.replace('&', '&amp;') + '</nav>' +
      '<h1>' + c.name.replace('&', '&amp;') + '</h1><p class="lead">' + c.intro + '</p></div></section>\n<section class="wrap"><div class="tool-grid">' + list.map(toolCard).join('') + '</div></section>\n'
  };
}
function crumbsFor(t, current) {
  const c = catOf(t.cat);
  return '<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="' + c.path + '">' + c.name.replace('&', '&amp;') + '</a> › ' + current + '</nav>';
}
function relatedFor(t) {
  const others = toolsIn(t.cat).filter(x => x.path !== t.path).slice(0, 4);
  if (!others.length) return '';
  const c = catOf(t.cat);
  return '\n<section class="wrap related"><div class="cat-head"><h2>More ' + c.name.replace('&', '&amp;').toLowerCase() + ' tools</h2><a href="' + c.path + '">See all →</a></div><div class="tool-grid">' + others.map(toolCard).join('') + '</div></section>\n';
}
const pages = [];

const sources = [];
for (const file of fs.readdirSync(path.join(SRC, 'pages')).sort()) {
  if (!file.endsWith('.html')) continue;
  const raw = fs.readFileSync(path.join(SRC, 'pages', file), 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(file + ': missing <!--meta --> block');
  sources.push({ meta: JSON.parse(m[1]), body: raw.slice(m[0].length) });
}
CATEGORIES.forEach(c => sources.push(categoryPage(c)));
const genDir = path.join(SRC, 'generators');
if (fs.existsSync(genDir)) {
  for (const file of fs.readdirSync(genDir).sort()) {
    if (file.endsWith('.js')) sources.push(...require(path.join(genDir, file))({ config, today }));
  }
}

// "Embed this calculator" box for pages that opt in with "embed": true
function embedBox(meta) {
  const src = config.siteUrl + meta.path + '?embed=1';
  const code = '<iframe src="' + src + '" width="100%" height="900" style="border:0;max-width:760px" loading="lazy" title="' +
    esc(meta.breadcrumb || meta.title) + '"></iframe>\n<p style="font-size:13px">' + esc(meta.breadcrumb || 'Calculator') +
    ' by <a href="' + config.siteUrl + meta.path + '">LiveLifeTricks</a></p>';
  return '\n<section class="wrap narrow content embed-box">\n  <details class="more">\n    <summary>Add this calculator to your website (free)</summary>\n' +
    '    <p class="small muted">Copy this code into your blog or website. It always shows the latest tax rules.</p>\n' +
    '    <textarea class="embed-code" readonly rows="5" onclick="this.select()">' + code.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</textarea>\n' +
    '  </details>\n</section>\n';
}

const built = new Set();
for (const { meta, body: rawBody } of sources) {
  built.add(meta.path);
  let body = rawBody;
  const tool = toolOf(meta.path);
  if (tool) {
    const cat = catOf(tool.cat);
    meta.breadcrumbParent = { name: cat.name, path: cat.path };
    body = body.replace(/<nav class="crumbs"[\s\S]*?<\/nav>/, crumbsFor(tool, meta.breadcrumb || tool.name)) + relatedFor(tool);
  }
  if (meta.embed) body += embedBox(meta);
  const url = config.siteUrl + meta.path;

  const schemas = [];
  if (meta.schema) schemas.push(...[].concat(meta.schema));
  if (meta.breadcrumb) {
    const items = [{ name: 'Home', item: config.siteUrl + '/' }];
    if (meta.breadcrumbParent) items.push({ name: meta.breadcrumbParent.name, item: config.siteUrl + meta.breadcrumbParent.path });
    items.push({ name: meta.breadcrumb, item: url });
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item }))
    });
  }
  // FAQ schema is built from <details class="faq"> blocks so the page and schema never drift apart.
  const faqs = [...body.matchAll(/<details class="faq">\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)];
  if (faqs.length) {
    const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: strip(f[1]),
        acceptedAnswer: { '@type': 'Answer', text: strip(f[2]) }
      }))
    });
  }

  let head = '';
  for (const s of schemas) head += '<script type="application/ld+json">' + JSON.stringify(s) + '</script>\n';
  if (meta.noindex) head += '<meta name="robots" content="noindex">\n';
  for (const href of meta.externalStyles || []) head += '<link rel="stylesheet" href="' + href + '">\n';
  for (const css of meta.styles || []) head += '<link rel="stylesheet" href="' + asset('css/' + css) + '">\n';
  if (config.ga4Id) {
    head += '<script async src="https://www.googletagmanager.com/gtag/js?id=' + config.ga4Id + '"></script>\n' +
      '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + config.ga4Id + '");</script>\n';
  }
  if (config.adsenseClient) {
    head += '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + config.adsenseClient + '" crossorigin="anonymous"></script>\n';
  }

  const scripts = ['common.js'].concat(meta.scripts || [])
    .map(s => '<script src="' + asset('js/' + s) + '" defer></script>').join('\n');

  const vars = {
    title: esc(meta.title),
    description: esc(meta.description),
    canonical: url,
    ogType: meta.path === '/' ? 'website' : 'article',
    siteName: config.siteName,
    siteUrl: config.siteUrl,
    contactEmail: config.contactEmail,
    css: asset('css/style.css'),
    year: String(new Date().getFullYear()),
    updated: meta.updated || today,
    head: head,
    scripts: scripts,
    nav: navHtml(tool ? tool.cat : (CATEGORIES.find(c => c.path === meta.path) || {}).id),
    footerCols: footerCols,
    homeSections: homeSections
  };
  const html = layout
    .replace('{{content}}', () => body)
    .replace(/{{(\w+)}}/g, (all, key) => (key in vars ? vars[key] : all));

  const out = meta.path === '/404' ? path.join(DIST, '404.html') : path.join(DIST, meta.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (!meta.noindex) pages.push({ loc: url, priority: meta.priority || '0.5' });
  console.log('built', path.relative(ROOT, out));
}

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map(p => '  <url><loc>' + p.loc + '</loc><lastmod>' + today + '</lastmod><priority>' + p.priority + '</priority></url>').join('\n') +
  '\n</urlset>\n';
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + config.siteUrl + '/sitemap.xml\n');
console.log('built sitemap.xml with', pages.length, 'pages');
const missing = TOOLS.filter(t => !built.has(t.path)).map(t => t.path);
if (missing.length) console.log('NOTE: listed in src/tools.js but no page yet:', missing.join(', '));
