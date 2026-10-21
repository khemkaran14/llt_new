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

  /*
   * Sukanya Samriddhi: deposits for 15 years from opening, maturity 21 years
   * from opening, interest compounded yearly (deposit made before 5 April).
   */
  function ssy(o) {
    var dep = Math.min(n(o.yearly), 150000), r = n(o.annualRate) / 100, age = Math.round(n(o.girlAge));
    var start = Math.round(n(o.startYear)) || new Date().getFullYear();
    var bal = 0, invested = 0, rows = [];
    for (var y = 1; y <= 21; y++) {
      var d = y <= 15 ? dep : 0;
      var interest = (bal + d) * r;
      bal += d + interest;
      invested += d;
      rows.push({ year: start + y - 1, age: age + y - 1, deposit: d, interest: interest, balance: bal });
    }
    return { invested: invested, maturity: bal, interest: bal - invested, maturityYear: start + 21, maturityAge: age + 21, rows: rows, capped: n(o.yearly) > 150000 };
  }

  /*
   * NPS: monthly contributions (optionally rising each year) until retirement.
   * At retirement, part of the corpus must buy an annuity (pension): at least 20% for
   * non-government subscribers (rules from December 2025) or 40% for government employees.
   * The rest can be withdrawn; only up to 60% of the corpus is tax-free.
   */
  function nps(o) {
    var age = Math.round(n(o.age)), ret = Math.round(n(o.retireAge)) || 60, years = Math.max(0, ret - age);
    var i = n(o.annualReturn) / 12 / 100, step = n(o.stepUp) / 100, amt = n(o.monthly);
    var bal = n(o.current), invested = 0, rows = [];
    for (var y = 1; y <= years; y++) {
      for (var m = 0; m < 12; m++) { bal = (bal + amt) * (1 + i); invested += amt; }
      rows.push({ year: y, age: age + y, monthly: amt, invested: invested, value: bal });
      amt *= 1 + step;
    }
    var minPct = o.minAnnuity != null ? n(o.minAnnuity) : 40;
    var annPct = Math.min(100, Math.max(minPct, n(o.annuityPct) || minPct)) / 100;
    var annuityCorpus = bal * annPct;
    return {
      years: years, invested: invested, corpus: bal, gains: bal - invested - n(o.current),
      lumpSum: bal - annuityCorpus, annuityCorpus: annuityCorpus, annuityPct: annPct,
      taxFreeLump: Math.min(bal - annuityCorpus, bal * 0.6), taxableLump: Math.max(0, bal - annuityCorpus - bal * 0.6),
      monthlyPension: annuityCorpus * n(o.annuityRate) / 100 / 12, rows: rows
    };
  }

  /*
   * EPF: employee 12% of basic + DA; employer 12% of which 8.33% (on up to
   * ₹15,000 wages, i.e. max ₹1,250) goes to the pension scheme (EPS), the rest to EPF.
   * Interest is worked out monthly on the running balance and credited yearly.
   */
  function epf(o) {
    var basic = n(o.basic), age = Math.round(n(o.age)), ret = Math.round(n(o.retireAge)) || 58;
    var r = n(o.annualRate) / 100, hike = n(o.hike) / 100, years = Math.max(0, ret - age);
    var bal = n(o.current), contributed = 0, rows = [];
    for (var y = 1; y <= years; y++) {
      var eps = Math.min(basic, 15000) * 0.0833;
      var monthlyIn = basic * 0.12 + (basic * 0.12 - eps);
      var yearInterest = 0;
      for (var m = 1; m <= 12; m++) {
        bal += monthlyIn;
        yearInterest += bal * r / 12;
      }
      bal += yearInterest;
      contributed += monthlyIn * 12;
      rows.push({ year: y, age: age + y, basic: basic, employee: basic * 0.12 * 12, employer: (basic * 0.12 - eps) * 12, interest: yearInterest, balance: bal });
      basic *= 1 + hike;
    }
    return { years: years, corpus: bal, contributed: contributed, interest: bal - contributed - n(o.current), rows: rows };
  }

  /*
   * Gratuity. Covered by the Gratuity Act: 15/26 × last monthly basic+DA × years
   * (6+ months counts as a full year). Not covered: 15/30 × salary × completed years.
   * Usually payable after 5 years. Up to ₹20 lakh is tax-free for most private employees.
   */
  function gratuity(o) {
    var sal = n(o.salary), yrs = Math.floor(n(o.years)), mon = Math.round(n(o.months)), covered = o.covered !== false;
    var countYears = covered ? yrs + (mon >= 6 ? 1 : 0) : yrs;
    var amount = sal * 15 / (covered ? 26 : 30) * countYears;
    var limit = n(o.exemptLimit) || 2000000;
    var eligible = yrs >= 5 || (yrs === 4 && mon >= 8);
    return { amount: amount, countedYears: countYears, eligible: eligible, exempt: Math.min(amount, limit), taxable: Math.max(0, amount - limit) };
  }

  /*
   * Capital gains on shares and mutual funds (sales on or after 23 July 2024).
   * equity: listed shares / equity funds. LT after 12 months: 12.5% above ₹1.25 lakh a year; ST: 20%.
   * debt: debt funds bought on/after 1 April 2023: always slab rate.
   * listedOther: gold/silver ETFs and other listed units: LT after 12 months at 12.5%; ST at slab.
   * other: other funds (gold/international fund of funds, debt funds bought before April 2023):
   *        LT after 24 months at 12.5%; ST at slab.
   */
  function monthsBetween(a, b) {
    var d1 = new Date(a), d2 = new Date(b);
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) - (d2.getDate() < d1.getDate() ? 1 : 0);
  }
  function capitalGains(o) {
    var type = o.asset || 'equity';
    var held = monthsBetween(o.buyDate, o.sellDate);
    var cost = n(o.buy), sale = n(o.sell), exp = n(o.expenses);
    var grandfathered = false;
    if (type === 'equity' && o.buyDate && o.buyDate < '2018-02-01' && n(o.fmv2018) > 0) {
      var fmvCost = Math.max(cost, Math.min(n(o.fmv2018), sale));
      grandfathered = fmvCost !== cost;
      cost = fmvCost;
    }
    var gain = sale - cost - exp;
    var ltMonths = type === 'other' ? 24 : 12;
    var longTerm = type !== 'debt' && held > ltMonths;
    var slab = n(o.slabRate) / 100;
    var rate, exemption = 0, kind;
    if (type === 'debt') { rate = slab; kind = 'Taxed at your slab rate (debt fund bought after March 2023)'; }
    else if (longTerm) { rate = 0.125; kind = 'Long-term capital gain'; if (type === 'equity') exemption = Math.max(0, 125000 - n(o.otherLtcg)); }
    else { rate = type === 'equity' ? 0.20 : slab; kind = 'Short-term capital gain'; }
    var taxableGain = Math.max(0, gain - exemption);
    var tax = taxableGain * rate;
    return {
      held: held, longTerm: longTerm, kind: kind, gain: gain, cost: cost, grandfathered: grandfathered,
      exemptionUsed: Math.min(Math.max(0, gain), exemption), taxableGain: taxableGain, rate: rate,
      tax: tax, cess: tax * 0.04, total: tax * 1.04, loss: gain < 0
    };
  }

  // Largest loan for a given EMI.
  function affordableLoan(monthlyEmi, annualRate, months) {
    var r = annualRate / 12 / 100;
    if (months <= 0 || monthlyEmi <= 0) return 0;
    if (r === 0) return monthlyEmi * months;
    var f = Math.pow(1 + r, months);
    return monthlyEmi * (f - 1) / (r * f);
  }

  /*
   * Home loan eligibility. Banks usually allow total EMIs up to about 50% of net
   * monthly income (FOIR), and lend up to 90% / 80% / 75% of the property value
   * (loans up to ₹30 lakh / up to ₹75 lakh / above, as per RBI).
   */
  function homeLoanEligibility(o) {
    var income = n(o.income) + n(o.coIncome), foir = (n(o.foir) || 50) / 100;
    var maxTenure = 30;
    if (n(o.age) > 0) maxTenure = Math.max(0, Math.min(30, (n(o.retireAge) || 60) - Math.round(n(o.age))));
    var years = Math.min(Math.round(n(o.tenure)) || 20, maxTenure);
    var maxEmi = Math.max(0, income * foir - n(o.otherEmis));
    var loan = affordableLoan(maxEmi, n(o.annualRate), years * 12);
    var ltv = loan <= 3000000 ? 0.9 : loan <= 7500000 ? 0.8 : 0.75;
    var property = loan / ltv;
    // A loan just above a limit can need a lower LTV; make sure the property figure is consistent.
    if (property <= 3000000 / 0.9) ltv = 0.9;
    return { maxEmi: maxEmi, loan: loan, tenureYears: years, tenureCapped: years < (Math.round(n(o.tenure)) || 20), ltv: ltv, property: loan / ltv, downPayment: loan / ltv - loan };
  }

  /*
   * Retirement corpus: expenses grow with inflation; the corpus keeps earning
   * postReturn and pays a year's expenses at the start of each year until life expectancy.
   */
  function retirement(o) {
    var age = Math.round(n(o.age)), ret = Math.round(n(o.retireAge)), life = Math.round(n(o.lifeExpectancy)) || 85;
    var inf = n(o.inflation) / 100, pre = n(o.preReturn) / 100, post = n(o.postReturn) / 100;
    var yrsToRet = Math.max(0, ret - age), yrsInRet = Math.max(1, life - ret);
    var annualNow = n(o.monthlyExpense) * 12;
    var annualAtRet = annualNow * Math.pow(1 + inf, yrsToRet);
    var corpus = 0;
    for (var k = 0; k < yrsInRet; k++) corpus += annualAtRet * Math.pow(1 + inf, k) / Math.pow(1 + post, k);
    var savingsFv = n(o.savings) * Math.pow(1 + pre, yrsToRet);
    var gap = Math.max(0, corpus - savingsFv);
    var monthlySip = yrsToRet > 0 ? sipForGoal({ target: gap, annualRate: o.preReturn, years: yrsToRet }) : gap;
    return {
      yearsToRetire: yrsToRet, yearsInRetirement: yrsInRet,
      monthlyExpenseAtRetirement: annualAtRet / 12, corpus: corpus, savingsFv: savingsFv, gap: gap, monthlySip: monthlySip,
      fireNumberToday: annualNow * 25, fireNumberAtRetirement: annualAtRet * 25
    };
  }

  // Inflation: future cost of something, or today's value of past money.
  function inflation(o) {
    var amt = n(o.amount), r = n(o.rate) / 100, yrs = n(o.years);
    var f = Math.pow(1 + r, yrs);
    return { future: amt * f, purchasingPower: amt / f, factor: f, lossPct: 1 - 1 / f };
  }

  var api = { sip: sip, lumpsum: lumpsum, sipForGoal: sipForGoal, fd: fd, rd: rd, ppf: ppf, gst: gst, prepayVsInvest: prepayVsInvest, breakEvenReturn: breakEvenReturn,
    ssy: ssy, nps: nps, epf: epf, gratuity: gratuity, capitalGains: capitalGains, monthsBetween: monthsBetween, affordableLoan: affordableLoan,
    homeLoanEligibility: homeLoanEligibility, retirement: retirement, inflation: inflation };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Fin = api;
})(this);
