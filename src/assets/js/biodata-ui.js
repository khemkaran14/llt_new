/* Biodata and wedding invitation maker pages. Depends on common.js and biodata-templates.js.
   A page can set window.LLT_MAKER to switch product (see the invitation page). */
(function () {
  'use strict';
  var L = window.LLT, B = window.Biodata, I = window.BiodataIcons;
  if (!B || !document.getElementById('bd-gallery')) return;

  var $ = function (id) { return document.getElementById(id); };
  var M = Object.assign({
    product: 'biodata', noun: 'biodata', list: 'TEMPLATES', byId: 'byId', render: 'render', sample: 'SAMPLE',
    price: 20, nameId: 'b-name', nameHint: 'Please enter your full name first.', defaultTitle: 'BIODATA', filePrefix: 'biodata',
    fileName: function (d) { return d.name; }, pdfFormat: 'a4', storeKey: 'bd'
  }, window.LLT_MAKER || {});
  // Settings name parts of window.Biodata (e.g. 'INVITES', 'renderInvite').
  M.list = B[M.list]; M.byId = B[M.byId]; M.render = B[M.render]; M.sample = B[M.sample];
  var RS = function () { return '₹' + M.price; };
  var form = $('bd-form');
  var API = '/api/biodata';
  var PAGE_W = 794, PAGE_H = 1123;
  var state = { tplId: null, filter: 'all', photo: null, order: null, config: null };

  // ---------- storage ----------
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('llt:' + M.storeKey + ':' + k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('llt:' + M.storeKey + ':' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem('llt:' + M.storeKey + ':' + k); } catch (e) { /* ignore */ } }
  };

  // ---------- rendering ----------
  function overflowing(el) {
    if (el.scrollHeight > PAGE_H + 1) return true;
    var panel = el.querySelector('.bd-panel');
    return !!(panel && panel.scrollHeight > panel.clientHeight + 1);
  }
  function fit(el) {
    var fs = 1;
    el.style.setProperty('--bd-fs', fs);
    while (overflowing(el) && fs > 0.62) {
      fs = Math.round((fs - 0.02) * 100) / 100;
      el.style.setProperty('--bd-fs', fs);
    }
    return fs;
  }
  function scaleInto(box) {
    var bd = box.querySelector('.bd');
    if (bd) bd.style.transform = 'scale(' + (box.clientWidth / PAGE_W) + ')';
  }
  var resize = window.ResizeObserver ? new ResizeObserver(function (entries) { entries.forEach(function (e) { scaleInto(e.target); }); }) : null;

  // ---------- gallery ----------
  function gallery() {
    var g = $('bd-gallery');
    g.innerHTML = '';
    M.list.forEach(function (tpl) {
      if (state.filter !== 'all' && tpl.tier !== state.filter) return;
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'bd-card';
      card.setAttribute('aria-pressed', tpl.id === state.tplId ? 'true' : 'false');
      card.innerHTML = '<div class="bd-thumbbox">' + M.render(M.sample, tpl, { thumb: true }) + '</div>' +
        '<div class="bd-card-meta"><span>' + tpl.name + '</span><span class="bd-pill' + (tpl.tier === 'premium' ? ' paid' : '') + '">' + (tpl.tier === 'premium' ? RS() : 'FREE') + '</span></div>';
      card.addEventListener('click', function () { choose(tpl.id); });
      g.appendChild(card);
      var box = card.querySelector('.bd-thumbbox');
      fit(box.querySelector('.bd'));
      scaleInto(box);
      if (resize) resize.observe(box);
    });
  }
  $('bd-filter').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    state.filter = b.dataset.value;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    gallery();
  });

  function choose(id) {
    if (state.order && state.order.locked && state.order.tplId !== id) {
      if (!confirm('Your paid ' + M.noun + ' is final. Switching design starts a new ' + M.noun + '. Continue?')) return;
      state.order = null; store.del('order');
    }
    state.tplId = id;
    store.set('tpl', id);
    $('step-editor').hidden = false;
    gallery();
    preview();
    $('step-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('pv-change').addEventListener('click', function () { $('step-designs').scrollIntoView({ behavior: 'smooth' }); });

  // ---------- god icons ----------
  (function () {
    var sel = $('b-deity'), groups = {};
    Object.keys(I.ICONS).forEach(function (id) {
      var ic = I.ICONS[id];
      (groups[ic.group] = groups[ic.group] || []).push('<option value="' + id + '">' + (ic.glyph ? ic.glyph + ' ' : '') + ic.label + '</option>');
    });
    Object.keys(groups).forEach(function (g) { sel.insertAdjacentHTML('beforeend', '<optgroup label="' + g + '">' + groups[g].join('') + '</optgroup>'); });
    $('b-inv-list').innerHTML = I.INVOCATIONS.map(function (t) { return '<option value="' + t.replace(/"/g, '&quot;') + '">'; }).join('');
  })();
  state.deityImg = null;
  $('b-deity-img').addEventListener('change', function () {
    readImage(this.files[0], 400, function (url) {
      state.deityImg = url; store.set('deityImg', url); $('b-deity-img-remove').hidden = false; changed();
    });
  });
  $('b-deity-img-remove').addEventListener('click', function () {
    state.deityImg = null; store.del('deityImg'); $('b-deity-img').value = ''; this.hidden = true; changed();
  });
  // Shrink an uploaded image so it stays light and can be saved on the device.
  function readImage(file, max, done) {
    if (!file) return;
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var s = Math.min(1, max / Math.max(img.width, img.height));
      var c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      done(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function () { alert('Sorry, that image could not be opened. Please try a JPG or PNG.'); };
    img.src = url;
  }

  // ---------- form data ----------
  function readData() {
    var d = {};
    form.querySelectorAll('[data-key]').forEach(function (el) { d[el.dataset.key] = el.value.trim(); });
    if ($('b-custom')) d.custom = [].map.call($('b-custom').querySelectorAll('.bd-custom-row'), function (row) {
      return { label: row.querySelector('[data-c="label"]').value.trim(), value: row.querySelector('[data-c="value"]').value.trim() };
    }).filter(function (c) { return c.label && c.value; });
    if ($('b-events')) d.events = [].map.call($('b-events').querySelectorAll('.bd-event-row'), function (row) {
      var o = {};
      row.querySelectorAll('[data-e]').forEach(function (el) { o[el.dataset.e] = el.value.trim(); });
      return o;
    }).filter(function (e) { return e.name || e.date || e.venue; });
    if (state.photo) d.photo = state.photo;
    if (state.deityImg) d.deityImg = state.deityImg;
    return d;
  }
  function writeData(d) {
    if (!d) return;
    if (!d.deity && d.symbol) d.deity = d.symbol; // older saved drafts
    form.querySelectorAll('[data-key]').forEach(function (el) { if (d[el.dataset.key] != null) el.value = d[el.dataset.key]; });
    if ($('b-custom')) { $('b-custom').innerHTML = ''; (d.custom || []).forEach(addCustom); }
    if ($('b-events')) { $('b-events').innerHTML = ''; (d.events || []).forEach(addEvent); }
  }
  // Wedding functions (invitation maker)
  function addEvent(ev) {
    ev = ev || {};
    var row = document.createElement('div');
    row.className = 'bd-event-row';
    row.innerHTML = '<div class="row2"><div class="field"><label>Function</label><input type="text" data-e="name" maxlength="40" placeholder="e.g. Wedding, Haldi, Reception"></div>' +
      '<div class="field"><label>Date</label><input type="date" data-e="date"></div>' +
      '<div class="field"><label>Time</label><input type="text" data-e="time" maxlength="30" placeholder="e.g. 7:00 PM onwards"></div>' +
      '<div class="field"><label>Venue</label><input type="text" data-e="venue" maxlength="120" placeholder="Hall name, area, city"></div></div>' +
      '<button type="button" class="btn">Remove this function</button>';
    row.querySelectorAll('[data-e]').forEach(function (el) { if (ev[el.dataset.e]) el.value = ev[el.dataset.e]; });
    row.querySelector('button').addEventListener('click', function () { row.remove(); changed(); });
    $('b-events').appendChild(row);
  }
  if ($('b-events-add')) $('b-events-add').addEventListener('click', function () { addEvent(); changed(); });
  function addCustom(c) {
    c = c || {};
    var row = document.createElement('div');
    row.className = 'bd-custom-row';
    row.innerHTML = '<input type="text" data-c="label" maxlength="30" placeholder="Label, e.g. Blood group"><input type="text" data-c="value" maxlength="80" placeholder="Value"><button type="button" class="btn" aria-label="Remove field">✕</button>';
    row.querySelector('[data-c="label"]').value = c.label || '';
    row.querySelector('[data-c="value"]').value = c.value || '';
    row.querySelector('button').addEventListener('click', function () { row.remove(); changed(); });
    $('b-custom').appendChild(row);
  }
  if ($('b-custom-add')) $('b-custom-add').addEventListener('click', function () { addCustom(); });

  // Photo: shrink to max 700 px so it stays light and saves on the device.
  $('b-photo').addEventListener('change', function () {
    readImage(this.files[0], 700, function (url) {
      state.photo = url; store.set('photo', url); $('b-photo-remove').hidden = false; changed();
    });
  });
  $('b-photo-remove').addEventListener('click', function () {
    state.photo = null; store.del('photo'); $('b-photo').value = ''; this.hidden = true; changed();
  });

  $('b-clear').addEventListener('click', function () {
    if (!confirm('Clear all the details you entered?')) return;
    form.querySelectorAll('[data-key]').forEach(function (el) { el.value = el.tagName === 'SELECT' ? '' : ''; });
    $('b-title').value = M.defaultTitle;
    if ($('b-custom')) $('b-custom').innerHTML = '';
    if ($('b-events')) $('b-events').innerHTML = '';
    state.photo = null; store.del('photo'); $('b-photo-remove').hidden = true;
    state.deityImg = null; store.del('deityImg'); $('b-deity-img-remove').hidden = true;
    changed();
  });

  // ---------- preview ----------
  function tpl() { return M.byId(state.tplId) || M.list[0]; }
  function isPaid() { return state.order && state.order.tplId === state.tplId && state.order.token && state.order.tier === 'premium'; }

  function preview() {
    var t = tpl(), d = readData();
    var box = $('bd-preview');
    box.innerHTML = M.render(d, t, { watermark: t.tier === 'premium' && !isPaid() });
    fit(box.querySelector('.bd'));
    scaleInto(box);
    if (resize) resize.observe(box);
    $('pv-name').textContent = t.name;
    var pill = $('pv-pill');
    pill.textContent = t.tier === 'premium' ? (isPaid() ? 'PAID' : RS()) : 'FREE';
    pill.className = 'bd-pill' + (t.tier === 'premium' && !isPaid() ? ' paid' : '');
    $('pv-note').textContent = t.tier === 'premium'
      ? (isPaid() ? 'Paid. Download your PDF and JPG. Downloads stay available for 48 hours.' : 'Premium design: pay ' + RS() + ' to download without the watermark, as PDF and JPG.')
      : 'Free design: enter your email to download as PDF and JPG.';
    document.querySelectorAll('[data-dl]').forEach(function (b) {
      b.textContent = (t.tier === 'premium' && !isPaid() ? 'Pay ' + RS() + ' & download ' : 'Download ') + b.dataset.dl.toUpperCase();
    });
    lockUi();
  }

  function lockUi() {
    var locked = !!(isPaid() && state.order.locked);
    form.querySelectorAll('input, select, textarea, button').forEach(function (el) { el.disabled = locked; });
    var banner = $('bd-locked');
    banner.hidden = !locked;
    if (locked) {
      banner.innerHTML = '<strong>Your paid ' + M.noun + ' is final.</strong> To change any detail, start a new edit for ' + RS() + '. ' +
        '<button type="button" class="btn" id="bd-newedit" style="margin-top:8px">Start a new edit (' + RS() + ')</button>';
      $('bd-newedit').disabled = false;
      $('bd-newedit').addEventListener('click', function () {
        if (!confirm('Start a new edit? You\'ll need to pay ' + RS() + ' again to download the changed ' + M.noun + '.')) return;
        state.order = null; store.del('order'); preview();
      });
    }
  }

  var saveTimer;
  function changed() {
    preview();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { var d = readData(); delete d.photo; delete d.deityImg; store.set('data', d); }, 300);
  }
  form.addEventListener('input', L.debounce(changed, 120));
  form.addEventListener('change', changed);

  // ---------- server ----------
  function api(path, body) {
    return fetch(API + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Server error (' + r.status + ')'); e.code = j.code; throw e; } return j; }); },
        function () { throw new Error('Could not reach the server. Check your internet connection and try again.'); });
  }
  function sha256(text) {
    var bytes = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function fingerprint() { return sha256(JSON.stringify({ t: state.tplId, d: readData() })); }
  function status(msg, err) { var s = $('pv-status'); s.textContent = msg || ''; s.className = 'bd-status' + (err ? ' err' : ''); }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  // Ask for email once per biodata (free) or per payment (premium).
  function askEmail() {
    return new Promise(function (resolve) {
      var m = $('bd-modal');
      var t = tpl();
      $('m-text').textContent = t.tier === 'premium' ? 'Enter your email, then pay ' + RS() + ' securely with UPI, card or net banking.' : 'Enter your email to download your ' + M.noun + ' for free.';
      $('m-submit').textContent = t.tier === 'premium' ? 'Continue to pay ' + RS() : 'Continue';
      $('m-email').value = store.get('email') || ($('b-email') ? $('b-email').value : '') || '';
      $('m-status').textContent = '';
      m.hidden = false;
      $('m-email').focus();
      function done(v) { m.hidden = true; $('m-form').removeEventListener('submit', submit); $('m-cancel').removeEventListener('click', cancel); resolve(v); }
      function submit(e) { e.preventDefault(); store.set('email', $('m-email').value.trim()); done({ email: $('m-email').value.trim(), consent: $('m-consent').checked }); }
      function cancel() { done(null); }
      $('m-form').addEventListener('submit', submit);
      $('m-cancel').addEventListener('click', cancel);
    });
  }

  function pay(start, who) {
    if (start.dev) {
      return new Promise(function (resolve, reject) {
        if (!confirm('TEST MODE: payments aren\'t set up yet. Simulate a successful ' + RS() + ' payment?')) return reject(new Error('Payment cancelled.'));
        api('/verify', { orderId: start.orderId, dev: true }).then(resolve, reject);
      });
    }
    return loadScript('https://checkout.razorpay.com/v1/checkout.js').then(function () {
      return new Promise(function (resolve, reject) {
        var rz = new window.Razorpay({
          key: start.keyId, amount: start.amount, currency: 'INR', order_id: start.razorpayOrderId,
          name: 'LiveLifeTricks', description: (M.product === 'invite' ? 'Invitation design: ' : 'Biodata design: ') + tpl().name,
          prefill: { email: who.email, name: $(M.nameId).value },
          theme: { color: '#0f766e' },
          handler: function (resp) {
            api('/verify', { orderId: start.orderId, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature }).then(resolve, reject);
          },
          modal: { ondismiss: function () { reject(new Error('Payment cancelled.')); } }
        });
        rz.on('payment.failed', function (r) { reject(new Error('Payment failed: ' + (r.error && r.error.description || 'please try again.'))); });
        rz.open();
      });
    });
  }

  // Make sure we have a valid order for the current design, paying if needed.
  function ensureOrder() {
    var t = tpl();
    var o = state.order;
    if (o && o.tplId === t.id && o.token) return Promise.resolve(o);
    return askEmail().then(function (who) {
      if (!who) throw new Error('');
      status(t.tier === 'premium' ? 'Opening secure payment…' : 'Preparing your download…');
      return fingerprint().then(function (hash) {
        return api('/start', { product: M.product, email: who.email, name: $(M.nameId).value, templateId: t.id, dataHash: hash, consent: who.consent }).then(function (start) {
          if (start.free) return { orderId: start.orderId, token: start.token, tplId: t.id, tier: 'free' };
          return pay(start, who).then(function (v) { return { orderId: start.orderId, token: v.token, tplId: t.id, tier: 'premium', hash: hash, locked: true }; });
        });
      });
    }).then(function (order) {
      state.order = order;
      store.set('order', order);
      preview();
      return order;
    });
  }

  // Render the final page off-screen at full size and export it.
  function exportFile(kind) {
    var t = tpl(), d = readData();
    var holder = $('bd-render');
    holder.innerHTML = M.render(d, t, {});
    var el = holder.querySelector('.bd');
    fit(el);
    var fileName = M.filePrefix + '-' + (M.fileName(d) || 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.' + kind;
    return Promise.all([loadScript('/assets/js/vendor/html2canvas.min.js'), kind === 'pdf' ? loadScript('/assets/js/vendor/jspdf.umd.min.js') : null, document.fonts ? document.fonts.ready : null])
      .then(function () { return B.prepareExport(el); })
      .then(function () { return window.html2canvas(el, { scale: 2, backgroundColor: null, logging: false, useCORS: true }); })
      .then(function (canvas) {
        var jpg = canvas.toDataURL('image/jpeg', 0.92);
        if (kind === 'jpg') { saveUrl(jpg, fileName); }
        else {
          var size = M.pdfFormat === 'a5' ? [148, 210] : [210, 297];
          var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: M.pdfFormat, orientation: 'portrait', compress: true });
          pdf.addImage(jpg, 'JPEG', 0, 0, size[0], size[1]);
          pdf.save(fileName);
        }
        holder.innerHTML = '';
      });
  }
  function saveUrl(url, name) {
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  var busy = false;
  document.querySelectorAll('[data-dl]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (busy) return;
      if (!$(M.nameId).value.trim()) { status(M.nameHint, true); $(M.nameId).focus(); return; }
      busy = true;
      var kind = btn.dataset.dl;
      ensureOrder()
        .then(function (order) {
          status('Creating your ' + kind.toUpperCase() + '…');
          return fingerprint().then(function (hash) { return api('/download', { orderId: order.orderId, token: order.token, kind: kind, dataHash: hash }); });
        })
        .then(function () { return exportFile(kind); })
        .then(function () { status('Downloaded ✓ Check your downloads folder.'); })
        .catch(function (e) {
          if (e.code === 'expired' || e.code === 'changed' || e.code === 'limit') { state.order = null; store.del('order'); preview(); }
          status(e.message, !!e.message);
        })
        .then(function () { busy = false; });
    });
  });

  // ---------- start ----------
  writeData(store.get('data'));
  state.photo = store.get('photo');
  $('b-photo-remove').hidden = !state.photo;
  state.deityImg = store.get('deityImg');
  $('b-deity-img-remove').hidden = !state.deityImg;
  state.order = store.get('order');
  var q = new URLSearchParams(location.search).get('design');
  var startTpl = M.byId(q) ? q : store.get('tpl');
  if (!store.get('data') && M.defaults) writeData(M.defaults);
  gallery();
  if (M.byId(startTpl)) { state.tplId = startTpl; $('step-editor').hidden = false; gallery(); preview(); }
  api('/config').then(function (c) {
    state.config = c;
    var p = c.prices && c.prices[M.product];
    if (p && p !== M.price) { M.price = p; gallery(); if (state.tplId) preview(); }
  }, function () { /* offline: downloads will show the error */ });
})();
