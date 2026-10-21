/*
 * Loan EMI engine: EMI, amortization schedule and extra-payment savings.
 * Works in the browser (window.EmiEngine) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  function emi(principal, annualRate, months) {
    if (principal <= 0 || months <= 0) return 0;
    var r = annualRate / 12 / 100;
    if (r === 0) return principal / months;
    var f = Math.pow(1 + r, months);
    return principal * r * f / (f - 1);
  }

  /*
   * opts: { principal, annualRate, months, extraMonthly, startYear, startMonth (0-11) }
   * Extra payments go straight to principal and shorten the tenure; the EMI stays the same.
   */
  function schedule(opts) {
    var P = Math.max(0, Number(opts.principal) || 0);
    var rate = Math.max(0, Number(opts.annualRate) || 0);
    var months = Math.max(0, Math.round(Number(opts.months) || 0));
    var extra = Math.max(0, Number(opts.extraMonthly) || 0);
    var r = rate / 12 / 100;
    var e = emi(P, rate, months);
    var startYear = opts.startYear || new Date().getFullYear();
    var startMonth = opts.startMonth != null ? opts.startMonth : new Date().getMonth();

    var balance = P, rows = [], totalInterest = 0, totalPaid = 0;
    for (var i = 0; i < months && balance > 0.005; i++) {
      var interest = balance * r;
      var principalPart = Math.min(balance, e - interest);
      var extraPart = Math.min(extra, balance - principalPart);
      var payment = interest + principalPart + extraPart;
      balance -= principalPart + extraPart;
      if (balance < 0.005) balance = 0;
      totalInterest += interest;
      totalPaid += payment;
      var m = startMonth + i;
      rows.push({
        n: i + 1,
        year: startYear + Math.floor(m / 12),
        month: m % 12,
        payment: payment,
        principal: principalPart + extraPart,
        interest: interest,
        balance: balance
      });
    }

    var years = [], byYear = {};
    rows.forEach(function (row) {
      var y = byYear[row.year];
      if (!y) {
        y = byYear[row.year] = { year: row.year, principal: 0, interest: 0, payment: 0, balance: 0, months: [] };
        years.push(y);
      }
      y.principal += row.principal;
      y.interest += row.interest;
      y.payment += row.payment;
      y.balance = row.balance;
      y.months.push(row);
    });

    return {
      emi: e,
      months: rows.length,
      totalInterest: totalInterest,
      totalPayment: totalPaid,
      principal: P,
      rows: rows,
      years: years
    };
  }

  // Compare a loan with and without an extra monthly payment.
  function withExtra(opts) {
    var base = schedule({ principal: opts.principal, annualRate: opts.annualRate, months: opts.months, startYear: opts.startYear, startMonth: opts.startMonth });
    if (!(opts.extraMonthly > 0)) return { base: base, extra: null };
    var ex = schedule(opts);
    return {
      base: base,
      extra: ex,
      interestSaved: base.totalInterest - ex.totalInterest,
      monthsSaved: base.months - ex.months
    };
  }

  // Largest loan you can take for a given EMI.
  function affordableLoan(monthlyEmi, annualRate, months) {
    var r = annualRate / 12 / 100;
    if (months <= 0) return 0;
    if (r === 0) return monthlyEmi * months;
    var f = Math.pow(1 + r, months);
    return monthlyEmi * (f - 1) / (r * f);
  }

  var api = { emi: emi, schedule: schedule, withExtra: withExtra, affordableLoan: affordableLoan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EmiEngine = api;
})(this);
