/*
 * Indian income tax engine for resident individuals.
 * Covers FY 2025-26 and FY 2026-27 (slabs unchanged by Budget 2026).
 * Works in the browser (window.TaxEngine) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  var LAKH = 100000;

  var NEW_SLABS = [
    [4 * LAKH, 0], [8 * LAKH, 0.05], [12 * LAKH, 0.10], [16 * LAKH, 0.15],
    [20 * LAKH, 0.20], [24 * LAKH, 0.25], [Infinity, 0.30]
  ];

  function oldSlabs(age) {
    var exempt = age === '80+' ? 5 * LAKH : age === '60-80' ? 3 * LAKH : 2.5 * LAKH;
    var rows = [[exempt, 0]];
    if (exempt < 5 * LAKH) rows.push([5 * LAKH, 0.05]);
    rows.push([10 * LAKH, 0.20], [Infinity, 0.30]);
    return rows;
  }

  var YEARS = {
    '2026-27': {
      label: 'FY 2026-27 (AY 2027-28)',
      metroCities: ['delhi', 'mumbai', 'kolkata', 'chennai', 'bengaluru', 'hyderabad', 'pune', 'ahmedabad']
    },
    '2025-26': {
      label: 'FY 2025-26 (AY 2026-27)',
      metroCities: ['delhi', 'mumbai', 'kolkata', 'chennai']
    }
  };

  var SURCHARGE = [
    [50 * LAKH, 0.10], [100 * LAKH, 0.15], [200 * LAKH, 0.25], [500 * LAKH, 0.37]
  ];

  function n(v) {
    var x = Number(v);
    return isFinite(x) && x > 0 ? x : 0;
  }

  function slabTax(income, slabs) {
    var tax = 0, lower = 0, rows = [];
    for (var i = 0; i < slabs.length; i++) {
      var upper = slabs[i][0], rate = slabs[i][1];
      var amount = Math.max(0, Math.min(income, upper) - lower);
      var t = amount * rate;
      rows.push({ from: lower, to: upper, rate: rate, amount: amount, tax: t });
      tax += t;
      lower = upper;
      if (income <= upper) break;
    }
    return { tax: tax, rows: rows };
  }

  // Surcharge with marginal relief. maxRate caps the rate (25% in the new regime).
  function surchargeFor(income, tax, slabs, maxRate) {
    var rate = 0, threshold = 0, prevRate = 0;
    for (var i = 0; i < SURCHARGE.length; i++) {
      if (income > SURCHARGE[i][0] && SURCHARGE[i][1] <= maxRate) {
        prevRate = rate;
        rate = SURCHARGE[i][1];
        threshold = SURCHARGE[i][0];
      }
    }
    if (!rate) return { surcharge: 0, rate: 0, relief: 0 };
    var full = tax * rate;
    var atThreshold = slabTax(threshold, slabs).tax * (1 + prevRate);
    var cap = atThreshold + (income - threshold) - tax;
    var surcharge = Math.min(full, Math.max(0, cap));
    return { surcharge: surcharge, rate: rate, relief: full - surcharge };
  }

  function hraExemption(p, fy) {
    var basic = n(p.basicDA), hra = n(p.hraReceived), rent = n(p.rentPaid);
    if (!hra || !rent) return { exempt: 0, metro: false, parts: null };
    var metro = YEARS[fy].metroCities.indexOf(String(p.city || '').toLowerCase()) !== -1;
    var a = hra;
    var b = Math.max(0, rent - 0.1 * basic);
    var c = (metro ? 0.5 : 0.4) * basic;
    return { exempt: Math.min(a, b, c), metro: metro, parts: { hraReceived: a, rentMinus10: b, pctOfBasic: c } };
  }

  /*
   * p: {
   *   fy, age ('<60' | '60-80' | '80+'),
   *   salary, basicDA, hraReceived, rentPaid, city, otherExempt, professionalTax,
   *   savingsInterest, otherInterest, rentalIncome, otherIncome,
   *   d80C, d80CCD1B, d80DSelf, d80DParents, parentsSenior, homeLoanInterest,
   *   d80E, d80G, employerNPS, isGovtEmployee, otherDeductions
   * }
   */
  function compute(p, regime) {
    var fy = YEARS[p.fy] ? p.fy : '2026-27';
    var age = p.age || '<60';
    var isOld = regime === 'old';
    var senior = age !== '<60';

    var salary = n(p.salary);
    var basic = n(p.basicDA);

    // Income from salary
    var hra = isOld ? hraExemption(p, fy) : { exempt: 0 };
    var otherExempt = isOld ? Math.min(n(p.otherExempt), salary) : 0;
    var exemptions = Math.min(salary, hra.exempt + otherExempt);
    var stdDeduction = salary > 0 ? Math.min(salary - exemptions, isOld ? 50000 : 75000) : 0;
    var profTax = isOld ? Math.min(n(p.professionalTax), 2500) : 0;
    var salaryIncome = Math.max(0, salary - exemptions - stdDeduction - profTax);

    // House property (let-out): 30% standard deduction in both regimes
    var rental = n(p.rentalIncome);
    var houseProperty = rental * 0.7;
    // Self-occupied home loan interest: old regime only, capped at 2 lakh
    var homeLoan = isOld ? Math.min(n(p.homeLoanInterest), 2 * LAKH) : 0;
    houseProperty -= homeLoan;
    // Loss from house property set off against other income is capped at 2 lakh
    if (houseProperty < -2 * LAKH) houseProperty = -2 * LAKH;

    var interest = n(p.savingsInterest) + n(p.otherInterest);
    var otherSources = interest + n(p.otherIncome);

    var gross = Math.max(0, salaryIncome + houseProperty + otherSources);

    // Chapter VI-A deductions
    var ded = {};
    var npsCap = (isOld && !p.isGovtEmployee) ? 0.10 : 0.14;
    ded.employerNPS = Math.min(n(p.employerNPS), basic > 0 ? npsCap * basic : 0);
    if (isOld) {
      ded.d80C = Math.min(n(p.d80C), 1.5 * LAKH);
      ded.d80CCD1B = Math.min(n(p.d80CCD1B), 50000);
      ded.d80DSelf = Math.min(n(p.d80DSelf), senior ? 50000 : 25000);
      ded.d80DParents = Math.min(n(p.d80DParents), p.parentsSenior ? 50000 : 25000);
      ded.d80E = n(p.d80E);
      ded.d80G = n(p.d80G);
      ded.interest = senior
        ? Math.min(interest, 50000)               // 80TTB
        : Math.min(n(p.savingsInterest), 10000);  // 80TTA
      ded.other = n(p.otherDeductions);
    }
    var totalDeductions = 0;
    for (var k in ded) totalDeductions += ded[k];
    totalDeductions = Math.min(totalDeductions, gross);

    var taxable = Math.max(0, gross - totalDeductions);
    taxable = Math.round(taxable / 10) * 10; // Section 288A rounding

    var slabs = isOld ? oldSlabs(age) : NEW_SLABS;
    var st = slabTax(taxable, slabs);
    var baseTax = st.tax;

    var rebate = 0, marginalRelief = 0;
    if (isOld) {
      if (taxable <= 5 * LAKH) rebate = Math.min(baseTax, 12500);
    } else {
      if (taxable <= 12 * LAKH) {
        rebate = Math.min(baseTax, 60000);
      } else if (baseTax > taxable - 12 * LAKH) {
        marginalRelief = baseTax - (taxable - 12 * LAKH);
      }
    }
    var afterRebate = Math.max(0, baseTax - rebate - marginalRelief);

    var sc = surchargeFor(taxable, afterRebate, slabs, isOld ? 0.37 : 0.25);
    var cess = (afterRebate + sc.surcharge) * 0.04;
    var total = Math.round(afterRebate + sc.surcharge + cess);
    var grossIncome = salary + rental + otherSources;

    return {
      regime: isOld ? 'old' : 'new',
      fy: fy,
      grossIncome: grossIncome,
      exemptions: exemptions,
      hra: hra,
      standardDeduction: stdDeduction,
      professionalTax: profTax,
      homeLoanInterest: homeLoan,
      deductions: ded,
      totalDeductions: totalDeductions,
      taxableIncome: taxable,
      slabRows: st.rows,
      slabTax: baseTax,
      rebate: rebate,
      marginalRelief: marginalRelief,
      surcharge: sc.surcharge,
      surchargeRate: sc.rate,
      surchargeRelief: sc.relief,
      cess: cess,
      totalTax: total,
      monthlyTax: total / 12,
      effectiveRate: grossIncome > 0 ? total / grossIncome : 0,
      inHand: grossIncome - total
    };
  }

  // Extra old-regime deductions needed for the old regime to match the new one.
  function breakEvenDeduction(p) {
    var newTax = compute(p, 'new').totalTax;
    var oldTax = compute(p, 'old').totalTax;
    if (oldTax <= newTax) return 0;
    var lo = 0, hi = 0, base = n(p.otherDeductions);
    var gross = n(p.salary) + n(p.rentalIncome) + n(p.savingsInterest) + n(p.otherInterest) + n(p.otherIncome);
    hi = gross;
    var test = function (extra) {
      var q = {};
      for (var k in p) q[k] = p[k];
      q.otherDeductions = base + extra;
      return compute(q, 'old').totalTax <= newTax;
    };
    if (!test(hi)) return null;
    for (var i = 0; i < 40 && hi - lo > 1; i++) {
      var mid = (lo + hi) / 2;
      if (test(mid)) hi = mid; else lo = mid;
    }
    return Math.ceil(hi / 100) * 100;
  }

  function compare(p) {
    var oldR = compute(p, 'old');
    var newR = compute(p, 'new');
    var better = newR.totalTax <= oldR.totalTax ? 'new' : 'old';
    return {
      old: oldR,
      new: newR,
      better: better,
      saving: Math.abs(oldR.totalTax - newR.totalTax),
      breakEven: breakEvenDeduction(p)
    };
  }

  var api = {
    YEARS: YEARS,
    NEW_SLABS: NEW_SLABS,
    oldSlabs: oldSlabs,
    slabTax: slabTax,
    hraExemption: function (p, fy) { return hraExemption(p, YEARS[fy] ? fy : '2026-27'); },
    compute: compute,
    compare: compare,
    breakEvenDeduction: breakEvenDeduction
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TaxEngine = api;
})(this);
