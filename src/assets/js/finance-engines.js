/*
 * Engines for the SIP, FD, RD, PPF and GST calculators.
 * Works in the browser (window.Fin) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  function n(v) { var x = Number(v); return isFinite(x) && x > 0 ? x : 0; }

  /*
   * SIP with optional yearly step-up. Each instalment is invested at the
   * start of the month and grows at annualRate / 12 per month (the method
   * most Indian fund houses and apps use).
   */
  function sip(o) {
    var monthly = n(o.monthly), rate = n(o.annualRate), years = Math.round(n(o.years));
    var step = n(o.stepUp) / 100, i = rate / 12 / 100;
    var balance = 0, invested = 0, amount = monthly, rows = [];
    for (var y = 1; y <= years; y++) {
      for (var m = 0; m < 12; m++) {
        balance = (balance + amount) * (1 + i);
        invested += amount;
      }
      rows.push({ year: y, monthly: amount, invested: invested, value: balance });
      amount = amount * (1 + step);
    }
    return { invested: invested, value: balance, gains: balance - invested, rows: rows };
  }

  // One-time investment compounded yearly.
  function lumpsum(o) {
    var p = n(o.amount), r = n(o.annualRate) / 100, years = Math.round(n(o.years)), rows = [];
    for (var y = 1; y <= years; y++) rows.push({ year: y, invested: p, value: p * Math.pow(1 + r, y) });
    var value = p * Math.pow(1 + r, years);
    return { invested: p, value: value, gains: value - p, rows: rows };
  }

  // Monthly SIP needed to reach a target amount.
  function sipForGoal(o) {
    var target = n(o.target), i = n(o.annualRate) / 12 / 100, months = Math.round(n(o.years) * 12);
    if (!months) return 0;
    if (!i) return target / months;
    return target / ((Math.pow(1 + i, months) - 1) / i * (1 + i));
  }

  /*
   * Fixed deposit. Banks in India compound quarterly for cumulative FDs.
   * compounding: periods per year (4 = quarterly, 12 = monthly, 1 = yearly).
   */
  function fd(o) {
    var p = n(o.principal), r = n(o.annualRate) / 100, months = Math.round(n(o.months));
    var k = n(o.compounding) || 4;
    var t = months / 12;
    var maturity = p * Math.pow(1 + r / k, k * t);
    var rows = [];
    for (var y = 1; y <= Math.ceil(t); y++) {
      var ty = Math.min(y, t);
      rows.push({ year: y, value: p * Math.pow(1 + r / k, k * ty) });
    }
    return {
      principal: p, maturity: maturity, interest: maturity - p,
      effectiveYield: t > 0 ? Math.pow(1 + r / k, k) - 1 : 0,
      rows: rows
    };
  }

  /*
   * Recurring deposit with quarterly compounding (standard bank formula):
   * each instalment earns compound interest for the months it stays invested.
   */
  function rd(o) {
    var dep = n(o.monthly), r = n(o.annualRate) / 100, months = Math.round(n(o.months));
    var maturity = 0;
    for (var k = 1; k <= months; k++) {
      var monthsLeft = months - k + 1;
      maturity += dep * Math.pow(1 + r / 4, monthsLeft / 3);
    }
    var invested = dep * months;
    return { invested: invested, maturity: maturity, interest: maturity - invested };
  }

  /*
   * PPF: yearly deposit made before 5 April earns interest for the full year,
   * compounded yearly. 15-year lock-in, extendable in blocks of 5 years.
   */
  function ppf(o) {
    var dep = Math.min(n(o.yearly), 150000), r = n(o.annualRate) / 100, years = Math.round(n(o.years)) || 15;
    var balance = 0, invested = 0, rows = [];
    for (var y = 1; y <= years; y++) {
      var opening = balance;
      var interest = (opening + dep) * r;
      balance = opening + dep + interest;
      invested += dep;
      rows.push({ year: y, opening: opening, deposit: dep, interest: interest, closing: balance });
    }
    return { invested: invested, maturity: balance, interest: balance - invested, rows: rows, capped: n(o.yearly) > 150000 };
  }

  /*
   * GST. mode 'add' treats amount as the price before GST; 'remove' treats it
   * as the price including GST.
   */
  function gst(o) {
    var amount = n(o.amount), rate = n(o.rate) / 100;
    var base, tax;
    if (o.mode === 'remove') { base = amount / (1 + rate); tax = amount - base; }
    else { base = amount; tax = amount * rate; }
    return { base: base, gst: tax, total: base + tax, cgst: tax / 2, sgst: tax / 2, igst: tax };
  }

  /*
   * Prepay a loan or invest the same money?
   * Both plans spend exactly the same each month (EMI + extra) for the
   * remaining tenure, so the one with more money at the end wins.
   *  A (prepay): extra goes to the loan; once it's closed, the whole
   *              EMI + extra is invested every month.
   *  B (invest): pay the normal EMI and invest the extra every month.
   * o: { balance, loanRate, months, extra, lumpsum, investReturn, gainsTax (%) }
   */
  function prepayVsInvest(o) {
    var bal0 = n(o.balance), months = Math.round(n(o.months)), extra = n(o.extra), lump = n(o.lumpsum);
    var li = n(o.loanRate) / 12 / 100, ii = n(o.investReturn) / 12 / 100, tax = n(o.gainsTax) / 100;
    var emi = 0;
    if (bal0 > 0 && months > 0) emi = li ? bal0 * li * Math.pow(1 + li, months) / (Math.pow(1 + li, months) - 1) : bal0 / months;

    var a = { loan: Math.max(0, bal0 - lump), corpus: Math.max(0, lump - bal0), put: Math.max(0, lump - bal0), interest: 0, closedAt: null };
    var b = { loan: bal0, corpus: lump, put: lump, interest: 0 };
    var series = [{ m: 0, a: a.corpus - a.loan, b: b.corpus - b.loan }];
    if (a.loan === 0) a.closedAt = 0;

    for (var m = 1; m <= months; m++) {
      // A: prepay
      var budget = emi + extra;
      a.corpus *= 1 + ii;
      if (a.loan > 0) {
        var intA = a.loan * li;
        a.interest += intA;
        var payA = Math.min(budget, a.loan + intA);
        a.loan = a.loan + intA - payA;
        if (a.loan < 0.005) { a.loan = 0; if (a.closedAt == null) a.closedAt = m; }
        budget -= payA;
      }
      a.corpus += budget; a.put += budget;
      // B: invest the extra
      b.corpus *= 1 + ii;
      if (b.loan > 0) {
        var intB = b.loan * li;
        b.interest += intB;
        var payB = Math.min(emi, b.loan + intB);
        b.loan = b.loan + intB - payB;
        if (b.loan < 0.005) b.loan = 0;
        b.corpus += emi - payB; b.put += emi - payB;
      }
      b.corpus += extra; b.put += extra;
      if (m % 12 === 0 || m === months) series.push({ m: m, a: a.corpus - a.loan, b: b.corpus - b.loan });
    }
    var afterTax = function (x) { return x.corpus - Math.max(0, x.corpus - x.put) * tax; };
    var finalA = afterTax(a), finalB = afterTax(b);
    return {
      emi: emi,
      prepay: { interest: a.interest, closedAt: a.closedAt, corpus: a.corpus, final: finalA },
      invest: { interest: b.interest, corpus: b.corpus, final: finalB },
      winner: finalA >= finalB ? 'prepay' : 'invest',
      difference: Math.abs(finalA - finalB),
      series: series
    };
  }

  // Investment return at which both plans end up equal.
  function breakEvenReturn(o) {
    var lo = 0, hi = 40;
    var diff = function (r) { var q = {}; for (var k in o) q[k] = o[k]; q.investReturn = r; var x = prepayVsInvest(q); return x.invest.final - x.prepay.final; };
    if (diff(hi) < 0) return null;
    for (var i = 0; i < 50; i++) { var mid = (lo + hi) / 2; if (diff(mid) < 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  var api = { sip: sip, lumpsum: lumpsum, sipForGoal: sipForGoal, fd: fd, rd: rd, ppf: ppf, gst: gst, prepayVsInvest: prepayVsInvest, breakEvenReturn: breakEvenReturn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Fin = api;
})(this);
