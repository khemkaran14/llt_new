/* Tax calendar page: countdowns, filters and "add to calendar". Depends on common.js. */
(function () {
  'use strict';
  var L = window.LLT;
  var list = document.getElementById('cal-list');
  if (!list) return;

  // who: everyone | salaried | business | investors
  // Update this list after every Budget. Dates are for individual taxpayers.
  var EVENTS = [
    { date: '2026-10-31', who: ['business'], title: 'ITR due for audit cases (FY 2025-26)', detail: 'Last date to file the income tax return if your accounts need a tax audit. Check incometax.gov.in for any extension.' },
    { date: '2026-12-15', who: ['business', 'investors'], title: 'Advance tax: 3rd instalment', detail: 'Pay at least 75% of your estimated tax for FY 2026-27, if your tax after TDS is more than ₹10,000. Missing it costs 1% interest a month (Section 234C).' },
    { date: '2026-12-31', who: ['everyone'], title: 'Last date for belated ITR (FY 2025-26)', detail: 'File your missed return for FY 2025-26. Late fee: ₹5,000, or ₹1,000 if total income is up to ₹5 lakh.' },
    { date: '2027-01-15', who: ['salaried'], title: 'Submit investment proofs to your employer', detail: 'Most employers ask for 80C, 80D, HRA rent receipts and home loan proofs in January–February. Check the exact date with HR. Missing it means extra TDS from your salary.' },
    { date: '2027-03-15', who: ['business', 'investors'], title: 'Advance tax: final instalment', detail: 'Pay 100% of your estimated tax for FY 2026-27. Presumptive taxpayers (44AD / 44ADA) can pay the full amount in this one instalment.' },
    { date: '2027-03-31', who: ['everyone'], title: 'Last day to save tax for FY 2026-27', detail: 'Investments under 80C, 80D, 80CCD(1B) NPS and donations must be made by today to count for FY 2026-27 (old regime).' },
    { date: '2027-03-31', who: ['investors'], title: 'Minimum yearly deposits: PPF, SSY, NPS', detail: 'Deposit at least ₹500 in PPF, ₹250 in Sukanya Samriddhi and ₹1,000 in NPS Tier I this year to keep the accounts active.' },
    { date: '2027-03-31', who: ['everyone'], title: 'Last date for revised ITR (FY 2025-26)', detail: 'Correct a mistake in the return you filed for FY 2025-26.' },
    { date: '2027-04-05', who: ['investors'], title: 'Deposit in PPF for full-year interest', detail: 'PPF money deposited by 5 April earns interest for the whole of FY 2027-28.' },
    { date: '2027-06-15', who: ['salaried'], title: 'Form 16 from your employer', detail: 'Employers must issue Form 16 for FY 2026-27 by today. You need it to file your return.' },
    { date: '2027-06-15', who: ['business', 'investors'], title: 'Advance tax: 1st instalment (FY 2027-28)', detail: 'Pay at least 15% of your estimated tax for FY 2027-28.' },
    { date: '2027-07-31', who: ['everyone', 'salaried'], title: 'ITR due for salaried and non-audit (FY 2026-27)', detail: 'Last date to file ITR-1 or ITR-2 for FY 2026-27 without a late fee. Filing early also gets your refund sooner.' },
    { date: '2027-08-31', who: ['business'], title: 'ITR due for business and professionals, non-audit (FY 2026-27)', detail: 'ITR-3 and ITR-4 for business and professional income that does not need an audit.' },
    { date: '2027-09-15', who: ['business', 'investors'], title: 'Advance tax: 2nd instalment (FY 2027-28)', detail: 'Pay at least 45% of your estimated tax for FY 2027-28.' },
    { date: '2027-10-31', who: ['business'], title: 'ITR due for audit cases (FY 2026-27)', detail: 'Last date to file the return if your accounts need a tax audit.' }
  ];

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var filter = 'all';

  function parse(d) { var p = d.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }
  function daysLeft(d) { return Math.round((parse(d) - today()) / 86400000); }
  function ymd(d, add) { var x = parse(d); x.setDate(x.getDate() + (add || 0)); return x.getFullYear() + String(x.getMonth() + 1).padStart(2, '0') + String(x.getDate()).padStart(2, '0'); }
  function nice(d) { var x = parse(d); return x.getDate() + ' ' + MONTHS[x.getMonth()] + ' ' + x.getFullYear(); }
  function matches(e) { return filter === 'all' || e.who.indexOf(filter) !== -1 || e.who.indexOf('everyone') !== -1; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function googleLink(e) {
    var q = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: ymd(e.date) + '/' + ymd(e.date, 1), details: e.detail + '\n\nlivelifetricks.com/tax-calendar/' });
    return 'https://calendar.google.com/calendar/render?' + q;
  }

  // iCalendar file with a reminder 3 days before each deadline.
  function ics(events) {
    var icsEsc = function (s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); };
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LiveLifeTricks//Tax Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Tax deadlines (LiveLifeTricks)'];
    events.forEach(function (e, i) {
      lines.push('BEGIN:VEVENT', 'UID:' + ymd(e.date) + '-' + i + '@livelifetricks.com', 'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + ymd(e.date), 'DTEND;VALUE=DATE:' + ymd(e.date, 1),
        'SUMMARY:' + icsEsc(e.title), 'DESCRIPTION:' + icsEsc(e.detail + '\n\nhttps://livelifetricks.com/tax-calendar/'),
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:-P3D', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function upcoming() { return EVENTS.filter(function (e) { return daysLeft(e.date) >= 0 && matches(e); }); }

  function render() {
    var up = upcoming();
    var next = up[0];
    if (next) {
      var d = daysLeft(next.date);
      L.set('next-days', d === 0 ? 'Today' : d + (d === 1 ? ' day' : ' days'));
      L.set('next-title', next.title);
      L.set('next-date', nice(next.date));
    }
    var past = EVENTS.filter(function (e) { return daysLeft(e.date) < 0 && matches(e); });
    list.innerHTML = up.map(function (e, i) {
      var d = daysLeft(e.date);
      var urgent = d <= 15 ? ' urgent' : '';
      return '<li class="card cal-item' + urgent + '">' +
        '<div class="cal-date"><span class="cal-day">' + parse(e.date).getDate() + '</span><span>' + MONTHS[parse(e.date).getMonth()] + ' ' + parse(e.date).getFullYear() + '</span></div>' +
        '<div class="cal-body"><h3>' + esc(e.title) + '</h3><p>' + esc(e.detail) + '</p>' +
        '<div class="cal-actions"><span class="cal-left">' + (d === 0 ? 'Today' : d + ' days left') + '</span>' +
        '<a class="btn" href="' + esc(googleLink(e)) + '" target="_blank" rel="noopener">+ Google Calendar</a>' +
        '<button type="button" class="btn" data-ics="' + EVENTS.indexOf(e) + '">+ Apple / Outlook</button></div></div></li>';
    }).join('') || '<li class="muted">No upcoming deadlines for this filter.</li>';
    L.set('past-count', past.length ? past.length + ' deadline' + (past.length > 1 ? 's' : '') + ' already passed this year.' : '');
  }

  list.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-ics]');
    if (!b) return;
    var e = EVENTS[+b.dataset.ics];
    download('tax-deadline-' + e.date + '.ics', ics([e]));
  });
  document.getElementById('add-all').addEventListener('click', function () {
    download('tax-deadlines-livelifetricks.ics', ics(upcoming()));
  });
  document.getElementById('cal-filter').addEventListener('click', function (ev) {
    var b = ev.target.closest('button');
    if (!b) return;
    filter = b.dataset.value;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    L.store.set('cal-filter', filter);
    render();
  });
  var saved = L.store.get('cal-filter');
  if (saved) {
    var btn = document.querySelector('#cal-filter [data-value="' + saved + '"]');
    if (btn) btn.click(); else render();
  } else render();
})();
