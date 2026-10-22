/*
 * Charts for the homepage, drawn at build time as inline SVG from the same
 * engines the calculators use, so the numbers always match the tools.
 * Colours come from CSS classes (see .chart in style.css), so dark mode works.
 */
'use strict';
const Tax = require('./assets/js/tax-engine.js');
const Emi = require('./assets/js/emi-engine.js');
const Fin = require('./assets/js/finance-engines.js');

const inr = n => Math.round(n).toLocaleString('en-IN');
function short(n) {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(n >= 1e8 ? 0 : 2).replace(/\.?0+$/, '') + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + ' L';
  if (n >= 1e3) return '₹' + Math.round(n / 1e3) + 'k';
  return '₹' + Math.round(n);
}

// Shared bits ------------------------------------------------------------
function svgOpen(id, w, h, title, desc) {
  return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-labelledby="' + id + '-t ' + id + '-d" preserveAspectRatio="xMidYMid meet">' +
    '<title id="' + id + '-t">' + title + '</title><desc id="' + id + '-d">' + desc + '</desc>';
}
function legend(items) {
  return '<div class="chart-legend">' + items.map(([cls, label]) => '<span><i class="sw ' + cls + '"></i>' + label + '</span>').join('') + '</div>';
}
function dataTable(head, rows) {
  return '<details class="chart-data"><summary>See the numbers</summary><table><thead><tr>' + head.map(h => '<th>' + h + '</th>').join('') +
    '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map((c, i) => (i ? '<td class="num">' : '<td>') + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></details>';
}
function gridLines(x0, x1, y0, h, max, steps, fmt) {
  let s = '';
  for (let i = 0; i <= steps; i++) {
    const v = max * i / steps, y = y0 + h - h * i / steps;
    s += '<line class="grid" x1="' + x0 + '" x2="' + x1 + '" y1="' + y + '" y2="' + y + '"/>' +
      '<text class="axis" x="' + (x0 - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(v) + '</text>';
  }
  return s;
}
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

// 1. Tax: new vs old regime ------------------------------------------------
function taxChart() {
  const salaries = [8, 12, 15, 20, 25, 30];
  const data = salaries.map(L => {
    const c = Tax.compare({ salary: L * 1e5, d80C: 150000, d80DSelf: 25000, fy: '2026-27' });
    return { L, nw: c.new.totalTax, old: c.old.totalTax };
  });
  const W = 520, H = 260, x0 = 54, y0 = 14, ch = 200, cw = W - x0 - 8;
  const max = niceMax(Math.max(...data.map(d => d.old)));
  const band = cw / data.length, bw = Math.min(26, band / 3);
  let s = svgOpen('ch-tax', W, H, 'Income tax under the new and old regime, FY 2026-27',
    'For salaries from 8 to 30 lakh, the new regime tax is lower at every level shown. Old regime assumes 1.5 lakh in 80C and 25,000 in 80D.');
  s += gridLines(x0, W - 8, y0, ch, max, 4, short);
  data.forEach((d, i) => {
    const cx = x0 + band * i + band / 2;
    const hn = ch * d.nw / max, ho = ch * d.old / max;
    s += '<rect class="bar-a" x="' + (cx - bw - 2) + '" y="' + (y0 + ch - hn) + '" width="' + bw + '" height="' + Math.max(hn, 1.5) + '" rx="3"><title>New regime: ₹' + inr(d.nw) + '</title></rect>';
    s += '<rect class="bar-b" x="' + (cx + 2) + '" y="' + (y0 + ch - ho) + '" width="' + bw + '" height="' + Math.max(ho, 1.5) + '" rx="3"><title>Old regime: ₹' + inr(d.old) + '</title></rect>';
    if (d.nw === 0) s += '<text class="val" x="' + (cx - bw / 2 - 2) + '" y="' + (y0 + ch - 6) + '" text-anchor="middle">₹0</text>';
    s += '<text class="axis" x="' + cx + '" y="' + (y0 + ch + 18) + '" text-anchor="middle">₹' + d.L + ' L</text>';
  });
  s += '<text class="axis" x="' + (x0 + cw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">Yearly salary (CTC)</text></svg>';
  const at15 = data.find(d => d.L === 15);
  return {
    title: 'New regime saves tax at every salary',
    note: 'On a ₹15 lakh salary you pay <strong>₹' + inr(at15.nw) + '</strong> in the new regime vs <strong>₹' + inr(at15.old) + '</strong> in the old one, even after ₹1.75 lakh of 80C + 80D. Up to ₹12.75 lakh salary, the new regime tax is zero.',
    svg: s,
    legend: legend([['a', 'New regime'], ['b', 'Old regime (80C + 80D used)']]),
    table: dataTable(['Salary', 'New regime', 'Old regime'], data.map(d => ['₹' + d.L + ' lakh', '₹' + inr(d.nw), '₹' + inr(d.old)])),
    link: '/income-tax-calculator/', linkText: 'Check your own tax'
  };
}

// 2. SIP growth -----------------------------------------------------------
function sipChart() {
  const years = [5, 10, 15, 20, 25];
  const data = years.map(y => { const r = Fin.sip({ monthly: 10000, annualRate: 12, years: y }); return { y, inv: r.invested, gain: r.gains, val: r.value }; });
  const W = 520, H = 260, x0 = 54, y0 = 14, ch = 200, cw = W - x0 - 8;
  const max = niceMax(Math.max(...data.map(d => d.val)));
  const band = cw / data.length, bw = Math.min(46, band * 0.55);
  let s = svgOpen('ch-sip', W, H, 'Growth of a 10,000 rupee monthly SIP at 12 percent',
    'Money invested grows slowly while gains grow faster each year. After 25 years, 30 lakh invested becomes about 1.9 crore.');
  s += gridLines(x0, W - 8, y0, ch, max, 4, short);
  data.forEach((d, i) => {
    const cx = x0 + band * i + band / 2;
    const hi = ch * d.inv / max, hg = ch * d.gain / max;
    s += '<rect class="bar-a" x="' + (cx - bw / 2) + '" y="' + (y0 + ch - hi) + '" width="' + bw + '" height="' + hi + '"><title>Invested: ₹' + inr(d.inv) + '</title></rect>';
    s += '<rect class="bar-b" x="' + (cx - bw / 2) + '" y="' + (y0 + ch - hi - hg) + '" width="' + bw + '" height="' + hg + '" rx="3"><title>Gains: ₹' + inr(d.gain) + '</title></rect>';
    s += '<text class="val" x="' + cx + '" y="' + (y0 + ch - hi - hg - 6) + '" text-anchor="middle">' + short(d.val) + '</text>';
    s += '<text class="axis" x="' + cx + '" y="' + (y0 + ch + 18) + '" text-anchor="middle">' + d.y + ' yrs</text>';
  });
  s += '</svg>';
  const last = data[data.length - 1];
  return {
    title: 'Time does the heavy lifting in a SIP',
    note: '₹10,000 a month at 12% a year: you put in <strong>₹' + inr(last.inv) + '</strong> over 25 years and it can grow to about <strong>' + short(last.val) + '</strong>. Most of that comes in the last 10 years.',
    svg: s,
    legend: legend([['a', 'Money you invest'], ['b', 'Growth']]),
    table: dataTable(['Years', 'Invested', 'Value'], data.map(d => [d.y, '₹' + inr(d.inv), '₹' + inr(d.val)])),
    link: '/sip-calculator/', linkText: 'Plan your SIP'
  };
}

// 3. Home loan: principal vs interest donut ------------------------------
function loanChart() {
  const P = 50e5, rate = 8.5, months = 240;
  const emi = Emi.emi(P, rate, months), interest = emi * months - P;
  const total = P + interest, R = 70, C = 2 * Math.PI * R;
  const pLen = C * P / total;
  const W = 520, H = 260, cx = 150, cy = 130;
  let s = svgOpen('ch-loan', W, H, 'Where the money goes on a 50 lakh home loan',
    'Over 20 years at 8.5 percent, total interest of about 54 lakh is more than the 50 lakh borrowed.');
  s += '<circle class="ring-b" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke-width="30"/>';
  s += '<circle class="ring-a" cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke-width="30" stroke-dasharray="' + pLen.toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
  s += '<text class="axis" x="' + cx + '" y="' + (cy - 8) + '" text-anchor="middle">Monthly EMI</text>';
  s += '<text class="big" x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle">₹' + inr(emi) + '</text>';
  const rows = [['a', 'Loan amount', P], ['b', 'Total interest', interest], ['', 'You pay in all', total]];
  rows.forEach((r, i) => {
    const y = 78 + i * 52;
    if (r[0]) s += '<rect class="bar-' + r[0] + '" x="290" y="' + (y - 11) + '" width="12" height="12" rx="3"/>';
    s += '<text class="axis" x="' + (r[0] ? 310 : 290) + '" y="' + y + '">' + r[1] + '</text>';
    s += '<text class="big sm" x="' + (r[0] ? 310 : 290) + '" y="' + (y + 24) + '">₹' + inr(r[2]) + '</text>';
  });
  s += '</svg>';
  return {
    title: 'A home loan costs more than you borrow',
    note: 'A ₹50 lakh loan for 20 years at 8.5% means <strong>₹' + inr(interest) + '</strong> in interest. Paying even ₹5,000 extra a month cuts years off it.',
    svg: s,
    legend: '',
    table: dataTable(['', 'Amount'], [['EMI', '₹' + inr(emi)], ['Loan amount', '₹' + inr(P)], ['Total interest', '₹' + inr(interest)], ['Total paid', '₹' + inr(total)]]),
    link: '/emi-calculator/', linkText: 'Work out your EMI'
  };
}

// 4. Government savings rates --------------------------------------------
function ratesChart() {
  const data = [
    ['EPF', 8.25, 'FY 2025-26 rate', '/epf-calculator/'],
    ['Sukanya Samriddhi', 8.2, 'Oct–Dec 2026', '/sukanya-samriddhi-calculator/'],
    ['PPF', 7.1, 'Oct–Dec 2026', '/ppf-calculator/']
  ];
  const W = 520, H = 200, x0 = 150, max = 10, bw = W - x0 - 70;
  let s = svgOpen('ch-rates', W, H, 'Interest rates on government savings schemes',
    'EPF pays 8.25 percent, Sukanya Samriddhi 8.2 percent and PPF 7.1 percent. All three are tax-free.');
  data.forEach((d, i) => {
    const y = 26 + i * 56, w = bw * d[1] / max;
    s += '<text class="lbl" x="' + (x0 - 12) + '" y="' + (y + 13) + '" text-anchor="end">' + d[0] + '</text>';
    s += '<text class="axis" x="' + (x0 - 12) + '" y="' + (y + 30) + '" text-anchor="end">' + d[2] + '</text>';
    s += '<rect class="track" x="' + x0 + '" y="' + y + '" width="' + bw + '" height="26" rx="6"/>';
    s += '<rect class="bar-a" x="' + x0 + '" y="' + y + '" width="' + w.toFixed(1) + '" height="26" rx="6"/>';
    s += '<text class="big sm" x="' + (x0 + w + 8) + '" y="' + (y + 19) + '">' + d[1] + '%</text>';
  });
  s += '</svg>';
  return {
    title: 'Tax-free savings rates right now',
    note: 'Interest from all three is tax-free. Small-savings rates are reset every quarter; our calculators use the latest ones.',
    svg: s,
    legend: '',
    table: dataTable(['Scheme', 'Rate', 'Period'], data.map(d => [d[0], d[1] + '%', d[2]])),
    link: '/savings-and-retirement/', linkText: 'Compare savings tools'
  };
}

function figure(c) {
  return '<figure class="card chart-card"><figcaption><h3>' + c.title + '</h3><p class="muted small">' + c.note + '</p></figcaption>' +
    c.svg + c.legend + '<div class="chart-foot">' + c.table + '<a href="' + c.link + '">' + c.linkText + ' →</a></div></figure>';
}

function homeCharts() {
  return '<div class="chart-grid">' + [taxChart(), sipChart(), loanChart(), ratesChart()].map(figure).join('') + '</div>';
}

// Small hero numbers, also from the engines
function heroFacts() {
  const c = Tax.compare({ salary: 15e5, d80C: 150000, d80DSelf: 25000, fy: '2026-27' });
  const emi = Emi.emi(50e5, 8.5, 240);
  return { taxNew: inr(c.new.totalTax), taxOld: inr(c.old.totalTax), taxSave: inr(c.old.totalTax - c.new.totalTax), emi: inr(emi), sip25: short(Fin.sip({ monthly: 10000, annualRate: 12, years: 25 }).value) };
}

module.exports = { homeCharts, heroFacts };
