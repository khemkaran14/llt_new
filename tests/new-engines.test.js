// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../src/assets/js/finance-engines.js');
const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);

test('Sukanya Samriddhi: ₹1.5 lakh a year at 8.2%', () => {
  const r = F.ssy({ yearly: 150000, annualRate: 8.2, girlAge: 1, startYear: 2026 });
  assert.equal(r.invested, 2250000);
  near(r.maturity, 7182119);
  assert.equal(r.rows.length, 21);
  assert.equal(r.rows[15].deposit, 0, 'no deposits after 15 years');
  assert.equal(r.maturityAge, 22);
});

test('NPS: pension is from at least 40% of the corpus', () => {
  const r = F.nps({ monthly: 5000, age: 30, retireAge: 60, annualReturn: 10, annuityPct: 40, annuityRate: 6 });
  assert.equal(r.invested, 5000 * 12 * 30);
  near(r.annuityCorpus, r.corpus * 0.4, 0.01);
  near(r.monthlyPension, r.annuityCorpus * 0.06 / 12, 0.01);
  assert.equal(F.nps({ monthly: 5000, age: 30, retireAge: 60, annualReturn: 10, annuityPct: 10, annuityRate: 6 }).annuityCorpus, r.annuityCorpus, 'minimum 40% by default');
  const pvt = F.nps({ monthly: 5000, age: 30, retireAge: 60, annualReturn: 10, annuityPct: 10, annuityRate: 6, minAnnuity: 20 });
  near(pvt.annuityCorpus, pvt.corpus * 0.2, 0.01);
  near(pvt.taxableLump, pvt.corpus * 0.2, 0.01);
});

test('EPF: employer share after ₹1,250 pension cap', () => {
  const r = F.epf({ basic: 30000, age: 57, retireAge: 58, annualRate: 0, hike: 0 });
  // employee 3,600 + employer (3,600 − 1,249.5) a month
  near(r.corpus, (3600 + 3600 - 1249.5) * 12, 0.01);
  const low = F.epf({ basic: 10000, age: 57, retireAge: 58, annualRate: 0 });
  near(low.corpus, (1200 + 1200 - 833) * 12, 0.01);
});

test('gratuity: covered vs not covered, and tax-free limit', () => {
  near(F.gratuity({ salary: 50000, years: 10, months: 7 }).amount, 50000 * 15 / 26 * 11, 0.01);
  near(F.gratuity({ salary: 50000, years: 10, months: 7, covered: false }).amount, 50000 * 15 / 30 * 10, 0.01);
  const big = F.gratuity({ salary: 300000, years: 25, months: 0 });
  assert.equal(big.exempt, 2000000);
  assert.ok(big.taxable > 0);
  assert.equal(F.gratuity({ salary: 50000, years: 3, months: 0 }).eligible, false);
});

test('capital gains: equity long and short term, debt at slab, grandfathering', () => {
  const lt = F.capitalGains({ asset: 'equity', buyDate: '2023-01-10', sellDate: '2026-06-10', buy: 500000, sell: 800000 });
  assert.equal(lt.longTerm, true);
  assert.equal(lt.total, 22750); // (3L − 1.25L) × 12.5% × 1.04
  const st = F.capitalGains({ asset: 'equity', buyDate: '2026-01-10', sellDate: '2026-06-10', buy: 100000, sell: 150000 });
  assert.equal(st.longTerm, false);
  assert.equal(st.total, 10400);
  const debt = F.capitalGains({ asset: 'debt', buyDate: '2023-06-01', sellDate: '2026-06-01', buy: 100000, sell: 130000, slabRate: 30 });
  assert.equal(debt.total, 9360);
  const gf = F.capitalGains({ asset: 'equity', buyDate: '2015-01-01', sellDate: '2026-06-01', buy: 100000, sell: 500000, fmv2018: 300000 });
  assert.equal(gf.cost, 300000);
  assert.equal(gf.gain, 200000);
  const other = F.capitalGains({ asset: 'other', buyDate: '2025-01-01', sellDate: '2026-06-01', buy: 100000, sell: 120000, slabRate: 20 });
  assert.equal(other.longTerm, false, '24 months needed for other funds');
});

test('home loan eligibility: FOIR, tenure cap by age, RBI LTV', () => {
  const r = F.homeLoanEligibility({ income: 100000, annualRate: 8.5, tenure: 20 });
  assert.equal(r.maxEmi, 50000);
  near(r.loan, F.affordableLoan(50000, 8.5, 240), 0.01);
  assert.equal(r.ltv, 0.8);
  const old = F.homeLoanEligibility({ income: 100000, annualRate: 8.5, tenure: 25, age: 50 });
  assert.equal(old.tenureYears, 10);
  assert.equal(old.tenureCapped, true);
  const small = F.homeLoanEligibility({ income: 30000, otherEmis: 5000, annualRate: 9, tenure: 20 });
  assert.equal(small.maxEmi, 10000);
  assert.equal(small.ltv, 0.9);
});

test('retirement and inflation basics', () => {
  const r = F.retirement({ age: 59, retireAge: 60, lifeExpectancy: 61, monthlyExpense: 10000, inflation: 0, preReturn: 0, postReturn: 0, savings: 0 });
  near(r.corpus, 120000, 0.01);
  assert.equal(r.fireNumberToday, 3000000);
  const i = F.inflation({ amount: 100000, rate: 6, years: 10 });
  near(i.future, 179084.77, 0.01);
  near(i.purchasingPower, 55839.48, 0.01);
});
