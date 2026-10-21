/* Passport/exam photo and signature resizer. Everything runs in the browser. Depends on common.js. */
(function () {
  'use strict';
  var L = window.LLT;
  var $ = function (id) { return document.getElementById(id); };
  if (!$('pm-canvas')) return;

  var PRESETS = [
    { id: 'in-passport', type: 'photo', name: 'Indian passport — 630 × 810 px (35 × 45 mm), up to 250 KB', w: 630, h: 810, min: 0, max: 250, mm: [35, 45], note: 'White background. Face about 70–80% of the photo height.' },
    { id: 'passport-print', type: 'photo', name: 'Passport size for forms & ID — 413 × 531 px (3.5 × 4.5 cm), 20–100 KB', w: 413, h: 531, min: 20, max: 100, mm: [35, 45] },
    { id: 'us-visa', type: 'photo', name: 'US visa — 600 × 600 px (2 × 2 inch), up to 240 KB', w: 600, h: 600, min: 0, max: 240, mm: [51, 51], note: 'White background, no glasses.' },
    { id: 'bank-photo', type: 'photo', name: 'IBPS / SBI bank exams — 200 × 230 px, 20–50 KB', w: 200, h: 230, min: 20, max: 50, mm: [35, 45] },
    { id: 'small-photo', type: 'photo', name: 'Common exam form — 100 × 120 px, 10–20 KB', w: 100, h: 120, min: 10, max: 20, mm: [35, 45] },
    { id: 'bank-sign', type: 'sign', name: 'Bank exams & SSC — 140 × 60 px, 10–20 KB', w: 140, h: 60, min: 10, max: 20 },
    { id: 'sign-large', type: 'sign', name: 'Signature 3.5 × 1.5 cm — 413 × 177 px, up to 50 KB', w: 413, h: 177, min: 0, max: 50 },
    { id: 'custom-photo', type: 'photo', name: 'Custom size…', custom: true, mm: [35, 45] },
    { id: 'custom-sign', type: 'sign', name: 'Custom size…', custom: true }
  ];
  var st = { type: 'photo', preset: null, img: null, zoom: 1, ox: 0, oy: 0, rot: 0, url: null, blob: null };
  var canvas = $('pm-canvas'), ctx = canvas.getContext('2d');

  function presetsFor(type) { return PRESETS.filter(function (p) { return p.type === type; }); }
  function fillPresets() {
    $('pm-preset').innerHTML = presetsFor(st.type).map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; }).join('');
    choosePreset($('pm-preset').value);
  }
  function choosePreset(id) {
    st.preset = PRESETS.filter(function (p) { return p.id === id; })[0];
    $('pm-custom').hidden = !st.preset.custom;
    if (st.preset.custom && st.type === 'sign' && $('pm-w').value === '200') { $('pm-w').value = 140; $('pm-h').value = 60; $('pm-min').value = 10; $('pm-max').value = 20; }
    $('pm-preset-note').textContent = st.preset.note || '';
    $('pm-clean-field').hidden = st.type !== 'sign';
    $('pm-bright-field').hidden = false;
    $('pm-sheet').hidden = st.type !== 'photo';
    sizeCanvas();
    redraw(true);
  }
  function target() {
    var p = st.preset;
    if (p.custom) return { w: Math.max(20, +$('pm-w').value || 200), h: Math.max(20, +$('pm-h').value || 200), min: Math.max(0, +$('pm-min').value || 0), max: Math.max(1, +$('pm-max').value || 50), mm: p.mm };
    return p;
  }
  function sizeCanvas() {
    var t = target(), W = Math.min(340, canvas.parentElement.clientWidth || 340);
    var H = Math.round(W * t.h / t.w);
    if (H > 440) { H = 440; W = Math.round(H * t.w / t.h); }
    canvas.width = W; canvas.height = H;
  }

  // Draw the photo into a W×H area using the current zoom, position and rotation.
  function paint(c, W, H) {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, W, H);
    if (!st.img) return;
    var iw = st.img.naturalWidth, ih = st.img.naturalHeight, rotated = st.rot % 180 !== 0;
    var rw = rotated ? ih : iw, rh = rotated ? iw : ih;
    var s = Math.max(W / rw, H / rh) * st.zoom;
    c.save();
    c.translate(W / 2 + st.ox * W, H / 2 + st.oy * H);
    c.rotate(st.rot * Math.PI / 180);
    c.scale(s, s);
    c.drawImage(st.img, -iw / 2, -ih / 2);
    c.restore();
  }
  function adjust(c, W, H) {
    var b = +$('pm-bright').value || 0, clean = st.type === 'sign' && $('pm-clean').checked;
    if (!b && !clean) return;
    var d = c.getImageData(0, 0, W, H), px = d.data;
    for (var i = 0; i < px.length; i += 4) {
      var r = px[i] + b * 2.55, g = px[i + 1] + b * 2.55, bl = px[i + 2] + b * 2.55;
      if (clean) {
        var lum = 0.299 * r + 0.587 * g + 0.114 * bl;
        if (lum > 165) { r = g = bl = 255; } else { var k = Math.max(0, lum - 40) / 125; r *= k * 0.6; g *= k * 0.6; bl = bl * k * 0.6 + 40 * (1 - k); }
      }
      px[i] = r; px[i + 1] = g; px[i + 2] = bl;
    }
    c.putImageData(d, 0, 0);
  }
  function redraw(regen) {
    var W = canvas.width, H = canvas.height;
    paint(ctx, W, H);
    adjust(ctx, W, H);
    if (st.img && st.type === 'photo') {
      // Face guide (preview only)
      ctx.save();
      ctx.strokeStyle = 'rgba(15,118,110,.85)'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(W / 2, H * 0.43, W * 0.27, H * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (regen) generate();
  }

  // JPEG at the exact size, within the KB limits.
  function toBlob(c, q) { return new Promise(function (res) { c.toBlob(res, 'image/jpeg', q); }); }
  // Pads a JPEG with a comment block so it reaches a minimum size (portals reject files that are too small).
  function padJpeg(blob, minBytes) {
    if (blob.size >= minBytes) return Promise.resolve(blob);
    return blob.arrayBuffer().then(function (buf) {
      var need = minBytes - blob.size, parts = [new Uint8Array(buf, 0, 2)];
      while (need > 0) {
        var n = Math.min(65533, Math.max(1, need - 4));
        var seg = new Uint8Array(n + 4);
        seg[0] = 0xFF; seg[1] = 0xFE; seg[2] = (n + 2) >> 8; seg[3] = (n + 2) & 255;
        for (var i = 4; i < seg.length; i++) seg[i] = 32;
        parts.push(seg);
        need -= seg.length;
      }
      parts.push(new Uint8Array(buf, 2));
      return new Blob(parts, { type: 'image/jpeg' });
    });
  }
  var genToken = 0;
  function generate() {
    if (!st.img) return;
    var t = target(), my = ++genToken;
    var out = document.createElement('canvas');
    out.width = t.w; out.height = t.h;
    var c = out.getContext('2d');
    paint(c, t.w, t.h);
    adjust(c, t.w, t.h);
    var maxB = t.max * 1024, minB = t.min * 1024;
    var lo = 0.05, hi = 0.95, best = null;
    var step = function (i) {
      if (i >= 8) return Promise.resolve(best);
      var q = (lo + hi) / 2;
      return toBlob(out, q).then(function (b) {
        if (b.size <= maxB) { best = b; lo = q; } else hi = q;
        return step(i + 1);
      });
    };
    toBlob(out, 0.95).then(function (b) {
      if (b.size <= maxB) return b;
      return step(0).then(function (b2) { return b2 || toBlob(out, 0.05); });
    }).then(function (b) { return padJpeg(b, minB); }).then(function (b) {
      if (my !== genToken) return;
      st.blob = b;
      if (st.url) URL.revokeObjectURL(st.url);
      st.url = URL.createObjectURL(b);
      $('pm-out').src = st.url;
      var kb = b.size / 1024, ok = b.size <= maxB && b.size >= minB;
      $('pm-info').innerHTML = '<tr><th>Size</th><td>' + t.w + ' × ' + t.h + ' px</td></tr><tr><th>File size</th><td>' + kb.toFixed(1) + ' KB</td></tr>' +
        '<tr><th>Allowed</th><td>' + (t.min ? t.min + '–' : 'up to ') + t.max + ' KB</td></tr><tr class="total"><th>Status</th><td>' + (ok ? '✓ Within limits' : '✗ Outside limits') + '</td></tr>';
      var w = $('pm-warn');
      w.hidden = ok;
      w.textContent = b.size > maxB ? 'The file is still above the limit even at the lowest quality. Try a simpler photo or larger KB limit.' : '';
      $('pm-dl').disabled = false;
      $('pm-sheet').disabled = false;
    });
  }

  // ---------- interaction ----------
  $('pm-type').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    st.type = b.dataset.value;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    fillPresets();
  });
  $('pm-preset').addEventListener('change', function () { choosePreset(this.value); });
  ['pm-w', 'pm-h', 'pm-min', 'pm-max'].forEach(function (id) { $(id).addEventListener('input', L.debounce(function () { sizeCanvas(); redraw(true); }, 300)); });
  $('pm-file').addEventListener('change', function () {
    var f = this.files[0];
    if (!f) return;
    var img = new Image();
    img.onload = function () { st.img = img; st.zoom = 1; st.ox = st.oy = 0; st.rot = 0; $('pm-zoom').value = 1; $('pm-editor').hidden = false; sizeCanvas(); redraw(true); };
    img.onerror = function () { alert('Sorry, that image could not be opened. Please try a JPG or PNG.'); };
    img.src = URL.createObjectURL(f);
  });
  $('pm-zoom').addEventListener('input', function () { st.zoom = +this.value; redraw(false); });
  $('pm-zoom').addEventListener('change', function () { redraw(true); });
  $('pm-bright').addEventListener('change', function () { redraw(true); });
  $('pm-bright').addEventListener('input', function () { redraw(false); });
  $('pm-clean').addEventListener('change', function () { redraw(true); });
  $('pm-rotate').addEventListener('click', function () { st.rot = (st.rot + 90) % 360; redraw(true); });
  $('pm-center').addEventListener('click', function () { st.ox = st.oy = 0; redraw(true); });
  var drag = null;
  canvas.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, ox: st.ox, oy: st.oy }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var r = canvas.getBoundingClientRect();
    st.ox = drag.ox + (e.clientX - drag.x) / r.width;
    st.oy = drag.oy + (e.clientY - drag.y) / r.height;
    redraw(false);
  });
  canvas.addEventListener('pointerup', function () { if (drag) { drag = null; redraw(true); } });
  canvas.addEventListener('wheel', function (e) {
    if (!st.img) return;
    e.preventDefault();
    st.zoom = Math.min(4, Math.max(1, st.zoom * (e.deltaY < 0 ? 1.05 : 0.95)));
    $('pm-zoom').value = st.zoom;
    redraw(false);
    clearTimeout(st.wt); st.wt = setTimeout(function () { redraw(true); }, 250);
  }, { passive: false });

  function download(blobOrUrl, name) {
    var a = document.createElement('a');
    a.href = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  $('pm-dl').addEventListener('click', function () {
    if (st.blob) { var t = target(); download(st.blob, (st.type === 'sign' ? 'signature-' : 'photo-') + t.w + 'x' + t.h + '.jpg'); }
  });
  // 4×6 inch sheet at 300 dpi (landscape), 8 photos with cut lines.
  $('pm-sheet').addEventListener('click', function () {
    if (!st.img) return;
    var mm = target().mm || [35, 45], dpm = 300 / 25.4;
    var pw = Math.round(mm[0] * dpm), ph = Math.round(mm[1] * dpm);
    var W = 1800, H = 1200, gap = 30;
    var cols = Math.max(1, Math.floor((W - gap) / (pw + gap))), rows = Math.max(1, Math.floor((H - gap) / (ph + gap)));
    var sheet = document.createElement('canvas');
    sheet.width = W; sheet.height = H;
    var c = sheet.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    var one = document.createElement('canvas');
    one.width = pw; one.height = ph;
    var oc = one.getContext('2d');
    paint(oc, pw, ph); adjust(oc, pw, ph);
    var x0 = Math.round((W - cols * pw - (cols - 1) * gap) / 2), y0 = Math.round((H - rows * ph - (rows - 1) * gap) / 2);
    c.strokeStyle = '#bbb'; c.lineWidth = 1;
    for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++) {
      var x = x0 + k * (pw + gap), y = y0 + r * (ph + gap);
      c.drawImage(one, x, y);
      c.strokeRect(x - 0.5, y - 0.5, pw + 1, ph + 1);
    }
    sheet.toBlob(function (b) { download(b, 'passport-photos-4x6.jpg'); }, 'image/jpeg', 0.95);
  });

  fillPresets();
})();
