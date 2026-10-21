#!/usr/bin/env node
/*
 * Builds the static site into dist/.
 *   node build.js
 *
 * Each file in src/pages starts with a meta block:
 *   <!--meta {"title": "...", "description": "...", "path": "/x/", ...} -->
 * The page body is placed inside src/layout.html.
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
const pages = [];

for (const file of fs.readdirSync(path.join(SRC, 'pages')).sort()) {
  if (!file.endsWith('.html')) continue;
  const raw = fs.readFileSync(path.join(SRC, 'pages', file), 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(file + ': missing <!--meta --> block');
  const meta = JSON.parse(m[1]);
  const body = raw.slice(m[0].length);
  const url = config.siteUrl + meta.path;

  const schemas = [];
  if (meta.schema) schemas.push(...[].concat(meta.schema));
  if (meta.breadcrumb) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: config.siteUrl + '/' },
        { '@type': 'ListItem', position: 2, name: meta.breadcrumb, item: url }
      ]
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
    scripts: scripts
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
