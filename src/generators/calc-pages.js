/*
 * Calculator pages built from short definitions: SSY, NPS, EPF, gratuity,
 * capital gains, home loan eligibility, retirement, inflation and land area.
 * Their logic lives in assets/js/finance-engines.js and assets/js/more-calcs.js.
 */
'use strict';

const money = (key, label, value, o = {}) => `
        <div class="field${o.cls ? ' ' + o.cls : ''}"${o.id ? ` id="${o.id}"` : ''}>
          <label for="${key}">${label}${o.hint ? ` <span class="hint">${o.hint}</span>` : ''}</label>
          <div class="money"><input id="${key}" data-key="${key}" data-money inputmode="numeric" type="text"${value !== '' && value != null ? ` value="${value}"` : ''}${o.placeholder ? ` placeholder="${o.placeholder}"` : ''}></div>
          ${o.range ? `<input type="range" data-for="${key}" min="${o.range[0]}" max="${o.range[1]}" step="${o.range[2]}" value="${value}" aria-label="${label} slider">` : ''}
        </div>`;
const num = (key, label, value, suffix, o = {}) => `
        <div class="field"${o.id ? ` id="${o.id}"` : ''}>
          <label for="${key}">${label}${o.hint ? ` <span class="hint">${o.hint}</span>` : ''}</label>
          <div class="suffix"><input id="${key}" data-key="${key}" type="number" inputmode="decimal" min="${o.min ?? 0}" max="${o.max ?? 100}" step="${o.step ?? 1}" value="${value}"><span>${suffix}</span></div>
          ${o.range ? `<input type="range" data-for="${key}" min="${o.range[0]}" max="${o.range[1]}" step="${o.range[2]}" value="${value}" aria-label="${label} slider">` : ''}
        </div>`;
const select = (key, label, options, o = {}) => `
        <div class="field"${o.id ? ` id="${o.id}"` : ''}>
          <label for="${key}">${label}${o.hint ? ` <span class="hint">${o.hint}</span>` : ''}</label>
          <select id="${key}" data-key="${key}">${options.map(([v, t]) => `<option value="${v}"${v === o.value ? ' selected' : ''}>${t}</option>`).join('')}</select>
        </div>`;
const date = (key, label, value) => `
        <div class="field"><label for="${key}">${label}</label><input id="${key}" data-key="${key}" type="date"${value ? ` value="${value}"` : ''}></div>`;
const donut = (a, b) => `
      <div class="donut-row">
        <svg class="donut" viewBox="0 0 42 42" role="img" aria-label="${a} and ${b} share">
          <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--chart-1)" stroke-width="6"></circle>
          <circle id="donut-2" cx="21" cy="21" r="15.915" fill="none" stroke="var(--chart-2)" stroke-width="6" stroke-dasharray="0 100" stroke-dashoffset="25"></circle>
        </svg>
        <ul class="legend"><li><span class="dot" style="background:var(--chart-1)"></span> ${a}</li><li><span class="dot" style="background:var(--chart-2)"></span> ${b}</li></ul>
      </div>`;
const stat = (id, label) => `<div class="stat"><div class="k">${label}</div><div class="v" id="${id}">–</div></div>`;
const faq = list => list.map(([q, a]) => `    <details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('\n');

function page(d) {
  return {
    meta: Object.assign({ priority: '0.8', embed: true, scripts: d.scripts || ['finance-engines.js', 'more-calcs.js'],
      schema: { '@context': 'https://schema.org', '@type': 'WebApplication', name: d.h1, url: 'https://livelifetricks.com' + d.path, applicationCategory: 'FinanceApplication', operatingSystem: 'Any', inLanguage: 'en-IN', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } } },
    { title: d.title, description: d.description, path: d.path, breadcrumb: d.crumb }),
    body: `
<section class="hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › ${d.crumb}</nav>
    <h1>${d.h1}</h1>
    <p class="lead">${d.lead}</p>
    ${d.badges ? `<div class="badges">${d.badges.map(b => `<span class="badge">${b}</span>`).join('')}</div>` : ''}
  </div>
</section>
<section class="wrap">
  <div class="calc">
    <form class="card" id="${d.form}" autocomplete="off" onsubmit="return false">
${d.fields}
    </form>
    <aside class="card results" aria-live="polite">
${d.results}
      <div class="tip" id="out-warn" hidden></div>
      <div class="actions"><button type="button" class="btn btn-primary" data-share>Copy link to this result</button></div>
    </aside>
  </div>
${d.table ? `  <h2>${d.tableTitle}</h2>\n  <div class="table-wrap"><table class="data" id="${d.table}"></table></div>` : ''}
</section>
<article class="wrap narrow content">
  <p class="updated">Last updated: {{updated}}</p>
${d.content}
  <h2>Frequently asked questions</h2>
  <div class="faq-wrap">
${faq(d.faqs)}
  </div>
</article>
`
  };
}

const PAGES = [
  {
    path: '/sukanya-samriddhi-calculator/', crumb: 'Sukanya Samriddhi Calculator', form: 'ssy-form', table: 'ssy-table', tableTitle: 'Year-by-year balance',
    title: 'Sukanya Samriddhi Calculator 2026 – SSY Maturity at 8.2% | LiveLifeTricks',
    description: 'Free Sukanya Samriddhi Yojana calculator at the current 8.2% rate. See your daughter\'s SSY maturity amount at 21 years, tax-free interest and year-by-year balance.',
    h1: 'Sukanya Samriddhi Calculator', lead: 'See how much your daughter\'s Sukanya Samriddhi account will be worth when it matures, with completely tax-free interest.',
    badges: ['Current rate 8.2%', 'Tax-free', 'Year-by-year table'],
    fields: money('yearly', 'Yearly deposit', 150000, { hint: '₹250 to ₹1,50,000 a year.', range: [250, 150000, 250] }) +
      num('rate', 'Interest rate', 8.2, '% p.a.', { min: 1, max: 15, step: 0.1, hint: '8.2% for October–December 2026. Reviewed every quarter.' }) +
      '<div class="row2">' + num('age', 'Daughter\'s age now', 1, 'years', { min: 0, max: 10 }) + num('start', 'Year you start', new Date().getFullYear(), '', { min: 2015, max: 2040 }) + '</div>',
    results: `      <h2>Maturity amount</h2>\n      <div class="big" id="out-big">–</div>\n      <p class="muted small" id="out-when"></p>\n      <div class="stats">${stat('out-invested', 'Total deposited')}${stat('out-interest', 'Tax-free interest')}</div>${donut('Deposits', 'Interest')}`,
    content: `
  <h2>How Sukanya Samriddhi works</h2>
  <ul>
    <li>Open it for a girl below 10 years old, at a post office or bank. One account per girl, up to two girls per family.</li>
    <li>Deposit between ₹250 and ₹1,50,000 every year for <strong>15 years</strong>. The account <strong>matures after 21 years</strong> from opening.</li>
    <li>Interest is set by the government every quarter (8.2% now) and compounded yearly.</li>
    <li><strong>EEE tax status:</strong> deposits count for 80C (old regime), and both interest and maturity are tax-free.</li>
    <li>Up to 50% can be withdrawn after she turns 18, for higher education or marriage.</li>
  </ul>
  <p><strong>Example:</strong> ₹1.5 lakh a year at 8.2% grows to about <strong>₹71.8 lakh</strong>. You deposit ₹22.5 lakh and earn about ₹49.3 lakh in tax-free interest.</p>`,
    faqs: [['What is the Sukanya Samriddhi interest rate now?', '8.2% a year for October–December 2026. The government reviews small savings rates every quarter.'],
      ['When can I withdraw money?', 'Up to 50% of the balance after the girl turns 18 or passes class 10, for education. The full amount at maturity (21 years) or for her marriage after 18.'],
      ['What if I miss a yearly deposit?', 'The account becomes inactive. You can revive it by paying ₹250 for each missed year plus a ₹50 penalty per year.'],
      ['SSY or PPF for my daughter?', 'SSY pays more (8.2% vs 7.1%) and both are tax-free, but SSY money is meant for your daughter and is locked longer. Many parents use both.']]
  },
  {
    path: '/nps-calculator/', crumb: 'NPS Calculator', form: 'nps-form', table: 'nps-table', tableTitle: 'How your NPS grows',
    title: 'NPS Calculator – Pension & Lump Sum at Retirement | LiveLifeTricks',
    description: 'Free NPS calculator with the December 2025 exit rules: see your NPS corpus at 60, the lump sum you can withdraw (up to 80%) and your monthly pension.',
    h1: 'NPS Calculator', lead: 'See how big your NPS corpus could be at retirement, how much you can take as a lump sum, and the monthly pension it buys.',
    badges: ['Lump sum + pension', 'Yearly step-up'],
    fields: money('monthly', 'Monthly contribution', 5000, { range: [500, 100000, 500] }) +
      '<div class="row2">' + num('age', 'Your age', 30, 'years', { min: 18, max: 69 }) + num('retireAge', 'Retirement age', 60, 'years', { min: 40, max: 75 }) + '</div>' +
      '<div class="row2">' + num('rate', 'Expected return', 10, '% p.a.', { min: 1, max: 20, step: 0.5, hint: 'Equity-heavy NPS has averaged 9–12% over the long term.' }) + num('stepUp', 'Increase every year by', 0, '%', { max: 50 }) + '</div>' +
      select('sector', 'You are', [['private', 'Private sector / self-employed (min 20% annuity)'], ['govt', 'Government employee (min 40% annuity)']], { value: 'private' }) +
      '<div class="row2">' + num('annuityPct', 'Share used for pension', 40, '%', { min: 20, max: 100, hint: 'More here means a bigger pension and a smaller lump sum.' }) + num('annuityRate', 'Annuity (pension) rate', 6, '% p.a.', { min: 1, max: 12, step: 0.1 }) + '</div>' +
      money('current', 'Current NPS balance', '', { hint: 'Optional.' }),
    results: `      <h2>Corpus at retirement</h2>\n      <div class="big" id="out-big">–</div>\n      <div class="stats">${stat('out-invested', 'You invest')}${stat('out-lump', 'Lump sum')}${stat('out-annuity', 'Goes to annuity')}${stat('out-pension', 'Monthly pension')}</div>${donut('Invested', 'Returns')}`,
    content: `
  <h2>How NPS pays you at retirement (rules from December 2025)</h2>
  <ul>
    <li><strong>Private sector and self-employed:</strong> at least <strong>20%</strong> of the corpus buys an annuity (monthly pension for life), and up to 80% can be taken as a lump sum.</li>
    <li><strong>Government employees:</strong> at least <strong>40%</strong> goes to the annuity, and up to 60% can be withdrawn.</li>
    <li>Only <strong>60% of the corpus is tax-free</strong> as a lump sum. Anything withdrawn above that is taxed at your slab rate.</li>
    <li>Small corpus: if the total is ₹8 lakh or less, you can usually withdraw it all. Check the latest PFRDA rules for small balances.</li>
    <li>The pension is added to your income and taxed at your slab rate.</li>
  </ul>
  <h2>Tax benefits</h2>
  <ul>
    <li><strong>Old regime:</strong> your contribution counts for 80C (₹1.5 lakh) plus an extra ₹50,000 under 80CCD(1B).</li>
    <li><strong>Both regimes:</strong> your employer's contribution is deductible under 80CCD(2), up to 14% of basic + DA in the new regime.</li>
  </ul>`,
    faqs: [['Is the NPS pension guaranteed?', 'The annuity rate is fixed when you buy it at retirement, so the pension amount is then guaranteed for life. The corpus before that depends on market returns.'],
      ['Can I withdraw NPS early?', 'Partial withdrawals of up to 25% of your own contributions are allowed after 3 years for things like children\'s education, marriage, a house or medical treatment, up to 3 times.'],
      ['What annuity rate should I assume?', 'Annuity rates in India have been around 5.5–7% a year. 6% is a reasonable planning figure.']]
  },
  {
    path: '/epf-calculator/', crumb: 'EPF Calculator', form: 'epf-form', table: 'epf-table', tableTitle: 'Year-by-year PF balance',
    title: 'EPF Calculator 2026 – PF Balance at Retirement (8.25%) | LiveLifeTricks',
    description: 'Free EPF calculator with the current 8.25% interest rate. See your provident fund balance at retirement with yearly salary hikes, your share and your employer\'s.',
    h1: 'EPF Calculator', lead: 'See how much your provident fund will grow to by retirement, including your employer\'s share and yearly salary hikes.',
    badges: ['Current rate 8.25%', 'Salary hikes included', 'EPS split worked out'],
    fields: money('basic', 'Monthly basic salary + DA', 30000, { range: [5000, 300000, 1000] }) +
      '<div class="row2">' + num('age', 'Your age', 30, 'years', { min: 18, max: 57 }) + num('retireAge', 'Retirement age', 58, 'years', { min: 40, max: 60 }) + '</div>' +
      '<div class="row2">' + num('hike', 'Yearly salary hike', 5, '%', { max: 30, step: 0.5 }) + num('rate', 'EPF interest rate', 8.25, '% p.a.', { min: 1, max: 15, step: 0.05, hint: '8.25% for FY 2025-26.' }) + '</div>' +
      money('current', 'Current PF balance', '', { hint: 'Optional. Check your EPF passbook.' }),
    results: `      <h2>PF balance at retirement</h2>\n      <div class="big" id="out-big">–</div>\n      <div class="stats">${stat('out-contrib', 'Total contributions')}${stat('out-interest', 'Interest earned')}${stat('out-monthly', 'Going to EPF now')}</div>${donut('Contributions', 'Interest')}`,
    content: `
  <h2>How EPF contributions work</h2>
  <ul>
    <li>You pay <strong>12%</strong> of basic + DA every month.</li>
    <li>Your employer also pays 12%, but <strong>8.33%</strong> of wages up to ₹15,000 (at most ₹1,250 a month) goes to the Employees' Pension Scheme (EPS). The rest goes to your EPF.</li>
    <li>Interest (8.25% for FY 2025-26) is calculated monthly on the running balance and credited once a year.</li>
    <li>EPF interest is tax-free, except on your own contributions above ₹2.5 lakh a year.</li>
  </ul>`,
    faqs: [['What is the EPF interest rate?', '8.25% for FY 2025-26, the same as the previous two years. EPFO announces the rate every year.'],
      ['Is the EPS pension included here?', 'No. This calculator shows your EPF balance. The EPS part gives a separate monthly pension after 10 years of service.'],
      ['Can I withdraw EPF before retirement?', 'Partial withdrawals are allowed for a house, marriage, education, medical needs or after 2 months of unemployment. Withdrawing the full balance before 5 years of service makes it taxable.']]
  },
  {
    path: '/gratuity-calculator/', crumb: 'Gratuity Calculator', form: 'grat-form',
    title: 'Gratuity Calculator 2026 – Formula, Eligibility & Tax | LiveLifeTricks',
    description: 'Free gratuity calculator: find your gratuity amount with the 15/26 formula, check if you\'re eligible after 5 years, and see how much is tax-free (up to ₹20 lakh).',
    h1: 'Gratuity Calculator', lead: 'Find out how much gratuity you\'ll get when you leave or retire, and how much of it is tax-free.',
    badges: ['15/26 formula', 'Tax-free limit'],
    fields: money('salary', 'Last drawn monthly basic + DA', 50000, { range: [5000, 500000, 1000] }) +
      '<div class="row2">' + num('years', 'Years of service', 10, 'years', { max: 50 }) + num('months', 'Plus months', 7, 'months', { max: 11 }) + '</div>' +
      select('covered', 'Is your employer covered by the Gratuity Act?', [['yes', 'Yes (10+ employees, most companies)'], ['no', 'No']], { value: 'yes' }) +
      '<label class="check"><input type="checkbox" data-key="govt"> I\'m a government employee (₹25 lakh limit)</label>',
    results: `      <h2>Your gratuity</h2>\n      <div class="big" id="out-big">–</div>\n      <table class="kv" id="grat-kv" style="margin-top:12px"></table>`,
    content: `
  <h2>Gratuity formula</h2>
  <p class="formula">Gratuity = 15 × last salary × years of service ÷ 26</p>
  <ul>
    <li><strong>Last salary</strong> = last drawn basic + DA (monthly).</li>
    <li>For employers covered by the Act, a part-year of <strong>6 months or more counts as a full year</strong>.</li>
    <li>If your employer isn't covered, it's 15 ÷ 30 and only completed years count.</li>
  </ul>
  <p><strong>Example:</strong> basic + DA of ₹50,000 and 10 years 7 months of service: 15 × 50,000 × 11 ÷ 26 = <strong>₹3,17,308</strong>.</p>
  <h2>Tax on gratuity</h2>
  <p>For private sector employees, gratuity up to <strong>₹20 lakh</strong> in a lifetime is tax-free. Government employees' gratuity is fully tax-free. Anything above the limit is added to your income.</p>`,
    faqs: [['Do I get gratuity before 5 years?', 'Usually not. 5 years of continuous service is needed, and courts have accepted 4 years 240 days in many cases. The 5-year rule doesn\'t apply on death or disability.'],
      ['Is there a maximum gratuity?', 'Under the Payment of Gratuity Act, the maximum payable is ₹20 lakh. Employers can choose to pay more.'],
      ['Is gratuity part of my CTC?', 'Many companies include it in CTC (about 4.81% of basic), even though you only receive it after 5 years.']]
  },
  {
    path: '/capital-gains-tax-calculator/', crumb: 'Capital Gains Tax Calculator', form: 'cg-form',
    title: 'Capital Gains Tax Calculator – Shares & Mutual Funds (2026) | LiveLifeTricks',
    description: 'Free capital gains tax calculator for shares and mutual funds: STCG 20%, LTCG 12.5% above ₹1.25 lakh, debt funds at slab rate, and grandfathering for pre-2018 shares.',
    h1: 'Capital Gains Tax Calculator', lead: 'Selling shares or mutual funds? See whether your gain is short or long term, how much is tax-free, and the exact tax.',
    badges: ['Current rates (post July 2024)', 'Grandfathering', 'Debt & gold funds'],
    fields: select('asset', 'What did you sell?', [['equity', 'Listed shares / equity mutual funds'], ['debt', 'Debt mutual fund (bought from April 2023)'], ['listedOther', 'Gold or silver ETF / other listed units'], ['other', 'Other funds (gold or international fund of funds, older debt funds)']], { value: 'equity' }) +
      '<div class="row2">' + date('buyDate', 'Bought on', '2023-01-10') + date('sellDate', 'Sold on', new Date().toISOString().slice(0, 10)) + '</div>' +
      '<div class="row2">' + money('buy', 'Total purchase cost', 500000) + money('sell', 'Total sale value', 800000) + '</div>' +
      money('expenses', 'Brokerage & other charges', '', { hint: 'Optional.' }) +
      money('fmv2018', 'Value on 31 January 2018', '', { id: 'fmv-field', hint: 'For shares bought before February 2018: the highest price on 31 Jan 2018 × quantity.' }) +
      money('otherLtcg', 'Other equity LTCG already this year', '', { id: 'ltcg-field', hint: 'The ₹1.25 lakh tax-free limit is shared across all your sales in the year.' }) +
      select('slab', 'Your income tax slab rate', [['0', '0%'], ['5', '5%'], ['10', '10%'], ['15', '15%'], ['20', '20%'], ['25', '25%'], ['30', '30%']], { id: 'slab-field', value: '30' }),
    results: `      <h2>Tax on this sale</h2>\n      <div class="big" id="out-big">–</div>\n      <p class="muted small" id="out-kind" style="margin:6px 0 0"></p>\n      <table class="kv" id="cg-kv" style="margin-top:12px"></table>\n      <div class="tip" id="cg-tip" hidden></div>`,
    content: `
  <h2>Capital gains tax rates (sales from 23 July 2024)</h2>
  <table>
    <thead><tr><th>What you sell</th><th>Long term if held</th><th>Short-term tax</th><th>Long-term tax</th></tr></thead>
    <tbody>
      <tr><td>Listed shares, equity funds</td><td>Over 12 months</td><td>20%</td><td>12.5% above ₹1.25 lakh a year</td></tr>
      <tr><td>Debt funds bought from April 2023</td><td>Never</td><td colspan="2">Slab rate, however long you hold</td></tr>
      <tr><td>Gold / silver ETFs, other listed units</td><td>Over 12 months</td><td>Slab rate</td><td>12.5%</td></tr>
      <tr><td>Other funds (gold or international FoFs)</td><td>Over 24 months</td><td>Slab rate</td><td>12.5%</td></tr>
    </tbody>
  </table>
  <p>Add 4% cess, and surcharge for very high incomes. The section 87A rebate doesn't cover these special rates.</p>
  <h2>Grandfathering for shares bought before February 2018</h2>
  <p>Gains made up to 31 January 2018 are protected. Your cost is the <em>higher</em> of what you paid and the 31 January 2018 value (but not more than the sale price).</p>`,
    faqs: [['How can I save tax on long-term gains?', 'Use the ₹1.25 lakh yearly exemption fully: sell some equity units with gains each year and buy them back ("tax harvesting"). Losses can also offset gains.'],
      ['Are SIP units taxed together?', 'No. Each SIP instalment is a separate purchase with its own 12-month clock. Units bought first are sold first.'],
      ['Do I pay this tax while selling?', 'No TDS for residents. You pay it as advance tax during the year, or with your return. Report it in schedule CG of ITR-2 or ITR-3.']]
  },
  {
    path: '/home-loan-eligibility-calculator/', crumb: 'Home Loan Eligibility', form: 'hle-form',
    title: 'Home Loan Eligibility Calculator – How Much Can I Borrow? | LiveLifeTricks',
    description: 'Free home loan eligibility calculator: find the loan amount you can get on your salary, the EMI banks allow, your property budget and down payment, with RBI loan-to-value limits.',
    h1: 'Home Loan Eligibility Calculator', lead: 'Find out how much home loan you can get on your income, and what property budget that gives you.',
    badges: ['Bank FOIR rule', 'RBI loan-to-value limits', 'Co-applicant'],
    fields: money('income', 'Your net monthly income', 100000, { hint: 'In-hand salary or monthly business income.', range: [15000, 1000000, 5000] }) +
      money('coIncome', 'Co-applicant\'s net monthly income', '', { hint: 'Optional, e.g. spouse.' }) +
      money('otherEmis', 'Existing EMIs (car, personal loan, etc.)', '', { hint: 'Optional.' }) +
      '<div class="row2">' + num('rate', 'Interest rate', 8.5, '% p.a.', { min: 5, max: 15, step: 0.05 }) + num('tenure', 'Loan tenure', 20, 'years', { min: 5, max: 30 }) + '</div>' +
      '<div class="row2">' + num('age', 'Your age', 30, 'years', { min: 21, max: 65, hint: 'Most banks want the loan repaid by 60–65.' }) + num('foir', 'Share of income for EMIs', 50, '%', { min: 30, max: 70, hint: 'Banks usually allow 40–55%.' }) + '</div>',
    results: `      <h2>You can borrow about</h2>\n      <div class="big" id="out-big">–</div>\n      <table class="kv" id="hle-kv" style="margin-top:12px"></table>`,
    content: `
  <h2>How banks decide your home loan amount</h2>
  <ul>
    <li><strong>FOIR (Fixed Obligation to Income Ratio):</strong> all your EMIs together, including the new one, are usually capped at 40–55% of your net monthly income.</li>
    <li><strong>Tenure and age:</strong> the loan must usually be repaid by 60 (salaried) or 65–70 (self-employed). Older borrowers get shorter tenures and smaller loans.</li>
    <li><strong>Loan-to-value (RBI):</strong> banks lend up to 90% of the property value for loans up to ₹30 lakh, 80% up to ₹75 lakh, and 75% above that. The rest is your down payment.</li>
    <li><strong>Credit score:</strong> 750+ gets the best rates and the highest eligibility.</li>
  </ul>
  <h2>How to increase your eligibility</h2>
  <ul>
    <li>Add an earning co-applicant (spouse or parent).</li>
    <li>Close small loans and credit card dues first.</li>
    <li>Choose a longer tenure: the EMI falls, so you qualify for more.</li>
  </ul>`,
    faqs: [['How much home loan can I get on a ₹50,000 salary?', 'With no other EMIs, at 8.5% for 20 years and 50% FOIR, about ₹28.8 lakh. Change the numbers above for your case.'],
      ['Do registration and stamp duty count in the loan?', 'No. Banks don\'t fund stamp duty and registration (about 6–8% of the property value in most states), so keep that ready on top of the down payment.'],
      ['Does the lender consider my bonus?', 'Usually only fixed monthly income. Some banks partly count regular bonuses or rental income.']]
  },
  {
    path: '/retirement-calculator/', crumb: 'Retirement & FIRE Planner', form: 'ret-form',
    title: 'Retirement Calculator & FIRE Planner – How Much Do I Need? | LiveLifeTricks',
    description: 'Free retirement calculator for India: find the corpus you need to retire, the monthly SIP to build it, and your FIRE number, adjusted for inflation.',
    h1: 'Retirement & FIRE Planner', lead: 'How much do you need to retire comfortably, and how much should you invest every month to get there?',
    badges: ['Inflation-adjusted', 'Monthly SIP needed', 'FIRE number'],
    fields: '<div class="row2">' + num('age', 'Your age', 30, 'years', { min: 18, max: 70 }) + num('retireAge', 'Retire at', 60, 'years', { min: 30, max: 80 }) + '</div>' +
      num('life', 'Plan until age', 85, 'years', { min: 60, max: 100 }) +
      money('expense', 'Monthly expenses today', 50000, { hint: 'What you\'d spend in retirement, in today\'s money.', range: [10000, 500000, 5000] }) +
      '<div class="row2">' + num('inflation', 'Inflation', 6, '% p.a.', { max: 15, step: 0.5 }) + num('preReturn', 'Return before retirement', 12, '% p.a.', { max: 20, step: 0.5 }) + '</div>' +
      num('postReturn', 'Return after retirement', 7, '% p.a.', { max: 15, step: 0.5, hint: 'Usually lower, as you\'ll move to safer investments.' }) +
      money('savings', 'Retirement savings so far', 500000, { hint: 'PF, PPF, mutual funds, etc.' }),
    results: `      <h2>Corpus you need</h2>\n      <div class="big" id="out-big">–</div>\n      <div class="stats">${stat('out-sip', 'Monthly SIP needed')}</div>\n      <table class="kv" id="ret-kv"></table>`,
    content: `
  <h2>How this is worked out</h2>
  <ul>
    <li>Your expenses grow with inflation until you retire, and keep growing after.</li>
    <li>The corpus must pay those rising expenses every year until the age you plan for, while the rest keeps earning the after-retirement return.</li>
    <li>Your existing savings grow at the before-retirement return; the SIP covers the gap.</li>
  </ul>
  <h2>What is the FIRE number?</h2>
  <p>FIRE (Financial Independence, Retire Early) followers aim for <strong>25 times their yearly expenses</strong>, based on withdrawing 4% a year. In India, higher inflation means many planners suggest 30–35 times to be safe.</p>`,
    faqs: [['How much do I need to retire in India?', 'It depends on your expenses. Someone spending ₹50,000 a month today at 30, retiring at 60, needs several crore because of 30 years of inflation. Enter your numbers above.'],
      ['What return should I assume?', 'For a mix mostly in equity funds before retirement, 10–12% is common. After retirement, 6–8% from safer investments.'],
      ['Should I count my house?', 'Only if you\'ll sell it or rent it out. The house you live in doesn\'t pay your expenses.']]
  },
  {
    path: '/inflation-calculator/', crumb: 'Inflation Calculator', form: 'inf-form', table: 'inf-table', tableTitle: 'Effect of inflation over time',
    title: 'Inflation Calculator India – Future Value & Purchasing Power | LiveLifeTricks',
    description: 'Free inflation calculator: see what things will cost in future and how much today\'s money will really be worth, at any inflation rate.',
    h1: 'Inflation Calculator', lead: 'See what today\'s prices will become in future, or how much your money will really be worth after inflation.',
    badges: ['Future cost', 'Purchasing power'],
    fields: '<div class="field"><span class="label" id="mode-label">I want to know</span><div class="seg" role="group" aria-labelledby="mode-label" data-key="mode" data-value="future">' +
      '<button type="button" data-value="future" aria-pressed="true">Future cost</button><button type="button" data-value="past" aria-pressed="false">What my money will be worth</button></div></div>' +
      money('amount', 'Amount', 100000, { range: [1000, 10000000, 1000] }) +
      '<div class="row2">' + num('rate', 'Inflation rate', 6, '% p.a.', { max: 20, step: 0.1, hint: 'India\'s retail inflation has averaged about 5–6% a year over the last decade.' }) + num('years', 'Years', 10, 'years', { min: 1, max: 60 }) + '</div>',
    results: `      <h2 id="out-label">Result</h2>\n      <div class="big" id="out-big">–</div>\n      <p class="muted small" id="out-sub"></p>\n      <div class="stats">${stat('out-loss', 'Value lost to inflation')}</div>`,
    content: `
  <h2>Why inflation matters</h2>
  <p>At 6% inflation, prices <strong>double in about 12 years</strong>. Money in a savings account earning 3% loses value every year. That's why long-term goals like education and retirement need investments that beat inflation.</p>
  <p class="formula">Future cost = Today's cost × (1 + inflation)<sup>years</sup></p>
  <h2>Quick rule of 72</h2>
  <p>Divide 72 by the inflation rate to see how many years it takes for prices to double: 72 ÷ 6 = 12 years.</p>`,
    faqs: [['What is the inflation rate in India?', 'Retail (CPI) inflation changes every month. Over the last decade it has averaged roughly 5–6% a year. For long-term planning, 6% is a common assumption.'],
      ['How do I beat inflation?', 'Investments like equity mutual funds have historically beaten inflation over long periods. FDs and savings accounts often only just keep up, or fall behind after tax.']]
  },
  {
    path: '/land-area-converter/', crumb: 'Land Area Converter', form: 'land-form', table: 'land-table', tableTitle: 'Converted to every unit',
    scripts: ['land-units.js', 'more-calcs.js'],
    title: 'Land Area Converter – Bigha, Gaj, Guntha, Cent, Kanal by State | LiveLifeTricks',
    description: 'Free land area converter for India: convert bigha, biswa, katha, gaj, guntha, cent, ground, ankanam, kanal, marla, acre, hectare and sq ft, with state-wise bigha and katha sizes.',
    h1: 'Land Area Converter', lead: 'Convert any land measurement used in India, including bigha and katha, whose size changes from state to state.',
    badges: ['State-wise bigha & katha', '20+ units'],
    fields: '<div class="row2">' + '\n        <div class="field"><label for="l-state">State</label><select id="l-state" data-key="state"></select></div>' +
      '\n        <div class="field"><label for="l-from">Unit</label><select id="l-from" data-key="from"></select></div></div>' +
      num('value', 'Area', 1, '', { min: 0, max: 100000000, step: 'any' }) +
      money('customBigha', 'Your local bigha size in sq ft', '', { id: 'custom-bigha-field', hint: 'Optional. Bigha size can differ even between districts. Biswa and katha follow it.' }),
    results: `      <h2>Equals</h2>\n      <div class="big" id="out-big">–</div>\n      <p class="muted small" id="out-sub"></p>`,
    content: `
  <h2>Common land units in India</h2>
  <table>
    <thead><tr><th>Unit</th><th>Size</th><th>Used in</th></tr></thead>
    <tbody>
      <tr><td>Square yard (gaj)</td><td>9 sq ft</td><td>All India, plots</td></tr>
      <tr><td>Cent / decimal</td><td>435.6 sq ft (1/100 acre)</td><td>Kerala, Tamil Nadu, Karnataka, Andhra, Bihar, Odisha, Bengal</td></tr>
      <tr><td>Guntha</td><td>1,089 sq ft (121 sq yd)</td><td>Maharashtra, Karnataka, Telangana, Gujarat</td></tr>
      <tr><td>Ground</td><td>2,400 sq ft</td><td>Tamil Nadu</td></tr>
      <tr><td>Ankanam</td><td>72 sq ft</td><td>Andhra Pradesh, Telangana</td></tr>
      <tr><td>Marla / Kanal</td><td>272.25 / 5,445 sq ft</td><td>Punjab, Haryana, Himachal, J&amp;K</td></tr>
      <tr><td>Bigha</td><td>6,804 to 27,225 sq ft, depending on state</td><td>North and east India</td></tr>
    </tbody>
  </table>
  <p><strong>Important:</strong> bigha, biswa and katha sizes differ between states and sometimes between districts. Check the value used in your land records with the local tehsil or revenue office before buying or selling.</p>`,
    faqs: [['How many square feet are in 1 bigha?', 'It depends on the state: about 27,000 in Uttar Pradesh, 27,225 in Rajasthan, 14,400 in West Bengal and Assam, 17,424 in Gujarat, 12,000 in Madhya Pradesh, 9,070 in Punjab and 6,804 in Uttarakhand (commonly used values).'],
      ['How many guntha make an acre?', '40 guntha = 1 acre.'],
      ['How many cents make an acre?', '100 cents = 1 acre.']]
  }
];

module.exports = function () { return PAGES.map(page); };
