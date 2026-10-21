/* Kundli Milan page. Depends on common.js and kundli.js. */
(function () {
  'use strict';
  var L = window.LLT, K = window.Kundli;
  var form = document.getElementById('kd-form');
  if (!form || !K) return;
  var $ = function (id) { return document.getElementById(id); };
  var PADA = ['', '1st', '2nd', '3rd', '4th'];

  function person(p, v) {
    var mode = v[p + 'Mode'] || 'birth';
    form.querySelector('.kd-birth[data-for="' + p + '"]').hidden = mode !== 'birth';
    form.querySelector('.kd-nak[data-for="' + p + '"]').hidden = mode === 'birth';
    var r;
    if (mode === 'birth') {
      if (!v[p + 'Date']) return null;
      r = K.moonSign({ date: v[p + 'Date'], time: v[p + 'Time'] || '12:00', tz: Number(v[p + 'Tz'] || 5.5) });
    } else {
      r = K.fromNakshatra(Number(v[p + 'Nak'] || 0), Number(v[p + 'Pada'] || 1));
    }
    $(p + '-sign').innerHTML = 'Moon sign: <strong>' + K.RASHI[r.rashi] + '</strong> · Nakshatra: <strong>' + K.NAK[r.nakshatra] + '</strong>, ' + PADA[r.pada] + ' pada' +
      (mode === 'birth' && !v[p + 'Time'] ? '<br><span class="muted">No birth time entered: using 12:00 noon.</span>' : '') +
      (r.nearBoundary ? '<br><span class="kd-warn">Close to a nakshatra boundary: double-check the birth time, or choose "Nakshatra".</span>' : '');
    return r;
  }

  L.calc(form, function (v) {
    var boy = person('boy', v), girl = person('girl', v);
    L.set('kd-h-boy', v.boyName || 'Boy');
    L.set('kd-h-girl', v.girlName || 'Girl');
    if (!boy || !girl) { L.set('kd-total', '–'); L.set('kd-verdict', 'Enter both birth dates'); return; }
    var m = K.match(boy, girl);
    L.set('kd-total', String(m.total).replace('.5', '½'));
    $('kd-arc').setAttribute('stroke-dasharray', (m.total / 36 * 100).toFixed(2) + ' ' + (100 - m.total / 36 * 100).toFixed(2));
    $('kd-arc').setAttribute('stroke', m.total >= 25 ? 'var(--good)' : m.total >= 18 ? 'var(--brand)' : 'var(--accent)');
    L.set('kd-verdict', m.verdict);
    L.set('kd-summary', (v.boyName || 'Boy') + ' and ' + (v.girlName || 'Girl') + ' match ' + m.total + ' out of 36 gunas.');
    var d = $('kd-dosha');
    d.hidden = !m.doshas.length;
    d.innerHTML = m.doshas.length ? '<strong>' + m.doshas.join(' and ') + '</strong> found. Traditionally there are exceptions that can cancel a dosha; many families consult an astrologer before deciding.' : '';
    $('kd-table').querySelector('tbody').innerHTML = m.kootas.map(function (k) {
      var full = k.score === k.max, none = k.score === 0;
      return '<tr><td><strong>' + k.name + '</strong></td><td>' + k.boy + '</td><td>' + k.girl + '</td><td class="' + (full ? 'kd-good' : none ? 'kd-bad' : '') + '">' +
        String(k.score).replace('.5', '½') + ' / ' + k.max + '</td><td>' + k.about + '</td></tr>';
    }).join('') + '<tr><td colspan="3"><strong>Total</strong></td><td><strong>' + String(m.total).replace('.5', '½') + ' / 36</strong></td><td>' + m.verdict + '</td></tr>';
  }, 'kundli');
})();
