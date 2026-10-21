/*
 * Marriage biodata templates.
 * 25 designs built from 5 layouts, colour palettes, fonts and SVG ornaments.
 * The tier ('free' | 'premium') here is also what the server uses to decide
 * whether payment is needed, so it can't be changed from the browser.
 *
 * Browser: window.Biodata. Node: module.exports.
 */
(function (root) {
  'use strict';

  var FONTS = {
    cinzel: "'Cinzel', 'Times New Roman', serif",
    playfair: "'Playfair Display', Georgia, serif",
    cormorant: "'Cormorant Garamond', Georgia, serif",
    lora: "'Lora', Georgia, serif",
    marcellus: "'Marcellus', Georgia, serif",
    poppins: "'Poppins', 'Segoe UI', Arial, sans-serif",
    vibes: "'Great Vibes', 'Brush Script MT', cursive",
    sans: "'Poppins', 'Segoe UI', Arial, sans-serif"
  };

  // Palette: bg, ink (text), accent (headings/lines), accent2 (ornaments), soft (panels), side (sidebar/band), sideInk
  var P = {
    maroon: { bg: '#fffaf3', ink: '#3a1d1d', accent: '#7a1f2b', accent2: '#c9a24a', soft: '#f6ead8', side: '#7a1f2b', sideInk: '#fff6e6' },
    navy: { bg: '#ffffff', ink: '#1d2433', accent: '#1f3a68', accent2: '#8aa2c8', soft: '#eef2f8', side: '#1f3a68', sideInk: '#ffffff' },
    teal: { bg: '#ffffff', ink: '#16302d', accent: '#0f766e', accent2: '#5eb8ad', soft: '#e7f4f2', side: '#0f766e', sideInk: '#ffffff' },
    rose: { bg: '#fffafb', ink: '#3b2229', accent: '#b4436c', accent2: '#e8a0b8', soft: '#fbe9ef', side: '#b4436c', sideInk: '#ffffff' },
    saffron: { bg: '#fffcf5', ink: '#3a2a12', accent: '#d9730d', accent2: '#f2b84b', soft: '#fdf0dc', side: '#d9730d', sideInk: '#ffffff' },
    mono: { bg: '#ffffff', ink: '#1a1a1a', accent: '#1a1a1a', accent2: '#9a9a9a', soft: '#f3f3f3', side: '#1a1a1a', sideInk: '#ffffff' },
    emerald: { bg: '#fbfdf9', ink: '#17301f', accent: '#1e6b3a', accent2: '#b89b4a', soft: '#e9f3ea', side: '#1e6b3a', sideInk: '#fdf8e8' },
    purple: { bg: '#fdfbff', ink: '#2a1f3a', accent: '#5b3a8f', accent2: '#b49ad8', soft: '#f1ebf9', side: '#5b3a8f', sideInk: '#ffffff' },
    sky: { bg: '#f7fbff', ink: '#1b2a3a', accent: '#2b74b8', accent2: '#8cc0ea', soft: '#e6f1fb', side: '#2b74b8', sideInk: '#ffffff' },
    coral: { bg: '#fffaf8', ink: '#3a2420', accent: '#d45d45', accent2: '#f0a693', soft: '#fcebe6', side: '#d45d45', sideInk: '#ffffff' },
    gold: { bg: '#fffdf6', ink: '#3b2f1a', accent: '#8a6a1f', accent2: '#c9a24a', soft: '#f7efda', side: '#8a6a1f', sideInk: '#fffaf0' },
    peacock: { bg: '#fbfeff', ink: '#13303a', accent: '#0e5f76', accent2: '#2bb3a6', soft: '#e3f3f6', side: '#0e5f76', sideInk: '#ffffff' },
    rosegold: { bg: '#fffaf7', ink: '#3d2a26', accent: '#a45a4a', accent2: '#d9a48f', soft: '#f8ebe5', side: '#a45a4a', sideInk: '#ffffff' },
    night: { bg: '#141a2b', ink: '#ece6d6', accent: '#d8b45c', accent2: '#d8b45c', soft: '#1e2740', side: '#0d1220', sideInk: '#ece6d6' },
    marigold: { bg: '#fffcf2', ink: '#3a2a0e', accent: '#c75f00', accent2: '#f5b301', soft: '#fff1cf', side: '#c75f00', sideInk: '#ffffff' },
    sindoor: { bg: '#fffaf6', ink: '#3a1512', accent: '#b3201a', accent2: '#d9a441', soft: '#f9e6df', side: '#b3201a', sideInk: '#fff5e6' },
    mint: { bg: '#f8fdfb', ink: '#1d3329', accent: '#2f8a6a', accent2: '#9fd8c2', soft: '#e6f6ef', side: '#2f8a6a', sideInk: '#ffffff' },
    heritage: { bg: '#fdf8f0', ink: '#33261a', accent: '#6b4423', accent2: '#c08a4a', soft: '#f2e6d4', side: '#6b4423', sideInk: '#fdf3e3' },
    twilight: { bg: '#fcfaff', ink: '#2a2140', accent: '#4a2f7a', accent2: '#c9a24a', soft: '#efe9f8', side: '#4a2f7a', sideInk: '#fff8e8' },
    lavender: { bg: '#fcfbff', ink: '#2d2640', accent: '#6c5bb3', accent2: '#c3b6ef', soft: '#efecfb', side: '#6c5bb3', sideInk: '#ffffff' },
    // Colourful designs. "outer" is the page colour around a panel; "bg" is the panel or text area.
    sageFoil: { bg: '#7d9868', ink: '#fdf8ea', accent: '#f6e3a6', accent2: '#e9c66d', soft: '#6e895a', side: '#5d784b', sideInk: '#fff', icon: '#f6e3a6' },
    blueFoil: { bg: '#1d3c86', ink: '#f4efe1', accent: '#f3d47c', accent2: '#e2bb57', soft: '#24489a', side: '#152d66', sideInk: '#fff', icon: '#f3d47c' },
    wine: { outer: '#6b1530', bg: '#fff8ee', ink: '#3a1420', accent: '#8c1d3b', accent2: '#c9a24a', soft: '#f6e7dc', side: '#6b1530', sideInk: '#fff' },
    maroonArch: { outer: '#7a1f2b', bg: '#fff8ec', ink: '#3a1d1d', accent: '#7a1f2b', accent2: '#c9a24a', soft: '#f6ead8', side: '#7a1f2b', sideInk: '#fff' },
    emeraldArch: { outer: '#0f5132', bg: '#fffbf0', ink: '#16301f', accent: '#0f5132', accent2: '#c9a24a', soft: '#eef3e6', side: '#0f5132', sideInk: '#fff' },
    blueArch: { outer: '#16306b', bg: '#fbfaf5', ink: '#1a2440', accent: '#1d3d85', accent2: '#c9a24a', soft: '#eceff7', side: '#16306b', sideInk: '#fff' },
    ivoryVine: { bg: '#fffdf4', ink: '#2b2b1f', accent: '#55782a', accent2: '#c79a3a', soft: '#f3f0dc', side: '#55782a', sideInk: '#fff', leaf: '#6f9a3a', bloom: '#d9a23a' },
    blushVine: { bg: '#fff6f7', ink: '#3b2229', accent: '#b5446e', accent2: '#e48aa8', soft: '#fbe8ee', side: '#b5446e', sideInk: '#fff', leaf: '#7aa36b', bloom: '#e46a92' },
    turquoise: { outer: '#0e8a8a', bg: '#fffdf7', ink: '#123333', accent: '#0b6b6b', accent2: '#f2b134', soft: '#e3f4f2', side: '#0e8a8a', sideInk: '#fff', third: '#e0457b' },
    plum: { outer: '#4a1f4f', bg: '#fdf9f3', ink: '#2c1630', accent: '#5d2763', accent2: '#c9a24a', soft: '#f1e8ef', side: '#4a1f4f', sideInk: '#fff' },
    magenta: { outer: '#a3135f', bg: '#fffaf3', ink: '#3a1028', accent: '#a3135f', accent2: '#e3b448', soft: '#fbe6ef', side: '#a3135f', sideInk: '#fff' },
    sunset: { outer: '#e8456b', outerGrad: 'linear-gradient(160deg, #ff9a5a 0%, #e8456b 52%, #9d3aa6 100%)', bg: '#ffffff', ink: '#3a2030', accent: '#d6455f', accent2: '#f2a65a', soft: '#fff1ec', side: '#d6455f', sideInk: '#fff' },
    ocean: { outer: '#1b6fb5', outerGrad: 'linear-gradient(160deg, #22c1b0 0%, #1b6fb5 58%, #263b8f 100%)', bg: '#ffffff', ink: '#16283a', accent: '#1b6fb5', accent2: '#22b0a3', soft: '#e8f4fb', side: '#1b6fb5', sideInk: '#fff' },
    saffronPaisley: { outer: '#e57a10', bg: '#fffaf0', ink: '#3a2410', accent: '#b34d00', accent2: '#c22f2f', soft: '#fdeedb', side: '#e57a10', sideInk: '#fff' },
    forest: { outer: '#123524', bg: '#173f2c', ink: '#f2ead2', accent: '#e4c46c', accent2: '#d6b25a', soft: '#1d4a34', side: '#123524', sideInk: '#fff', icon: '#e4c46c' },
    sagePanel: { outer: '#9cb48a', bg: '#ffffff', ink: '#24301f', accent: '#4c6a3c', accent2: '#9cb48a', soft: '#eef3e9', side: '#4c6a3c', sideInk: '#fff' },
    bluePanel: { outer: '#2f5fb3', bg: '#ffffff', ink: '#1b2640', accent: '#2f5fb3', accent2: '#9ab7e8', soft: '#eaf0fb', side: '#2f5fb3', sideInk: '#fff' },
    peach: { bg: '#fff3ea', ink: '#3a2418', accent: '#cf5f36', accent2: '#f2a07c', soft: '#ffe5d6', side: '#cf5f36', sideInk: '#fff' },
    lilac: { outer: '#b6a2e0', bg: '#ffffff', ink: '#2a2340', accent: '#6a4fb0', accent2: '#b6a2e0', soft: '#f1edfb', side: '#6a4fb0', sideInk: '#fff' },
    mustard: { bg: '#fffbf0', ink: '#33280f', accent: '#a87400', accent2: '#e2b13c', soft: '#fdf1d2', side: '#d9a21b', sideInk: '#2a1f00' }
  };

  function t(id, name, tier, layout, palette, o) {
    o = o || {};
    return { id: id, name: name, tier: tier, layout: layout, palette: palette, ornaments: o.orn || [], head: o.head || 'playfair', body: o.body || 'lora', nameFont: o.nameFont || o.head || 'playfair', photo: o.photo || 'round', panel: o.panel || 'rect' };
  }

  var TEMPLATES = [
    // Free
    t('classic-maroon', 'Classic Maroon', 'free', 'classic', 'maroon', { orn: ['border'], head: 'cinzel' }),
    t('simple-navy', 'Simple Navy', 'free', 'classic', 'navy', { head: 'playfair', body: 'sans' }),
    t('sidebar-teal', 'Teal Sidebar', 'free', 'sidebar', 'teal', { head: 'poppins', body: 'sans', photo: 'rounded' }),
    t('modern-rose', 'Modern Rose', 'free', 'cards', 'rose', { head: 'playfair', body: 'sans' }),
    t('header-saffron', 'Saffron Band', 'free', 'band', 'saffron', { head: 'marcellus', body: 'lora' }),
    t('minimal-mono', 'Minimal Black', 'free', 'classic', 'mono', { head: 'poppins', body: 'sans', photo: 'rounded' }),
    t('frame-emerald', 'Emerald Frame', 'free', 'frame', 'emerald', { orn: ['border'], head: 'cormorant', body: 'lora' }),
    t('sidebar-purple', 'Purple Sidebar', 'free', 'sidebar', 'purple', { head: 'playfair', body: 'sans' }),
    t('cards-sky', 'Sky Cards', 'free', 'cards', 'sky', { head: 'poppins', body: 'sans', photo: 'rounded' }),
    t('band-coral', 'Coral Band', 'free', 'band', 'coral', { head: 'playfair', body: 'sans' }),
    // Premium
    t('royal-maroon', 'Royal Maroon & Gold', 'premium', 'frame', 'maroon', { orn: ['border', 'corners', 'mandala'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('regal-navy', 'Regal Navy & Gold', 'premium', 'frame', 'navy', { orn: ['border', 'corners'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('mandala-saffron', 'Saffron Mandala', 'premium', 'classic', 'saffron', { orn: ['mandala', 'garland'], head: 'marcellus', nameFont: 'vibes' }),
    t('blush-floral', 'Blush Floral', 'premium', 'classic', 'rose', { orn: ['garland', 'corners'], head: 'cormorant', nameFont: 'vibes', photo: 'arch' }),
    t('emerald-palace', 'Emerald Palace', 'premium', 'sidebar', 'emerald', { orn: ['sidemandala'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('lotus-lavender', 'Lotus Lavender', 'premium', 'frame', 'lavender', { orn: ['border', 'mandala'], head: 'cormorant', nameFont: 'vibes' }),
    t('golden-ivory', 'Golden Ivory', 'premium', 'classic', 'gold', { orn: ['corners', 'border'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('peacock-band', 'Peacock', 'premium', 'band', 'peacock', { orn: ['corners'], head: 'marcellus', nameFont: 'vibes' }),
    t('rose-gold-cards', 'Rose Gold', 'premium', 'cards', 'rosegold', { orn: ['corners'], head: 'cormorant', nameFont: 'vibes', photo: 'arch' }),
    t('midnight-gold', 'Midnight Gold', 'premium', 'frame', 'night', { orn: ['border', 'corners', 'mandala'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('marigold-band', 'Marigold', 'premium', 'band', 'marigold', { orn: ['garland'], head: 'marcellus', nameFont: 'vibes' }),
    t('sindoor-red', 'Sindoor Red', 'premium', 'classic', 'sindoor', { orn: ['corners', 'mandala'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('mint-garden', 'Mint Garden', 'premium', 'cards', 'mint', { orn: ['garland'], head: 'cormorant', nameFont: 'vibes' }),
    t('heritage-brown', 'Heritage', 'premium', 'sidebar', 'heritage', { orn: ['border', 'sidemandala'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('twilight-gold', 'Twilight Purple & Gold', 'premium', 'frame', 'twilight', { orn: ['border', 'corners', 'mandala'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    // ---- Colourful collection ----
    t('sage-panel', 'Sage Card', 'free', 'panel', 'sagePanel', { head: 'playfair', body: 'sans', panel: 'round' }),
    t('blue-panel', 'Blue Card', 'free', 'panel', 'bluePanel', { head: 'poppins', body: 'sans', panel: 'round', photo: 'rounded' }),
    t('peach-dots', 'Peach Dots', 'free', 'classic', 'peach', { orn: ['dots'], head: 'playfair', body: 'sans' }),
    t('lilac-panel', 'Lilac Card', 'free', 'panel', 'lilac', { head: 'cormorant', body: 'lora', panel: 'round' }),
    t('mustard-band', 'Mustard Band', 'free', 'band', 'mustard', { head: 'marcellus', body: 'lora' }),
    t('sage-foil', 'Sage & Gold Foil', 'premium', 'classic', 'sageFoil', { orn: ['foil'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('royal-blue-foil', 'Royal Blue Foil', 'premium', 'classic', 'blueFoil', { orn: ['foil'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('wine-foil-frame', 'Wine & Gold Frame', 'premium', 'panel', 'wine', { orn: ['foilframe'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('palace-maroon', 'Palace Maroon', 'premium', 'panel', 'maroonArch', { orn: ['damask', 'archline'], head: 'cinzel', nameFont: 'vibes', panel: 'arch', photo: 'arch' }),
    t('palace-emerald', 'Palace Emerald', 'premium', 'panel', 'emeraldArch', { orn: ['damask', 'archline'], head: 'cinzel', nameFont: 'vibes', panel: 'arch', photo: 'arch' }),
    t('palace-blue', 'Palace Blue', 'premium', 'panel', 'blueArch', { orn: ['dots', 'archline'], head: 'marcellus', nameFont: 'vibes', panel: 'arch', photo: 'arch' }),
    t('vine-ivory', 'Ivory Vines', 'premium', 'classic', 'ivoryVine', { orn: ['vine'], head: 'cormorant', nameFont: 'vibes', photo: 'arch' }),
    t('vine-blush', 'Blush Vines', 'premium', 'classic', 'blushVine', { orn: ['vine'], head: 'cormorant', nameFont: 'vibes', photo: 'arch' }),
    t('rangoli-turquoise', 'Rangoli Turquoise', 'premium', 'panel', 'turquoise', { orn: ['rangoli'], head: 'marcellus', nameFont: 'vibes', panel: 'round' }),
    t('damask-plum', 'Plum Damask', 'premium', 'panel', 'plum', { orn: ['damask', 'foilframe'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('magenta-gold', 'Magenta & Gold', 'premium', 'panel', 'magenta', { orn: ['foilframe', 'corners'], head: 'cinzel', nameFont: 'vibes', photo: 'arch' }),
    t('sunset-glow', 'Sunset Glow', 'premium', 'panel', 'sunset', { orn: ['dotsLight'], head: 'playfair', nameFont: 'vibes', panel: 'round' }),
    t('ocean-breeze', 'Ocean Breeze', 'premium', 'panel', 'ocean', { orn: ['dotsLight'], head: 'playfair', nameFont: 'vibes', panel: 'round', photo: 'rounded' }),
    t('paisley-saffron', 'Saffron Paisley', 'premium', 'panel', 'saffronPaisley', { orn: ['paisley'], head: 'marcellus', nameFont: 'vibes', photo: 'arch' }),
    t('forest-gold-arch', 'Forest & Gold Arch', 'premium', 'panel', 'forest', { orn: ['corners', 'archline'], head: 'cinzel', nameFont: 'vibes', panel: 'arch', photo: 'arch' })
  ];

  function byId(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return null; }

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function niceDate(d) {
    if (!d) return '';
    var p = String(d).split('-');
    if (p.length !== 3) return d;
    return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
  }
  function niceTime(tm) {
    if (!tm) return '';
    var p = String(tm).split(':'), h = Number(p[0]);
    if (isNaN(h)) return tm;
    return ((h % 12) || 12) + ':' + (p[1] || '00') + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  var Icons = (typeof module !== 'undefined' && module.exports) ? require('./biodata-icons.js') : root.BiodataIcons;

  // Sections and their rows. Empty values are skipped, and empty sections are dropped.
  function sections(d) {
    var dob = niceDate(d.dob);
    return [
      { key: 'personal', title: 'Personal Details', rows: [
        ['Date of Birth', dob], ['Height', d.height], ['Religion', d.religion], ['Caste / Community', d.caste],
        ['Marital Status', d.marital], ['Diet', d.diet], ['Languages', d.languages], ['Hobbies', d.hobbies]] },
      { key: 'horoscope', title: 'Horoscope', rows: [
        ['Time of Birth', niceTime(d.tob)], ['Place of Birth', d.pob], ['Rashi', d.rashi], ['Nakshatra', d.nakshatra],
        ['Gotra', d.gotra], ['Manglik', d.manglik]] },
      { key: 'career', title: 'Education & Career', rows: [
        ['Education', d.education], ['Occupation', d.occupation], ['Organisation', d.company], ['Annual Income', d.income]] },
      { key: 'family', title: 'Family Details', rows: [
        ['Father', [d.father, d.fatherOcc].filter(Boolean).join(', ')], ['Mother', [d.mother, d.motherOcc].filter(Boolean).join(', ')],
        ['Siblings', d.siblings], ['Family Type', d.familyType], ['Native Place', d.native]] },
      { key: 'contact', title: 'Contact Details', rows: [
        ['Contact Person', d.contactPerson], ['Phone', d.phone], ['Email', d.email], ['Address', d.address]] },
      { key: 'extra', title: 'Other Details', rows: (d.custom || []).map(function (c) { return [c.label, c.value]; }) }
    ].map(function (s) {
      s.rows = s.rows.filter(function (r) { return r[0] && String(r[1] || '').trim(); });
      return s;
    }).filter(function (s) { return s.rows.length; });
  }

  // ---------- SVG ornaments ----------
  function petalRing(cx, cy, r, count, len, wid, color, opacity) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var a = 360 / count * i;
      out += '<path transform="rotate(' + a + ' ' + cx + ' ' + cy + ')" d="M' + cx + ' ' + (cy - r) + ' q' + wid + ' ' + (-len / 2) + ' 0 ' + (-len) + ' q' + (-wid) + ' ' + (len / 2) + ' 0 ' + len + 'z" fill="' + color + '" fill-opacity="' + opacity + '"/>';
    }
    return out;
  }
  function mandala(size, color, opacity) {
    var c = size / 2, o = opacity;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
      '<g fill="none" stroke="' + color + '" stroke-opacity="' + o + '" stroke-width="1.2">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + (c * 0.96) + '"/><circle cx="' + c + '" cy="' + c + '" r="' + (c * 0.62) + '"/><circle cx="' + c + '" cy="' + c + '" r="' + (c * 0.3) + '"/></g>' +
      petalRing(c, c, c * 0.62, 24, c * 0.3, c * 0.07, color, o * 0.9) +
      petalRing(c, c, c * 0.3, 16, c * 0.28, c * 0.06, color, o * 0.8) +
      petalRing(c, c, c * 0.96, 36, c * 0.04, c * 0.04, color, o) +
      petalRing(c, c, c * 0.12, 8, c * 0.16, c * 0.05, color, o * 0.9) +
      '</svg>';
  }
  function corner(color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round">' +
      '<path d="M8 112 V40 Q8 8 40 8 H112"/><path d="M18 112 V48 Q18 18 48 18 H112" stroke-width="1"/>' +
      '<path d="M40 8 q10 18 -4 30 q-14 -8 4 -30z" fill="' + color + '" fill-opacity=".25"/>' +
      '<path d="M8 40 q18 10 30 -4 q-8 -14 -30 4z" fill="' + color + '" fill-opacity=".25"/>' +
      '<circle cx="34" cy="34" r="6" fill="' + color + '" fill-opacity=".5"/><circle cx="34" cy="34" r="12"/>' +
      '<path d="M60 8 q6 -6 12 0 M8 60 q-6 6 0 12" /></g></svg>';
  }
  function garland(color, color2) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="70" viewBox="0 0 700 70" preserveAspectRatio="none" aria-hidden="true"><path d="M10 10 Q350 90 690 10" fill="none" stroke="' + color + '" stroke-width="1.5"/>';
    for (var i = 0; i <= 14; i++) {
      var x = 10 + i * 48.5, y = 10 + 80 * (x - 10) / 680 * (1 - (x - 10) / 680) * 1.0 * 2;
      s += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')">' + petalRing(0, 0, 0, 6, 9, 4, i % 2 ? color2 : color, .85) + '<circle r="2.4" fill="' + color2 + '"/></g>';
      if (i % 2 === 0) s += '<path d="M' + x.toFixed(1) + ' ' + (y + 6).toFixed(1) + ' v' + (8 + (i % 4) * 2) + '" stroke="' + color + '" stroke-width="1"/><circle cx="' + x.toFixed(1) + '" cy="' + (y + 16 + (i % 4) * 2).toFixed(1) + '" r="3" fill="' + color2 + '"/>';
    }
    return s + '</svg>';
  }

  // Leafy vine running round the page edge, with small flowers.
  function vine(leaf, bloom) {
    var x0 = 34, y0 = 34, x1 = 760, y1 = 1089, out = '<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123" aria-hidden="true">';
    out += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" rx="18" fill="none" stroke="' + leaf + '" stroke-width="1.6"/>';
    function leafAt(x, y, a) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="8" ry="3.6" fill="' + leaf + '" fill-opacity=".9" transform="rotate(' + a + ' ' + x + ' ' + y + ') translate(7 0)"/>'; }
    function flower(x, y, r) { return '<g transform="translate(' + x + ' ' + y + ')">' + petalRing(0, 0, 0, 5, r * 1.6, r * 0.9, bloom, .95) + '<circle r="' + (r * 0.45) + '" fill="#fff" fill-opacity=".9"/></g>'; }
    var i = 0, x, y;
    for (x = x0 + 40; x < x1 - 30; x += 26, i++) { out += leafAt(x, y0, i % 2 ? -40 : 40 + 180) + leafAt(x, y1, i % 2 ? 40 : -40 + 180); if (i % 6 === 3) out += flower(x, y0, 6) + flower(x, y1, 6); }
    for (y = y0 + 40; y < y1 - 30; y += 26, i++) { out += leafAt(x0, y, i % 2 ? 50 : -50 + 180 - 80) + leafAt(x1, y, i % 2 ? 130 : -130); if (i % 6 === 3) out += flower(x0, y, 6) + flower(x1, y, 6); }
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (c) { out += flower(c[0], c[1], 11) + flower(c[0], c[1], 5); });
    return out + '</svg>';
  }
  // Colourful rangoli medallion (used half off the page in two corners).
  function rangoli(c1, c2, c3) {
    var s = 300, c = s / 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" aria-hidden="true">' +
      '<circle cx="' + c + '" cy="' + c + '" r="146" fill="' + c1 + '" fill-opacity=".25"/>' +
      petalRing(c, c, 140, 32, 22, 7, c2, .95) + petalRing(c, c, 112, 16, 46, 16, c1, .95) + petalRing(c, c, 80, 16, 36, 12, c3, .95) +
      '<circle cx="' + c + '" cy="' + c + '" r="46" fill="#fff" fill-opacity=".9"/>' + petalRing(c, c, 42, 12, 26, 9, c2, .95) +
      '<circle cx="' + c + '" cy="' + c + '" r="12" fill="' + c3 + '"/></svg>';
  }
  // Repeating background patterns
  function pattern(kind, color, opacity) {
    var tile = kind === 'damask'
      ? '<pattern id="pt" width="64" height="64" patternUnits="userSpaceOnUse"><g fill="' + color + '" fill-opacity="' + opacity + '">' +
        '<path d="M32 10 C38 20 38 26 32 32 C26 26 26 20 32 10Z"/><path d="M32 54 C26 44 26 38 32 32 C38 38 38 44 32 54Z"/>' +
        '<path d="M10 32 C20 26 26 26 32 32 C26 38 20 38 10 32Z"/><path d="M54 32 C44 38 38 38 32 32 C38 26 44 26 54 32Z"/>' +
        '<circle cx="0" cy="0" r="4"/><circle cx="64" cy="0" r="4"/><circle cx="0" cy="64" r="4"/><circle cx="64" cy="64" r="4"/></g></pattern>'
      : '<pattern id="pt" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="2.2" fill="' + color + '" fill-opacity="' + opacity + '"/></pattern>';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123" aria-hidden="true"><defs>' + tile + '</defs><rect width="794" height="1123" fill="url(#pt)"/></svg>';
  }
  // Panel with a palace-arch top
  function archPanel(fill, line) {
    var d = 'M58 1070 V330 C58 214 214 128 397 66 C580 128 736 214 736 330 V1070 Z';
    var d2 = 'M70 1058 V334 C70 224 220 142 397 80 C574 142 724 224 724 334 V1058 Z';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123" aria-hidden="true">' +
      '<path d="' + d + '" fill="' + fill + '"/>' + (line ? '<path d="' + d2 + '" fill="none" stroke="' + line + '" stroke-width="2"/><path d="' + d + '" fill="none" stroke="' + line + '" stroke-width="3"/>' : '') +
      '<circle cx="397" cy="66" r="9" fill="' + (line || fill) + '"/></svg>';
  }
  // Paisley corner
  function paisley(color, color2) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">' +
      '<path d="M20 120 C0 80 20 30 60 20 C100 10 120 40 104 62 C92 78 68 72 70 56 C72 44 88 46 86 56" fill="' + color + '" fill-opacity=".92"/>' +
      '<path d="M30 112 C16 82 30 44 62 34 C88 26 104 44 96 58" fill="none" stroke="' + color2 + '" stroke-width="3"/>' +
      '<circle cx="58" cy="60" r="7" fill="' + color2 + '"/>' + petalRing(58, 60, 0, 8, 12, 4, '#fff', .8) +
      '<path d="M8 140 Q60 128 140 8" fill="none" stroke="' + color + '" stroke-width="2"/></svg>';
  }

  // ---------- rendering ----------
  function rowsHtml(rows) {
    return rows.map(function (r) { return '<div class="bd-row"><span class="bd-k">' + esc(r[0]) + '</span><span class="bd-c">:</span><span class="bd-v">' + esc(r[1]) + '</span></div>'; }).join('');
  }
  function sectionHtml(s) {
    return '<section class="bd-sec bd-sec-' + s.key + '"><h3 class="bd-h"><span>' + esc(s.title) + '</span></h3>' + rowsHtml(s.rows) + '</section>';
  }
  function photoHtml(d, tpl) {
    if (!d.photo) return '';
    // Background image (not <img>) so photos crop correctly in the PDF/JPG export.
    return '<div class="bd-photo bd-photo-' + tpl.photo + '" style="background-image:url(&quot;' + esc(d.photo) + '&quot;)"></div>';
  }
  function topLine(d, p) {
    var icon = Icons ? Icons.html(d.deity || d.symbol, d.deityImg, p.icon || p.accent) : '';
    if (!icon && !d.invocation) return '';
    return '<div class="bd-top">' + icon + (d.invocation ? '<div class="bd-inv">' + esc(d.invocation) + '</div>' : '') + '</div>';
  }
  function aboutHtml(d) {
    var h = '';
    if (d.about) h += '<section class="bd-sec bd-about"><h3 class="bd-h"><span>About Me</span></h3><p>' + esc(d.about) + '</p></section>';
    if (d.expectations) h += '<section class="bd-sec bd-about"><h3 class="bd-h"><span>Partner Expectations</span></h3><p>' + esc(d.expectations) + '</p></section>';
    return h;
  }
  function tagline(d) {
    return [d.education, d.occupation].filter(Boolean).map(esc).join(' &middot; ');
  }

  // Page style and ornaments shared by biodata and invitation designs.
  // Ornaments are inline SVG (not CSS background images) so they also appear in the PDF/JPG export.
  function decorations(tpl, p) {
    var has = function (k) { return tpl.ornaments.indexOf(k) !== -1; };
    var outerBg = p.outerGrad || p.outer || p.bg;
    var style = 'background:' + outerBg + ';--bd-bg:' + p.bg + ';--bd-ink:' + p.ink + ';--bd-accent:' + p.accent + ';--bd-accent2:' + p.accent2 + ';--bd-soft:' + p.soft +
      ';--bd-side:' + p.side + ';--bd-side-ink:' + p.sideInk + ';--bd-head:' + FONTS[tpl.head] + ';--bd-body:' + FONTS[tpl.body] + ';--bd-name:' + FONTS[tpl.nameFont] + ';';
    var orn = '', under = '';
    if (has('mandala')) orn += '<div class="bd-mandala">' + mandala(520, p.accent2, 0.24) + '</div>';
    if (has('corners')) { var cs = corner(p.accent2); orn += ['tl', 'tr', 'bl', 'br'].map(function (k) { return '<div class="bd-corner bd-corner-' + k + '">' + cs + '</div>'; }).join(''); }
    if (has('border')) orn += '<div class="bd-border"></div>';
    var garl = has('garland') ? '<div class="bd-garland">' + garland(p.accent, p.accent2) + '</div>' : '';
    if (has('dots')) under += '<div class="bd-fill">' + pattern('dots', p.outer ? '#ffffff' : p.accent2, p.outer ? 0.28 : 0.45) + '</div>';
    if (has('dotsLight')) under += '<div class="bd-fill">' + pattern('dots', '#ffffff', 0.3) + '</div>';
    if (has('damask')) under += '<div class="bd-fill">' + pattern('damask', p.accent2, 0.35) + '</div>';
    if (has('vine')) orn += '<div class="bd-fill bd-over">' + vine(p.leaf || p.accent, p.bloom || p.accent2) + '</div>';
    if (has('foil')) orn += '<div class="bd-foil bd-foil-l1"></div><div class="bd-foil bd-foil-l2"></div><div class="bd-foil bd-foil-r1"></div><div class="bd-foil bd-foil-r2"></div>';
    if (has('foilframe')) orn += '<div class="bd-foil bd-ff-t"></div><div class="bd-foil bd-ff-b"></div><div class="bd-foil bd-ff-l"></div><div class="bd-foil bd-ff-r"></div>';
    if (has('rangoli')) { var rg = rangoli(p.accent2, p.third || p.accent, p.accent); under += '<div class="bd-fill bd-clip"><div class="bd-rangoli bd-rangoli-tl">' + rg + '</div><div class="bd-rangoli bd-rangoli-br">' + rg + '</div></div>'; }
    if (has('paisley')) { var pz = paisley(p.accent2, '#f6c453'); orn += ['tl', 'tr', 'bl', 'br'].map(function (k) { return '<div class="bd-paisley bd-corner-' + k + '">' + pz + '</div>'; }).join(''); }
    return { style: style, orn: under + orn, garl: garl, has: has };
  }

  function render(d, tplOrId, opts) {
    d = d || {};
    opts = opts || {};
    var tpl = typeof tplOrId === 'string' ? byId(tplOrId) : tplOrId;
    if (!tpl) tpl = TEMPLATES[0];
    var p = P[tpl.palette];
    var secs = sections(d);
    var name = esc(d.name || 'Your Name');
    var title = esc(d.title || 'BIODATA');
    var deco = decorations(tpl, p);
    var style = deco.style, orn = deco.orn, garl = deco.garl, has = deco.has;

    var body;
    var all = secs.map(sectionHtml).join('') + aboutHtml(d);
    if (tpl.layout === 'sidebar') {
      var sideSecs = secs.filter(function (s) { return s.key === 'contact'; });
      var mainSecs = secs.filter(function (s) { return s.key !== 'contact'; });
      var sm = tpl.ornaments.indexOf('sidemandala') !== -1 ? '<div class="bd-side-mandala">' + mandala(260, p.sideInk, 0.18) + '</div>' : '';
      body = '<div class="bd-side">' + sm + photoHtml(d, tpl) + '<div class="bd-name">' + name + '</div>' +
        (tagline(d) ? '<div class="bd-tag">' + tagline(d) + '</div>' : '') + sideSecs.map(sectionHtml).join('') + '</div>' +
        '<div class="bd-main">' + topLine(d, p) + '<div class="bd-title">' + title + '</div>' + mainSecs.map(sectionHtml).join('') + aboutHtml(d) + '</div>';
    } else if (tpl.layout === 'band') {
      body = '<div class="bd-band">' + garl + '<div class="bd-band-text">' + topLine(d, p) + '<div class="bd-title">' + title + '</div><div class="bd-name">' + name + '</div>' +
        (tagline(d) ? '<div class="bd-tag">' + tagline(d) + '</div>' : '') + '</div>' + photoHtml(d, tpl) + '</div>' +
        '<div class="bd-content bd-two">' + all + '</div>';
    } else if (tpl.layout === 'cards') {
      body = garl + topLine(d, p) + '<div class="bd-cardhead">' + photoHtml(d, tpl) + '<div><div class="bd-title">' + title + '</div><div class="bd-name">' + name + '</div>' +
        (tagline(d) ? '<div class="bd-tag">' + tagline(d) + '</div>' : '') + '</div></div><div class="bd-content bd-grid">' + all + '</div>';
    } else if (tpl.layout === 'frame') {
      body = '<div class="bd-content">' + topLine(d, p) + '<div class="bd-title">' + title + '</div><div class="bd-name">' + name + '</div>' +
        '<div class="bd-divider"></div>' +
        '<div class="bd-frame-top">' + (secs[0] ? sectionHtml(secs[0]) : '') + photoHtml(d, tpl) + '</div>' +
        secs.slice(1).map(sectionHtml).join('') + aboutHtml(d) + '</div>';
    } else if (tpl.layout === 'panel') {
      var shape = tpl.panel === 'arch'
        ? '<div class="bd-fill">' + archPanel(p.bg, has('archline') ? p.accent2 : '') + '</div>'
        : '';
      body = shape + '<div class="bd-panel bd-panel-' + tpl.panel + '">' + garl + '<div class="bd-content">' + topLine(d, p) + '<div class="bd-title">' + title + '</div>' + photoHtml(d, tpl) +
        '<div class="bd-name">' + name + '</div>' + (tagline(d) ? '<div class="bd-tag">' + tagline(d) + '</div>' : '') +
        '<div class="bd-divider"></div>' + all + '</div></div>';
    } else { // classic
      body = garl + '<div class="bd-content">' + topLine(d, p) + '<div class="bd-title">' + title + '</div>' + photoHtml(d, tpl) +
        '<div class="bd-name">' + name + '</div>' + (tagline(d) ? '<div class="bd-tag">' + tagline(d) + '</div>' : '') +
        '<div class="bd-divider"></div>' + all + '</div>';
    }

    var credit = tpl.tier === 'free' && !opts.noCredit ? '<div class="bd-credit">Made free at livelifetricks.com/biodata</div>' : '';
    var mark = opts.watermark ? '<div class="bd-watermark"><span>PREVIEW</span><span>PREVIEW</span><span>PREVIEW</span></div>' : '';
    return '<div class="bd bd-' + tpl.layout + (has('foil') ? ' bd-has-foil' : '') + (opts.thumb ? ' bd-thumb' : '') + '" style="' + style + '"><div class="bd-scale">' + orn + body + credit + '</div>' + mark + '</div>';
  }

  var SAMPLE = {
    deity: 'ganesha', invocation: '|| Shree Ganeshay Namah ||', title: 'BIODATA', name: 'Priya Sharma',
    dob: '1998-03-14', tob: '06:45', pob: 'Jaipur', height: "5' 4\"", religion: 'Hindu', caste: 'Brahmin', marital: 'Never married', diet: 'Vegetarian',
    rashi: 'Mithun', nakshatra: 'Ardra', gotra: 'Bharadwaj', manglik: 'No', languages: 'Hindi, English',
    education: 'MBA (Finance)', occupation: 'Senior Analyst', company: 'Infosys, Pune', income: '₹14 LPA',
    father: 'Rajesh Sharma', fatherOcc: 'Retired Bank Manager', mother: 'Sunita Sharma', motherOcc: 'Homemaker', siblings: '1 younger brother (studying)', familyType: 'Nuclear', native: 'Jaipur, Rajasthan',
    contactPerson: 'Rajesh Sharma (Father)', phone: '+91 98765 43210', address: 'Malviya Nagar, Jaipur',
    hobbies: 'Reading, classical dance, travel'
  };

  // ---------- Wedding invitations ----------
  var INVITES = [
    t('inv-classic-maroon', 'Classic Maroon', 'free', 'classic', 'maroon', { orn: ['border'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-simple-navy', 'Simple Navy', 'free', 'classic', 'navy', { orn: ['border'], head: 'playfair', nameFont: 'vibes' }),
    t('inv-sage-card', 'Sage Card', 'free', 'panel', 'sagePanel', { head: 'playfair', nameFont: 'vibes', panel: 'round' }),
    t('inv-blue-card', 'Blue Card', 'free', 'panel', 'bluePanel', { head: 'cormorant', nameFont: 'vibes', panel: 'round' }),
    t('inv-peach-dots', 'Peach Dots', 'free', 'classic', 'peach', { orn: ['dots'], head: 'playfair', nameFont: 'vibes' }),
    t('inv-lilac-card', 'Lilac Card', 'free', 'panel', 'lilac', { head: 'cormorant', nameFont: 'vibes', panel: 'round' }),
    t('inv-royal-maroon', 'Royal Maroon & Gold', 'premium', 'classic', 'maroon', { orn: ['border', 'corners', 'mandala'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-sage-foil', 'Sage & Gold Foil', 'premium', 'classic', 'sageFoil', { orn: ['foil'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-royal-blue-foil', 'Royal Blue Foil', 'premium', 'classic', 'blueFoil', { orn: ['foil'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-wine-frame', 'Wine & Gold Frame', 'premium', 'panel', 'wine', { orn: ['foilframe'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-palace-maroon', 'Palace Maroon', 'premium', 'panel', 'maroonArch', { orn: ['damask', 'archline'], head: 'cinzel', nameFont: 'vibes', panel: 'arch' }),
    t('inv-palace-emerald', 'Palace Emerald', 'premium', 'panel', 'emeraldArch', { orn: ['damask', 'archline'], head: 'cinzel', nameFont: 'vibes', panel: 'arch' }),
    t('inv-palace-blue', 'Palace Blue', 'premium', 'panel', 'blueArch', { orn: ['dots', 'archline'], head: 'marcellus', nameFont: 'vibes', panel: 'arch' }),
    t('inv-vine-ivory', 'Ivory Vines', 'premium', 'classic', 'ivoryVine', { orn: ['vine'], head: 'cormorant', nameFont: 'vibes' }),
    t('inv-vine-blush', 'Blush Vines', 'premium', 'classic', 'blushVine', { orn: ['vine'], head: 'cormorant', nameFont: 'vibes' }),
    t('inv-rangoli', 'Rangoli Turquoise', 'premium', 'panel', 'turquoise', { orn: ['rangoli'], head: 'marcellus', nameFont: 'vibes', panel: 'round' }),
    t('inv-plum-damask', 'Plum Damask', 'premium', 'panel', 'plum', { orn: ['damask', 'foilframe'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-magenta-gold', 'Magenta & Gold', 'premium', 'panel', 'magenta', { orn: ['foilframe', 'corners'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-sunset', 'Sunset Glow', 'premium', 'panel', 'sunset', { orn: ['dotsLight'], head: 'playfair', nameFont: 'vibes', panel: 'round' }),
    t('inv-midnight-gold', 'Midnight Gold', 'premium', 'classic', 'night', { orn: ['border', 'corners', 'mandala'], head: 'cinzel', nameFont: 'vibes' }),
    t('inv-marigold', 'Marigold', 'premium', 'classic', 'marigold', { orn: ['garland', 'border'], head: 'marcellus', nameFont: 'vibes' }),
    t('inv-paisley', 'Saffron Paisley', 'premium', 'panel', 'saffronPaisley', { orn: ['paisley'], head: 'marcellus', nameFont: 'vibes' })
  ];
  function inviteById(id) { for (var i = 0; i < INVITES.length; i++) if (INVITES[i].id === id) return INVITES[i]; return null; }
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function longDate(dt) {
    if (!dt) return '';
    var p = String(dt).split('-').map(Number);
    if (p.length !== 3 || !p[0]) return dt;
    var x = new Date(p[0], p[1] - 1, p[2]);
    return DAYS[x.getDay()] + ', ' + p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0];
  }
  function renderInvite(d, tplOrId, opts) {
    d = d || {};
    opts = opts || {};
    var tpl = typeof tplOrId === 'string' ? inviteById(tplOrId) : tplOrId;
    if (!tpl) tpl = INVITES[0];
    var p = P[tpl.palette], deco = decorations(tpl, p);
    var brideFirst = d.hostSide === 'bride';
    var first = brideFirst ? { n: d.bride || 'Bride', par: d.brideParents } : { n: d.groom || 'Groom', par: d.groomParents };
    var second = brideFirst ? { n: d.groom || 'Groom', par: d.groomParents } : { n: d.bride || 'Bride', par: d.brideParents };
    var events = (d.events || []).filter(function (e) { return e.name || e.date || e.venue; });
    var evHtml = events.map(function (e) {
      return '<div class="inv-ev">' + (e.name ? '<div class="inv-ev-name">' + esc(e.name) + '</div>' : '') +
        (e.date ? '<div class="inv-ev-date">' + esc(longDate(e.date)) + '</div>' : '') +
        (e.time ? '<div class="inv-ev-time">' + esc(e.time) + '</div>' : '') +
        (e.venue ? '<div class="inv-ev-venue">' + esc(e.venue) + '</div>' : '') + '</div>';
    }).join('');
    var content = topLine(d, p) +
      '<div class="bd-title">' + esc(d.title || 'WEDDING INVITATION') + '</div>' +
      (d.message ? '<p class="inv-msg">' + esc(d.message) + '</p>' : '') +
      (d.photo ? photoHtml(d, tpl) : '') +
      '<div class="inv-names"><div class="bd-name">' + esc(first.n) + '</div>' + (first.par ? '<div class="inv-par">' + esc(first.par) + '</div>' : '') +
      '<div class="inv-weds">' + esc(d.joiner || 'weds') + '</div>' +
      '<div class="bd-name">' + esc(second.n) + '</div>' + (second.par ? '<div class="inv-par">' + esc(second.par) + '</div>' : '') + '</div>' +
      '<div class="bd-divider"></div>' +
      (evHtml ? '<div class="inv-events' + (events.length > 2 ? ' inv-events-grid' : '') + '">' + evHtml + '</div>' : '') +
      (d.rsvp ? '<div class="inv-rsvp">' + esc(d.rsvp) + '</div>' : '') +
      (d.compliments ? '<div class="inv-compl">' + esc(d.compliments) + '</div>' : '');
    var body;
    if (tpl.layout === 'panel') {
      var shape = tpl.panel === 'arch' ? '<div class="bd-fill">' + archPanel(p.bg, deco.has('archline') ? p.accent2 : '') + '</div>' : '';
      body = shape + '<div class="bd-panel bd-panel-' + tpl.panel + '">' + deco.garl + '<div class="bd-content">' + content + '</div></div>';
    } else {
      body = deco.garl + '<div class="bd-content">' + content + '</div>';
    }
    var credit = tpl.tier === 'free' && !opts.noCredit ? '<div class="bd-credit">Made free at livelifetricks.com/wedding-invitation-maker</div>' : '';
    var mark = opts.watermark ? '<div class="bd-watermark"><span>PREVIEW</span><span>PREVIEW</span><span>PREVIEW</span></div>' : '';
    return '<div class="bd bd-invite bd-' + tpl.layout + (deco.has('foil') ? ' bd-has-foil' : '') + '" style="' + deco.style + '"><div class="bd-scale">' + deco.orn + body + credit + '</div>' + mark + '</div>';
  }
  var INVITE_SAMPLE = {
    deity: 'ganesha', invocation: '|| Shree Ganeshay Namah ||', title: 'WEDDING INVITATION',
    message: 'With the blessings of our elders, we joyfully invite you to celebrate the wedding of',
    hostSide: 'groom', groom: 'Rahul', groomParents: 'S/o Mrs. & Mr. Anil Mehta', bride: 'Priya', brideParents: 'D/o Mrs. & Mr. Rajesh Sharma', joiner: 'weds',
    events: [{ name: 'Haldi & Mehendi', date: '2027-02-12', time: '11:00 AM onwards', venue: 'Mehta Residence, Jaipur' },
      { name: 'Wedding', date: '2027-02-14', time: 'Baraat 7:00 PM · Pheras 10:30 PM', venue: 'Rambagh Gardens, Jaipur' },
      { name: 'Reception', date: '2027-02-15', time: '7:30 PM onwards', venue: 'Hotel Clarks Amer, Jaipur' }],
    rsvp: 'RSVP: Mehta family · +91 98765 43210', compliments: 'With best compliments from relatives & friends'
  };

  /*
   * Before exporting: the PDF/JPG library garbles right-to-left scripts (Arabic, Urdu, Hebrew),
   * so single-line RTL text is drawn by the browser's own canvas and swapped in as an image.
   */
  var RTL = /[\u0590-\u08FF\uFB1D-\uFEFC]/;
  function prepareExport(root) {
    if (typeof document === 'undefined') return Promise.resolve();
    var els = [].filter.call(root.querySelectorAll('.bd-inv, .bd-name, .bd-tag, .bd-v, .bd-title'), function (el) { return RTL.test(el.textContent); });
    if (!els.length) return Promise.resolve();
    var loads = els.map(function (el) { var cs = getComputedStyle(el); return document.fonts ? document.fonts.load(cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily, el.textContent) : null; });
    return Promise.all(loads).catch(function () {}).then(function () {
      els.forEach(function (el) {
        var cs = getComputedStyle(el), w = el.offsetWidth, h = el.offsetHeight, k = 3;
        if (!w || !h) return;
        var c = document.createElement('canvas');
        c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
        var ctx = c.getContext('2d');
        ctx.scale(k, k);
        ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
        ctx.fillStyle = cs.color;
        ctx.textBaseline = 'middle';
        ctx.direction = 'rtl';
        var align = cs.textAlign === 'center' ? 'center' : (cs.textAlign === 'left' || cs.textAlign === 'start' ? 'left' : 'right');
        ctx.textAlign = align;
        ctx.fillText(el.textContent.trim(), align === 'center' ? w / 2 : align === 'left' ? 0 : w, h / 2);
        el.innerHTML = '<img alt="" src="' + c.toDataURL('image/png') + '" style="display:block;width:' + w + 'px;height:' + h + 'px">';
      });
    });
  }

  var api = { TEMPLATES: TEMPLATES, PALETTES: P, byId: byId, render: render, sections: sections, SAMPLE: SAMPLE, Icons: Icons, prepareExport: prepareExport,
    INVITES: INVITES, inviteById: inviteById, renderInvite: renderInvite, INVITE_SAMPLE: INVITE_SAMPLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Biodata = api;
})(this);
