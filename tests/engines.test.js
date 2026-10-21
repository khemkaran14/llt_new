// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const Tax = require('../src/assets/js/tax-engine.js');
const Emi = require('../src/assets/js/emi-engine.js');

const tax = (p, regime) => Tax.compute(Object.assign({ fy: '2026-27', age: '<60' }, p), regime);

test('new regime: 12.75 lakh salary pays zero tax', () => {
  const r = tax({ salary: 1275000 }, 'new');
  assert.equal(r.taxableIncome, 1200000);
  assert.equal(r.totalTax, 0);
});

test('new regime: marginal relief just above 12 lakh', () => {
  const r = tax({ salary: 1300000 }, 'new');
  assert.equal(r.taxableIncome, 1225000);
  assert.equal(r.slabTax, 63750);
  assert.equal(r.marginalRelief, 38750);
  assert.equal(r.totalTax, 26000);
});

test('new regime: 20 lakh and 24 lakh taxable', () => {
  assert.equal(tax({ salary: 2075000 }, 'new').totalTax, 208000);
  assert.equal(tax({ otherIncome: 2400000 }, 'new').totalTax, 312000);
});

test('old regime: 10 lakh taxable, below 60 and senior', () => {
  assert.equal(tax({ salary: 1050000 }, 'old').totalTax, 117000);
  assert.equal(tax({ salary: 1050000, age: '60-80' }, 'old').totalTax, 114400);
  assert.equal(tax({ salary: 1050000, age: '80+' }, 'old').totalTax, 104000);
});

test('old regime: 87A rebate up to 5 lakh', () => {
  assert.equal(tax({ salary: 550000 }, 'old').totalTax, 0);
  assert.ok(tax({ salary: 560000 }, 'old').totalTax > 0);
});

test('old regime deductions are capped', () => {
  const r = tax({ salary: 2000000, d80C: 300000, d80CCD1B: 90000, d80DSelf: 60000, homeLoanInterest: 500000 }, 'old');
  assert.equal(r.deductions.d80C, 150000);
  assert.equal(r.deductions.d80CCD1B, 50000);
  assert.equal(r.deductions.d80DSelf, 25000);
  assert.equal(r.homeLoanInterest, 200000);
  // 20L - 50k std - 2L home loan - 2.25L ded = 15.25L
  assert.equal(r.taxableIncome, 1525000);
});

test('new regime ignores old-regime deductions but allows employer NPS', () => {
  const r = tax({ salary: 2000000, basicDA: 1000000, d80C: 150000, employerNPS: 200000 }, 'new');
  assert.equal(r.deductions.employerNPS, 140000);
  assert.equal(r.taxableIncome, 2000000 - 75000 - 140000);
});

test('surcharge and its marginal relief', () => {
  const at60 = tax({ otherIncome: 6000000 }, 'new');
  assert.equal(at60.surcharge, 138000);
  assert.equal(at60.totalTax, 1578720);
  const at51 = tax({ otherIncome: 5100000 }, 'new');
  assert.equal(at51.surcharge, 70000);
  assert.equal(at51.totalTax, 1227200);
});

test('HRA metro list depends on financial year', () => {
  const p = { basicDA: 600000, hraReceived: 300000, rentPaid: 360000, city: 'bengaluru' };
  assert.equal(Tax.hraExemption(p, '2026-27').exempt, 300000);
  assert.equal(Tax.hraExemption(p, '2025-26').exempt, 240000);
});

test('compare picks the cheaper regime and finds break-even', () => {
  const c = Tax.compare({ fy: '2026-27', age: '<60', salary: 1500000 });
  assert.equal(c.better, 'new');
  assert.ok(c.breakEven > 0);
  const p = { fy: '2026-27', age: '<60', salary: 1500000, otherDeductions: c.breakEven };
  const c2 = Tax.compare(p);
  assert.ok(c2.old.totalTax <= c2.new.totalTax);
});

test('EMI formula matches known value', () => {
  assert.equal(Emi.emi(100000, 10, 12).toFixed(2), '8791.59');
  assert.equal(Emi.emi(120000, 0, 12), 10000);
});

test('schedule repays the full principal', () => {
  const s = Emi.schedule({ principal: 5000000, annualRate: 8.5, months: 240, startYear: 2026, startMonth: 0 });
  assert.equal(s.months, 240);
  const paid = s.rows.reduce((a, r) => a + r.principal, 0);
  assert.ok(Math.abs(paid - 5000000) < 1);
  assert.equal(s.rows[s.rows.length - 1].balance, 0);
  assert.equal(s.years.length, 20);
});

test('extra payment saves interest and months', () => {
  const r = Emi.withExtra({ principal: 5000000, annualRate: 8.5, months: 240, extraMonthly: 5000 });
  assert.ok(r.interestSaved > 0);
  assert.ok(r.monthsSaved > 0);
});

test('affordable loan is the inverse of EMI', () => {
  const e = Emi.emi(3000000, 9, 180);
  assert.ok(Math.abs(Emi.affordableLoan(e, 9, 180) - 3000000) < 0.01);
});
