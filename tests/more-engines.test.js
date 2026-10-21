// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const Fin = require('../src/assets/js/finance-engines.js');
const Salary = require('../src/assets/js/salary-engine.js');

const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('SIP: ₹10,000 a month at 12% for 10 years', () => {
  const r = Fin.sip({ monthly: 10000, annualRate: 12, years: 10 });
  assert.equal(r.invested, 1200000);
  near(r.value, 2323391);
  assert.equal(r.rows.length, 10);
});

test('SIP step-up grows the instalment every year', () => {
  const r = Fin.sip({ monthly: 10000, annualRate: 12, years: 3, stepUp: 10 });
  assert.equal(r.rows[1].monthly, 11000);
  near(r.invested, 120000 + 132000 + 145200, 0.01);
});

test('SIP goal is the inverse of SIP value', () => {
  const m = Fin.sipForGoal({ target: 2323391, annualRate: 12, years: 10 });
  near(m, 10000);
});

test('lumpsum compounds yearly', () => {
  near(Fin.lumpsum({ amount: 100000, annualRate: 10, years: 2 }).value, 121000, 0.01);
});

test('FD: ₹1 lakh at 7% for 5 years, quarterly', () => {
  near(Fin.fd({ principal: 100000, annualRate: 7, months: 60, compounding: 4 }).maturity, 141478);
});

test('RD: ₹5,000 a month at 7% for 12 months', () => {
  const r = Fin.rd({ monthly: 5000, annualRate: 7, months: 12 });
  assert.equal(r.invested, 60000);
  // Bank formula: R × ((1+i)^n − 1) ÷ (1 − (1+i)^(−1/3)), i = rate/400, n = quarters
  near(r.maturity, 62310.66, 0.01);
});

test('PPF: ₹1.5 lakh a year at 7.1% for 15 years', () => {
  const r = Fin.ppf({ yearly: 150000, annualRate: 7.1, years: 15 });
  assert.equal(r.invested, 2250000);
  near(r.maturity, 4068209);
  assert.equal(Fin.ppf({ yearly: 200000, annualRate: 7.1 }).capped, true);
});

test('GST add and remove', () => {
  const a = Fin.gst({ amount: 1000, rate: 18, mode: 'add' });
  assert.equal(a.total, 1180);
  assert.equal(a.cgst, 90);
  const r = Fin.gst({ amount: 1180, rate: 18, mode: 'remove' });
  near(r.base, 1000, 0.001);
  near(r.gst, 180, 0.001);
});

test('salary: ₹12 lakh CTC, capped PF, gratuity in CTC', () => {
  const s = Salary.inHand({ ctc: 1200000, basicPct: 50, pfMode: 'capped', gratuityInCtc: true, professionalTax: 2400, regime: 'best' });
  assert.equal(s.employerPF, 21600);
  near(s.gratuity, 28860, 0.01);
  near(s.gross, 1149540, 0.01);
  assert.equal(s.tax, 0);
  near(s.monthlyInHand, 93795, 0.01);
});

test('salary: variable pay is left out of monthly in-hand', () => {
  const a = Salary.inHand({ ctc: 2000000, basicPct: 40, pfMode: 'full', professionalTax: 2400, regime: 'new' });
  const b = Salary.inHand({ ctc: 2000000, variable: 200000, basicPct: 40, pfMode: 'full', professionalTax: 2400, regime: 'new' });
  assert.ok(b.monthlyInHand < a.monthlyInHand);
  assert.ok(a.tax > 0);
});
