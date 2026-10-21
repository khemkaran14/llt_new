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

  var api = { sip: sip, lumpsum: lumpsum, sipForGoal: sipForGoal, fd: fd, rd: rd, ppf: ppf, gst: gst };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Fin = api;
})(this);
