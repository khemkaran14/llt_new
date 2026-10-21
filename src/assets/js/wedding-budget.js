/* Wedding budget planner. Depends on common.js. Data is saved on this device. */
(function () {
  'use strict';
  var L = window.LLT;
  var $ = function (id) { return document.getElementById(id); };
  if (!$('wb-table')) return;
  var DEFAULTS = [
    ['Venue', 18], ['Catering (food & drinks)', 25], ['Decoration & flowers', 8], ['Photography & video', 7],
    ['Bride\'s outfits & jewellery', 14], ['Groom\'s outfits', 4], ['Makeup & mehendi artists', 3],
    ['Haldi, mehendi & sangeet', 5], ['Invitations & return gifts', 4], ['Music / DJ / band', 2],
    ['Travel & guest stay', 4], ['Pandit / ceremony', 1], ['Buffer (unexpected costs)', 5]
  ];
  var rows = L.store.get('wedding-budget');
  var total = $('wb-total'), guests = $('wb-guests');
  L.formatMoneyInput(total);
  var meta = L.store.get('wedding-budget-meta');
  if (meta) { total.value = L.num(meta.total); guests.value = meta.guests; }
  if (!rows) reset();

  function reset() { rows = DEFAULTS.map(function (d) { return { name: d[0], pct: d[1], actual: 0, paid: 0 }; }); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function render() {
    var T = L.read(total);
    var body = rows.map(function (r, i) {
      var planned = T * r.pct / 100;
      return '<tr data-i="' + i + '"><td><input class="wb-in" data-f="name" value="' + esc(r.name) + '" aria-label="Category"></td>' +
        '<td><input class="wb-in wb-num" data-f="pct" type="number" step="0.5" min="0" value="' + r.pct + '" aria-label="Share %">%</td>' +
        '<td><input class="wb-in wb-num" data-f="planned" type="number" step="1000" min="0" value="' + Math.round(planned) + '" aria-label="Planned"></td>' +
        '<td><input class="wb-in wb-num" data-f="actual" type="number" step="1000" min="0" value="' + (r.actual || '') + '" placeholder="0" aria-label="Actual cost"></td>' +
        '<td><input class="wb-in wb-num" data-f="paid" type="number" step="1000" min="0" value="' + (r.paid || '') + '" placeholder="0" aria-label="Paid"></td>' +
        '<td class="' + ((r.actual || 0) > planned + 0.5 ? 'wb-over' : '') + '">' + L.money(Math.max(0, (r.actual || 0) - (r.paid || 0))) + '</td>' +
        '<td><button type="button" class="btn wb-del" aria-label="Remove category">✕</button></td></tr>';
    }).join('');
    $('wb-table').querySelector('tbody').innerHTML = body;
    summary();
  }
  function summary() {
    var T = L.read(total), pct = 0, spent = 0, paid = 0;
    rows.forEach(function (r) { pct += Number(r.pct) || 0; spent += Number(r.actual) || 0; paid += Number(r.paid) || 0; });
    L.set('wb-planned', L.short(T * pct / 100));
    L.set('wb-spent', L.short(spent));
    L.set('wb-paid', L.short(paid));
    L.set('wb-due', L.short(Math.max(0, spent - paid)));
    var g = Number(guests.value) || 0;
    L.set('wb-perguest', g ? L.money(Math.max(spent, T) / g) : '–');
    $('wb-table').querySelector('tfoot').innerHTML = '<tr><th>Total</th><th>' + Math.round(pct * 10) / 10 + '%</th><th>' + L.money(T * pct / 100) + '</th><th>' + L.money(spent) + '</th><th>' + L.money(paid) + '</th><th>' + L.money(Math.max(0, spent - paid)) + '</th><th></th></tr>';
    var w = $('wb-warn'), msgs = [];
    if (Math.abs(pct - 100) > 0.05) msgs.push('Your shares add up to ' + Math.round(pct * 10) / 10 + '%, not 100%.');
    if (spent > T && T > 0) msgs.push('You\'ve spent ' + L.money(spent - T) + ' more than your total budget.');
    w.hidden = !msgs.length;
    w.textContent = msgs.join(' ');
    L.store.set('wedding-budget', rows);
    L.store.set('wedding-budget-meta', { total: T, guests: g });
  }

  var tbody = $('wb-table').querySelector('tbody');
  tbody.addEventListener('input', function (e) {
    var tr = e.target.closest('tr'), f = e.target.dataset.f;
    if (!tr || !f) return;
    var r = rows[Number(tr.dataset.i)], T = L.read(total);
    if (f === 'name') r.name = e.target.value;
    else if (f === 'planned') { r.pct = T ? Math.round(Number(e.target.value) / T * 1000) / 10 : 0; tr.querySelector('[data-f="pct"]').value = r.pct; }
    else if (f === 'pct') { r.pct = Number(e.target.value) || 0; tr.querySelector('[data-f="planned"]').value = Math.round(T * r.pct / 100); }
    else r[f] = Number(e.target.value) || 0;
    var planned = T * r.pct / 100, due = tr.children[5];
    due.textContent = L.money(Math.max(0, (r.actual || 0) - (r.paid || 0)));
    due.className = (r.actual || 0) > planned + 0.5 ? 'wb-over' : '';
    summary();
  });
  tbody.addEventListener('click', function (e) {
    var b = e.target.closest('.wb-del');
    if (!b) return;
    rows.splice(Number(b.closest('tr').dataset.i), 1);
    render();
  });
  total.addEventListener('input', L.debounce(render, 150));
  guests.addEventListener('input', L.debounce(summary, 150));
  $('wb-add').addEventListener('click', function () { rows.push({ name: 'New category', pct: 0, actual: 0, paid: 0 }); render(); });
  $('wb-reset').addEventListener('click', function () { if (confirm('Reset all categories to the suggested split? Your actual and paid amounts will be cleared.')) { reset(); render(); } });
  $('wb-csv').addEventListener('click', function () {
    var T = L.read(total);
    var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
    var lines = [['Category', 'Share %', 'Planned', 'Actual cost', 'Paid', 'Due'].map(q).join(',')].concat(rows.map(function (r) {
      return [r.name, r.pct, Math.round(T * r.pct / 100), r.actual || 0, r.paid || 0, Math.max(0, (r.actual || 0) - (r.paid || 0))].map(q).join(',');
    }));
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' }));
    a.download = 'wedding-budget.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  render();
})();
