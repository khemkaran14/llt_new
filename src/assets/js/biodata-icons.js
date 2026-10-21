/*
 * Religious and auspicious icons for biodata headers, drawn as original SVG
 * (viewBox 0 0 100 100, coloured with currentColor) so they stay sharp and
 * export cleanly to PDF/JPG. Om and Ik Onkar use the script itself (Noto fonts).
 *
 * Browser: window.BiodataIcons. Node: module.exports.
 */
(function (root) {
  'use strict';
  var W = 'fill="#fff" fill-opacity=".85"';          // light detail
  var WS = 'stroke="#fff" stroke-opacity=".85" fill="none"';

  function petals(cx, cy, n, len, wid, rot) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<path transform="rotate(' + (rot + 360 / n * i) + ' ' + cx + ' ' + cy + ')" d="M' + cx + ' ' + cy + ' q' + wid + ' ' + (-len / 2) + ' 0 ' + (-len) + ' q' + (-wid) + ' ' + (len / 2) + ' 0 ' + len + 'z"/>';
    }
    return s;
  }

  var ICONS = {
    // ---- Hindu ----
    ganesha: { label: 'Ganesha', group: 'Hindu', svg:
      '<path d="M28 96 C26 74 38 64 50 64 C62 64 74 74 72 96Z" opacity=".78"/>' +
      '<ellipse cx="27" cy="40" rx="14" ry="17" opacity=".85"/><ellipse cx="73" cy="40" rx="14" ry="17" opacity=".85"/>' +
      '<path d="M36 22 L39 9 L45 16 L50 5 L55 16 L61 9 L64 22Z"/>' +
      '<rect x="35" y="20" width="30" height="5" rx="2"/>' +
      '<circle cx="50" cy="38" r="16"/>' +
      '<path d="M50 48 C49 60 41 66 42 75 C43 82 52 83 55 76" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M50 48 C49 60 41 66 42 75 C43 82 52 83 55 76" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M57 47 L64 54" ' + WS + ' stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="44" cy="35" r="2" ' + W + '/><circle cx="56" cy="35" r="2" ' + W + '/>' +
      '<path d="M47 27 Q50 22 53 27" ' + WS + ' stroke-width="2"/><path d="M50 26 V31" ' + WS + ' stroke-width="2"/>' +
      '<circle cx="74" cy="80" r="6"/><path d="M68 80 Q74 70 80 80" ' + WS + ' stroke-width="1.5"/>' },
    om: { label: 'Om', group: 'Hindu', glyph: 'ॐ', font: "'Noto Sans Devanagari', 'Mangal', serif" },
    kalash: { label: 'Kalash', group: 'Hindu', svg:
      '<path d="M50 41 C40 30 30 29 20 33 C31 35 40 38 50 41Z"/><path d="M50 41 C60 30 70 29 80 33 C69 35 60 38 50 41Z"/>' +
      '<path d="M50 41 C45 28 38 21 31 20 C37 29 43 36 50 41Z"/><path d="M50 41 C55 28 62 21 69 20 C63 29 57 36 50 41Z"/>' +
      '<ellipse cx="50" cy="27" rx="9" ry="12"/>' +
      '<rect x="35" y="40" width="30" height="8" rx="3"/>' +
      '<path d="M27 58 C27 82 39 94 50 94 C61 94 73 82 73 58 C73 51 64 48 50 48 C36 48 27 51 27 58Z"/>' +
      '<path d="M31 64 Q50 72 69 64" ' + WS + ' stroke-width="2.5"/><path d="M33 72 Q50 80 67 72" ' + WS + ' stroke-width="1.5"/>' +
      '<circle cx="50" cy="83" r="3" ' + W + '/>' },
    diya: { label: 'Diya', group: 'Hindu', svg:
      '<path d="M50 60 C38 46 44 30 50 14 C56 30 62 46 50 60Z"/>' +
      '<path d="M50 56 C45 48 47 40 50 32 C53 40 55 48 50 56Z" ' + W + '/>' +
      '<path d="M10 62 C20 62 30 64 50 64 C70 64 80 62 90 62 C84 82 68 90 50 90 C32 90 16 82 10 62Z"/>' +
      '<path d="M22 72 Q50 80 78 72" ' + WS + ' stroke-width="2"/>' +
      '<path d="M86 60 L96 56 L92 66Z"/>' },
    lotus: { label: 'Lotus', group: 'Hindu', svg:
      '<path d="M50 82 C36 64 38 40 50 18 C62 40 64 64 50 82Z"/>' +
      '<path d="M50 82 C34 76 24 58 26 38 C40 46 48 62 50 82Z" opacity=".85"/><path d="M50 82 C66 76 76 58 74 38 C60 46 52 62 50 82Z" opacity=".85"/>' +
      '<path d="M50 82 C30 82 14 70 8 54 C26 54 42 66 50 82Z" opacity=".7"/><path d="M50 82 C70 82 86 70 92 54 C74 54 58 66 50 82Z" opacity=".7"/>' +
      '<path d="M20 88 Q50 80 80 88" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' },
    swastik: { label: 'Swastik', group: 'Hindu / Jain', svg:
      '<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter">' +
      '<path d="M50 50 V20 H78"/><path d="M50 50 H80 V78"/><path d="M50 50 V80 H22"/><path d="M50 50 H20 V22"/></g>' +
      '<circle cx="35" cy="35" r="4.5"/><circle cx="65" cy="35" r="4.5"/><circle cx="65" cy="65" r="4.5"/><circle cx="35" cy="65" r="4.5"/>' },
    // ---- Sikh ----
    khanda: { label: 'Khanda', group: 'Sikh', svg:
      '<circle cx="50" cy="52" r="21" fill="none" stroke="currentColor" stroke-width="6"/>' +
      '<path d="M50 6 L55 18 L55 76 L50 82 L45 76 L45 18Z"/>' +
      '<rect x="40" y="76" width="20" height="5" rx="2"/><rect x="47" y="81" width="6" height="12" rx="2"/>' +
      '<path d="M33 88 C10 72 10 38 30 22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M67 88 C90 72 90 38 70 22" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M28 84 L40 92 M72 84 L60 92" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>' },
    ikonkar: { label: 'Ik Onkar', group: 'Sikh', glyph: 'ੴ', font: "'Noto Sans Gurmukhi', 'Raavi', serif" },
    // ---- Muslim ----
    crescent: { label: 'Crescent & Star', group: 'Muslim', svg:
      '<mask id="bdcm"><rect width="100" height="100" fill="#fff"/><circle cx="58" cy="44" r="29" fill="#000"/></mask>' +
      '<circle cx="45" cy="52" r="35" mask="url(#bdcm)"/>' +
      '<path d="M70 34 L73.5 43.5 L83.6 43.9 L75.7 50.2 L78.4 59.9 L70 54.3 L61.6 59.9 L64.3 50.2 L56.4 43.9 L66.5 43.5Z"/>' },
    // ---- Christian ----
    cross: { label: 'Cross', group: 'Christian', svg:
      '<path d="M45 8 H55 V30 H76 V40 H55 V92 H45 V40 H24 V30 H45Z"/>' +
      '<circle cx="50" cy="8" r="5"/><circle cx="50" cy="92" r="5"/><circle cx="24" cy="35" r="5"/><circle cx="76" cy="35" r="5"/>' +
      '<g opacity=".45" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M50 22 V14 M38 35 H30 M62 35 H70 M41 26 L36 21 M59 26 L64 21"/></g>' },
    // ---- Jain ----
    ahimsa: { label: 'Ahimsa hand', group: 'Jain', svg:
      '<path d="M30 92 L30 52 C30 46 37 46 37 52 L37 26 C37 20 44 20 44 26 L44 20 C44 14 51 14 51 20 L51 22 C51 16 58 16 58 22 L58 28 C58 22 65 22 65 28 L65 62 C70 54 78 55 76 63 L68 78 C64 87 57 92 48 92Z"/>' +
      '<circle cx="47" cy="66" r="10" ' + WS + ' stroke-width="2.5"/>' +
      '<g ' + WS + ' stroke-width="1.6"><path d="M47 56 V76 M37 66 H57 M40 59 L54 73 M54 59 L40 73"/></g>' },
    // ---- Buddhist ----
    dharma: { label: 'Dharma Wheel', group: 'Buddhist', svg:
      '<circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" stroke-width="6"/>' +
      '<circle cx="50" cy="50" r="9"/>' +
      '<g stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M50 17 V83 M17 50 H83 M26.7 26.7 L73.3 73.3 M73.3 26.7 L26.7 73.3"/></g>' +
      '<g>' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<circle transform="rotate(' + a + ' 50 50)" cx="50" cy="8" r="5"/>'; }).join('') + '</g>' },
    // ---- Jewish ----
    david: { label: 'Star of David', group: 'Jewish', svg:
      '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"><path d="M50 12 L84 70 H16Z"/><path d="M50 88 L16 30 H84Z"/></g>' },
    // ---- Parsi ----
    atash: { label: 'Sacred fire', group: 'Parsi', svg:
      '<path d="M50 60 C36 48 42 32 50 12 C58 32 64 48 50 60Z"/><path d="M40 60 C32 52 34 44 38 36 C40 46 44 52 40 60Z" opacity=".8"/><path d="M60 60 C68 52 66 44 62 36 C60 46 56 52 60 60Z" opacity=".8"/>' +
      '<path d="M50 56 C46 50 47 44 50 36 C53 44 54 50 50 56Z" ' + W + '/>' +
      '<path d="M30 62 H70 L63 75 H37Z"/><rect x="45" y="75" width="10" height="9"/><rect x="34" y="84" width="32" height="6" rx="2"/>' },
    // ---- Everyone ----
    rings: { label: 'Wedding rings', group: 'Non-religious', svg:
      '<g fill="none" stroke="currentColor" stroke-width="6"><circle cx="38" cy="58" r="22"/><circle cx="62" cy="58" r="22"/></g>' +
      '<path d="M38 36 L32 28 L38 22 L44 28Z"/>' },
    flower: { label: 'Flower', group: 'Non-religious', svg: petals(50, 50, 8, 38, 13, 0) + '<circle cx="50" cy="50" r="9" ' + W + '/>' }
  };

  // Ready-made top lines (users can still type their own)
  var INVOCATIONS = [
    '|| Shree Ganeshay Namah ||', '|| Om Namah Shivaya ||', '|| Jai Shri Krishna ||', '|| Jai Shri Ram ||', '|| Jai Mata Di ||',
    '|| श्री गणेशाय नमः ||', 'ੴ ਸਤਿ ਨਾਮੁ', 'Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh',
    'بسم الله الرحمن الرحيم', 'Bismillah ir-Rahman ir-Rahim', 'With the blessings of the Almighty',
    'God is Love', 'With God\'s grace', '|| Jai Jinendra ||', 'Namo Buddhaya', 'Humata, Hukhta, Hvarshta'
  ];

  // Old saved data used "symbol"; map those to icons.
  var LEGACY = { om: 'om', khanda: 'khanda', cross: 'cross', crescent: 'crescent', flower: 'flower' };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // color is written into the SVG itself: the PDF/JPG export draws SVGs as separate images,
  // where CSS colours (currentColor) would be lost.
  function html(id, imgDataUrl, color) {
    color = /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '#8a6a1f';
    if (imgDataUrl) return '<div class="bd-icon bd-icon-img" style="background-image:url(&quot;' + esc(imgDataUrl) + '&quot;)"></div>';
    var ic = ICONS[id] || ICONS[LEGACY[id]];
    if (!ic) return '';
    if (ic.glyph) return '<div class="bd-icon bd-icon-glyph" style="color:' + color + ';font-family:' + ic.font.replace(/"/g, "'") + '">' + ic.glyph + '</div>';
    return '<div class="bd-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" fill="' + color + '" aria-hidden="true">' + ic.svg.replace(/currentColor/g, color) + '</svg></div>';
  }

  var api = { ICONS: ICONS, INVOCATIONS: INVOCATIONS, html: html };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BiodataIcons = api;
})(this);
