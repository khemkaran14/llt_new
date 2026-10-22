/*
 * Small, safe Markdown renderer for blog posts. All text is HTML-escaped
 * first, so a post can never inject scripts. Supports:
 *   ## Heading (## to ####; a single # is shown as ##)
 *   paragraphs, **bold**, *italic*, `code`, [link](url), ![alt](image-url)
 *   - lists, 1. lists, > quotes, --- lines, ``` code blocks, | tables |
 *   [[tool:/emi-calculator/]]  -> a card linking to one of our tools
 */
'use strict';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Only allow safe link targets
function safeUrl(u) {
  u = String(u || '').trim();
  if (/^(https?:\/\/|\/(?!\/)|#|mailto:)/i.test(u)) return u.replace(/"/g, '%22');
  return '';
}

function inline(text) {
  // Work on escaped text; protect code spans first.
  const codes = [];
  let s = esc(text).replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    return u ? '<img src="' + esc(u) + '" alt="' + alt + '" loading="lazy">' : m;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const u = safeUrl(url.replace(/&amp;/g, '&'));
    if (!u) return label;
    const ext = /^https?:\/\//i.test(u) && !/^https?:\/\/(www\.)?livelifetricks\.com/i.test(u);
    return '<a href="' + esc(u) + '"' + (ext ? ' rel="noopener" target="_blank"' : '') + '>' + label + '</a>';
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => '<code>' + codes[i] + '</code>');
}

function render(md, opts) {
  opts = opts || {};
  const lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const isBlockStart = l => /^(#{1,4}\s|[-*]\s|\d+\.\s|>\s?|```|---\s*$|\|.*\|\s*$|\[\[tool:)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if (line.startsWith('```')) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
    } else if ((m = line.match(/^(#{1,4})\s+(.+)/))) {
      const level = Math.max(2, m[1].length);
      const text = m[2].trim();
      const id = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
      out.push('<h' + level + ' id="' + id + '">' + inline(text) + '</h' + level + '>');
      i++;
    } else if (/^---\s*$/.test(line)) {
      out.push('<hr>'); i++;
    } else if ((m = line.match(/^\[\[tool:([^\]]+)\]\]\s*$/))) {
      const t = opts.toolCard ? opts.toolCard(m[1].trim()) : '';
      if (t) out.push(t);
      i++;
    } else if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push('<blockquote>' + render(buf.join('\n'), opts) + '</blockquote>');
    } else if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line), re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i++].replace(re, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push('<li>' + inline(item) + '</li>');
      }
      out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>'));
    } else if (/^\|.*\|\s*$/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const sep = rows[1] && /^\|?\s*:?-{2,}/.test(rows[1]);
      const head = sep ? cells(rows[0]) : null;
      const body = rows.slice(sep ? 2 : 0).map(cells);
      out.push('<div class="table-wrap"><table>' + (head ? '<thead><tr>' + head.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>' : '') +
        '<tbody>' + body.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>');
    } else {
      const buf = [];
      while (i < lines.length && lines[i].trim() && !(buf.length && isBlockStart(lines[i]))) buf.push(lines[i++].trim());
      const text = buf.join(' ');
      // A paragraph that is only an image becomes a figure
      const img = text.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
      out.push(img ? '<figure>' + inline(text) + (img[1] ? '<figcaption>' + esc(img[1]) + '</figcaption>' : '') + '</figure>' : '<p>' + inline(text) + '</p>');
    }
  }
  return out.join('\n');
}

// Plain text (for descriptions, reading time and RSS)
function plain(md) {
  return String(md || '').replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[\[tool:[^\]]+\]\]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*_`|-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { render, plain, esc, safeUrl };
