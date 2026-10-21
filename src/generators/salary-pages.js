/*
 * Generates "Income tax on ₹X lakh salary" pages, plus an index page.
 * Every number comes from the same tax engine the calculator uses.
 */
'use strict';
const T = require('../assets/js/tax-engine.js');

const LAKHS = [5, 6, 7, 7.5, 8, 9, 10, 11, 12, 12.75, 13, 14, 15, 16, 17, 18, 20, 22, 24, 25, 30, 35, 40, 50];
const FY = '2026-27';
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const rs = v => (v < 0 ? '−₹' : '₹') + inr.format(Math.round(Math.abs(v)));
const lakhLabel = l => (Number.isInteger(l) ? String(l) : String(l)) + ' lakh';
const slug = l => String(l).replace('.', '-') + '-lakh';
const pathOf = l => '/income-tax-on-salary/' + slug(l) + '/';
const pct = v => (v * 100).toFixed(1) + '%';

const SCENARIOS = [
  { key: 'new', label: 'New regime', regime: 'new', p: {} },
  { key: 'oldNone', label: 'Old regime, no deductions', regime: 'old', p: {} },
  { key: 'oldCommon', label: 'Old regime, 80C ₹1.5L + 80D ₹25k', regime: 'old', p: { d80C: 150000, d80DSelf: 25000 } },
  { key: 'oldMax', label: 'Old regime, + NPS ₹50k + home loan interest ₹2L', regime: 'old', p: { d80C: 150000, d80DSelf: 25000, d80CCD1B: 50000, homeLoanInterest: 200000 } }
];

function compute(l) {
  const salary = Math.round(l * 100000);
  const base = { fy: FY, age: '<60', salary, professionalTax: 2400 };
  const res = {};
  SCENARIOS.forEach(s => { res[s.key] = T.compute(Object.assign({}, base, s.p), s.regime); });
  // New regime ignores professional tax, so the new result is the same with or without it.
  const breakEven = T.breakEvenDeduction(Object.assign({}, base));
  // Rough monthly in-hand: salary − tax − employee PF (capped) − professional tax.
  const pf = Math.min(salary * 0.5, 180000) * 0.12;
  const inHand = (salary - res.new.totalTax - pf - 2400) / 12;
  return { salary, res, breakEven, inHand, pf };
}

function slabRows(r) {
  return r.slabRows.map(s => {
    const range = s.to === Infinity ? 'Above ' + rs(s.from) : rs(s.from) + ' – ' + rs(s.to);
    return `      <tr><td>${range}</td><td>${s.rate ? (s.rate * 100) + '%' : 'Nil'}</td><td>${rs(s.amount)}</td><td>${rs(s.tax)}</td></tr>`;
  }).join('\n');
}

function steps(r) {
  const rows = [['Gross salary', rs(r.grossIncome)], ['Standard deduction', '− ' + rs(r.standardDeduction)]];
  if (r.professionalTax) rows.push(['Professional tax', '− ' + rs(r.professionalTax)]);
  if (r.homeLoanInterest) rows.push(['Home loan interest (24b)', '− ' + rs(r.homeLoanInterest)]);
  if (r.totalDeductions) rows.push(['Deductions (80C, 80D, NPS)', '− ' + rs(r.totalDeductions)]);
  rows.push(['<strong>Taxable income</strong>', '<strong>' + rs(r.taxableIncome) + '</strong>'], ['Tax as per slabs', rs(r.slabTax)]);
  if (r.rebate) rows.push(['Rebate u/s 87A', '− ' + rs(r.rebate)]);
  if (r.marginalRelief) rows.push(['Marginal relief', '− ' + rs(r.marginalRelief)]);
  if (r.surcharge) rows.push(['Surcharge', rs(r.surcharge)]);
  rows.push(['Cess (4%)', rs(r.cess)], ['<strong>Total tax</strong>', '<strong>' + rs(r.totalTax) + '</strong>']);
  return rows.map(([a, b]) => `      <tr><th>${a}</th><td>${b}</td></tr>`).join('\n');
}

function page(l, i) {
  const { salary, res, breakEven, inHand, pf } = compute(l);
  const n = res.new, best = Math.min(n.totalTax, res.oldNone.totalTax, res.oldCommon.totalTax, res.oldMax.totalTax);
  const label = lakhLabel(l);
  const newWins = n.totalTax <= res.oldMax.totalTax;
  const prev = LAKHS[i - 1], next = LAKHS[i + 1];
  const zero = n.totalTax === 0;

  const answer = zero
    ? `You pay <strong>no income tax</strong> on a ₹${label} salary in FY 2026-27 under the new regime.`
    : `Income tax on a ₹${label} salary is <strong>${rs(n.totalTax)}</strong> a year (about ${rs(n.totalTax / 12)} a month) under the new regime in FY 2026-27.`;

  const regimeLine = newWins
    ? `The <strong>new regime is cheaper</strong>, even if you claim 80C, 80D, NPS and ₹2 lakh of home loan interest in the old regime.`
    : `The <strong>old regime can be cheaper</strong> if you claim 80C, 80D, NPS and ₹2 lakh of home loan interest: you'd pay ${rs(res.oldMax.totalTax)} instead of ${rs(n.totalTax)}.`;

  const meta = {
    title: `Income Tax on ₹${label} Salary FY 2026-27 (New vs Old Regime) | LiveLifeTricks`,
    description: zero
      ? `Tax on ₹${label} salary in FY 2026-27 is zero under the new regime. See the full calculation, old regime comparison and monthly in-hand pay.`
      : `Tax on ₹${label} salary in FY 2026-27: ${rs(n.totalTax)} under the new regime. Step-by-step calculation, old regime comparison, slab breakdown and monthly in-hand pay.`,
    path: pathOf(l),
    priority: '0.7',
    breadcrumb: `₹${label} salary`,
    breadcrumbParent: { name: 'Income tax by salary', path: '/income-tax-on-salary/' }
  };

  const body = `
<section class="hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/income-tax-on-salary/">Income tax by salary</a> › ₹${label}</nav>
    <h1>Income Tax on ₹${label} Salary (FY 2026-27)</h1>
    <p class="lead">${answer}</p>
  </div>
</section>

<section class="wrap">
  <div class="stats card" style="margin-top:0">
    <div class="stat"><div class="k">New regime tax</div><div class="v">${rs(n.totalTax)}</div></div>
    <div class="stat"><div class="k">Old regime tax (80C + 80D)</div><div class="v">${rs(res.oldCommon.totalTax)}</div></div>
    <div class="stat"><div class="k">Effective tax rate (new)</div><div class="v">${pct(n.effectiveRate)}</div></div>
    <div class="stat"><div class="k">Approx. monthly in-hand</div><div class="v">${rs(inHand)}</div></div>
  </div>
  <div class="actions"><a class="btn btn-primary" href="/income-tax-calculator/?fy=${FY}&amp;age=%3C60&amp;salary=${salary}">Change the numbers in the calculator →</a></div>
</section>

<article class="wrap narrow content">
  <p class="updated">Last updated: {{updated}} · FY 2026-27 (AY 2027-28) rules</p>

  <h2>New regime vs old regime for ₹${label}</h2>
  <p>${regimeLine}</p>
  <div class="scroll-x"><table>
    <thead><tr><th>Scenario</th><th>Taxable income</th><th>Yearly tax</th><th>Monthly</th></tr></thead>
    <tbody>
${SCENARIOS.map(s => `      <tr${res[s.key].totalTax === best ? ' style="font-weight:700"' : ''}><td>${s.label}</td><td>${rs(res[s.key].taxableIncome)}</td><td>${rs(res[s.key].totalTax)}</td><td>${rs(res[s.key].totalTax / 12)}</td></tr>`).join('\n')}
    </tbody>
  </table></div>
  ${breakEven > 0 && !zero ? `<p>For the old regime to match the new one at this salary, you'd need about <strong>${rs(breakEven)}</strong> of deductions in total (80C, 80D, HRA, home loan interest and so on), on top of the standard deduction.</p>` : ''}

  <h2>New regime calculation, step by step</h2>
  <table>
    <tbody>
${steps(n)}
    </tbody>
  </table>

  <h2>Slab-wise tax (new regime)</h2>
  <div class="scroll-x"><table>
    <thead><tr><th>Slab</th><th>Rate</th><th>Income in slab</th><th>Tax</th></tr></thead>
    <tbody>
${slabRows(n)}
    </tbody>
  </table></div>

  <h2>Monthly in-hand salary</h2>
  <p>If ₹${label} is your gross salary, you'd take home about <strong>${rs(inHand)} a month</strong> under the new regime, after ${rs(pf / 12)} employee PF, ₹200 professional tax and ${rs(n.totalTax / 12)} income tax. If ₹${label} is your <em>CTC</em>, your take-home will be a little lower. Check it with the <a href="/salary-calculator/?ctc=${salary}">in-hand salary calculator</a>.</p>

  <h2>Frequently asked questions</h2>
  <div class="faq-wrap">
    <details class="faq"><summary>How much tax do I pay on a ₹${label} salary?</summary><p>${zero ? `Nothing under the new regime. After the ₹75,000 standard deduction, your taxable income is ${rs(n.taxableIncome)}, and the Section 87A rebate cancels the tax for taxable income up to ₹12 lakh.` : `${rs(n.totalTax)} a year under the new regime, including 4% cess. That's an effective rate of ${pct(n.effectiveRate)} on your salary.`}</p></details>
    <details class="faq"><summary>Which tax regime is better for a ₹${label} salary?</summary><p>${newWins ? `The new regime. Even with 80C, 80D, NPS and ₹2 lakh of home loan interest, the old regime costs ${rs(res.oldMax.totalTax)} compared with ${rs(n.totalTax)} in the new regime.` : `It depends on your deductions. With 80C, 80D, NPS and ₹2 lakh of home loan interest, the old regime costs ${rs(res.oldMax.totalTax)} compared with ${rs(n.totalTax)} in the new regime. With only 80C and 80D, it costs ${rs(res.oldCommon.totalTax)}.`}</p></details>
    <details class="faq"><summary>How much tax is deducted from my salary every month?</summary><p>About ${rs(n.totalTax / 12)} a month under the new regime, as your employer spreads the yearly tax evenly. It can change if you submit investment proofs or get a bonus.</p></details>
  </div>

  <div class="card cta" style="margin-top:28px">
    <div>${prev != null ? `<a href="${pathOf(prev)}">← Tax on ₹${lakhLabel(prev)}</a>` : ''}</div>
    <div><a href="/income-tax-on-salary/">All salaries</a></div>
    <div>${next != null ? `<a href="${pathOf(next)}">Tax on ₹${lakhLabel(next)} →</a>` : ''}</div>
  </div>
</article>
`;
  return { meta, body };
}

function index() {
  const rows = LAKHS.map(l => {
    const { res, inHand } = compute(l);
    return `      <tr><td><a href="${pathOf(l)}">₹${lakhLabel(l)}</a></td><td>${rs(res.new.totalTax)}</td><td>${rs(res.oldCommon.totalTax)}</td><td>${rs(inHand)}</td></tr>`;
  }).join('\n');
  return {
    meta: {
      title: 'Income Tax by Salary FY 2026-27 – ₹5 Lakh to ₹50 Lakh | LiveLifeTricks',
      description: 'Exact income tax for every salary from ₹5 lakh to ₹50 lakh in FY 2026-27, under the new and old regimes, with monthly in-hand pay. Pick your salary for the full calculation.',
      path: '/income-tax-on-salary/',
      priority: '0.9',
      breadcrumb: 'Income tax by salary'
    },
    body: `
<section class="hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › Income tax by salary</nav>
    <h1>Income Tax by Salary (FY 2026-27)</h1>
    <p class="lead">Find your salary to see exactly how much tax you'll pay under each regime, worked out step by step.</p>
  </div>
</section>
<section class="wrap">
  <div class="table-wrap">
    <table class="data">
      <thead><tr><th>Gross salary</th><th>New regime tax</th><th>Old regime tax (80C + 80D)</th><th>Monthly in-hand (new)</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
  <p class="small muted">Resident individual below 60, salaried, FY 2026-27. Old regime includes ₹1.5 lakh 80C, ₹25,000 80D and ₹2,400 professional tax. In-hand assumes PF on basic at 50% of salary, capped at ₹1,800 a month.</p>
  <div class="actions"><a class="btn btn-primary" href="/income-tax-calculator/">Calculate for your exact salary →</a></div>
</section>
`
  };
}

module.exports = function () {
  return [index()].concat(LAKHS.map(page));
};
module.exports.LAKHS = LAKHS;
module.exports.compute = compute;
