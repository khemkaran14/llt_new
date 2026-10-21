/*
 * CTC to in-hand salary. Uses TaxEngine for income tax.
 * Works in the browser (window.SalaryEngine) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  var T = (typeof module !== 'undefined' && module.exports) ? require('./tax-engine.js') : root.TaxEngine;

  function n(v) { var x = Number(v); return isFinite(x) && x > 0 ? x : 0; }

  /*
   * o: {
   *   ctc, basicPct (of fixed CTC), variable (yearly, part of CTC),
   *   pfMode ('capped' = 12% of basic up to ₹15,000/month, 'full' = 12% of basic, 'none'),
   *   gratuityInCtc (bool), professionalTax (yearly), regime ('new' | 'old' | 'best'),
   *   fy, age, oldDeductions (extra 80C/80D etc. for the old regime, besides employee PF)
   * }
   */
  function inHand(o) {
    var ctc = n(o.ctc);
    var variable = Math.min(n(o.variable), ctc);
    var fixedCtc = ctc - variable;
    var basicPct = o.basicPct == null ? 50 : Math.min(100, n(o.basicPct));

    // Basic is a share of fixed CTC; solve so employer PF and gratuity fit inside CTC.
    var pfRate = o.pfMode === 'none' ? 0 : 0.12;
    var gratRate = o.gratuityInCtc ? 0.0481 : 0;
    var basic = fixedCtc * basicPct / 100;
    var pfBase = o.pfMode === 'capped' ? Math.min(basic, 180000) : basic;
    var employerPF = pfBase * pfRate;
    var gratuity = basic * gratRate;
    var gross = Math.max(0, ctc - employerPF - gratuity); // includes variable pay
    var employeePF = employerPF;
    var pt = Math.min(n(o.professionalTax), 2500);

    var p = {
      fy: o.fy || '2026-27', age: o.age || '<60',
      salary: gross, basicDA: basic, professionalTax: pt,
      d80C: employeePF + n(o.extra80C), d80DSelf: n(o.health), homeLoanInterest: n(o.homeLoan)
    };
    var c = T.compare(p);
    var regime = o.regime === 'old' || o.regime === 'new' ? o.regime : c.better;
    var tax = c[regime].totalTax;

    var yearlyInHand = gross - employeePF - pt - tax;
    var fixedYearlyInHand = yearlyInHand - variable;
    return {
      ctc: ctc, variable: variable, basic: basic, employerPF: employerPF, gratuity: gratuity,
      gross: gross, employeePF: employeePF, professionalTax: pt,
      regime: regime, tax: tax, taxNew: c.new.totalTax, taxOld: c.old.totalTax,
      yearlyInHand: yearlyInHand,
      monthlyInHand: fixedYearlyInHand / 12,
      deductionsMonthly: (employeePF + pt + tax) / 12
    };
  }

  var api = { inHand: inHand };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SalaryEngine = api;
})(this);
