/*
 * Land area units used in India, in square feet.
 * Bigha, katha, biswa and similar units differ by state (and sometimes by district),
 * so these are the commonly used values; users can enter their own bigha size.
 * Browser: window.LandUnits. Node: module.exports.
 */
(function (root) {
  'use strict';
  var COMMON = {
    sqft: ['Square feet', 1], sqm: ['Square metre', 10.7639104], sqyd: ['Square yard (gaj)', 9],
    acre: ['Acre', 43560], hectare: ['Hectare', 107639.104], cent: ['Cent', 435.6], decimal: ['Decimal (dismil)', 435.6],
    guntha: ['Guntha', 1089], ground: ['Ground', 2400], ankanam: ['Ankanam', 72], kanal: ['Kanal', 5445], marla: ['Marla', 272.25],
    sqkm: ['Square km', 10763910.4]
  };
  // State-specific units (sq ft). Only units commonly used in that state are listed.
  var STATES = {
    'Assam': { bigha: 14400, katha: 2880, lessa: 144 },
    'Bihar': { bigha: 27220, katha: 1361, dhur: 68.06 },
    'Gujarat': { bigha: 17424, guntha: 1089 },
    'Haryana': { bigha: 27225, kanal: 5445, marla: 272.25, biswa: 1361.25 },
    'Himachal Pradesh': { bigha: 8712, biswa: 435.6 },
    'Jharkhand': { bigha: 27211, katha: 1361, decimal: 435.6 },
    'Madhya Pradesh': { bigha: 12000 },
    'Punjab': { bigha: 9070, kanal: 5445, marla: 272.25, killa: 43560 },
    'Rajasthan': { bigha: 27225, biswa: 1361.25 },
    'Uttar Pradesh': { bigha: 27000, biswa: 1350 },
    'Uttarakhand': { bigha: 6804 },
    'West Bengal': { bigha: 14400, katha: 720, chatak: 45 }
  };
  var NAMES = { bigha: 'Bigha', katha: 'Katha (kattha)', biswa: 'Biswa', dhur: 'Dhur', lessa: 'Lessa', chatak: 'Chatak', killa: 'Killa' };

  // All units for a state: common ones plus that state's local units. bighaOverride lets users set their local bigha.
  function units(state, bighaOverride) {
    var list = {};
    Object.keys(COMMON).forEach(function (k) { list[k] = { name: COMMON[k][0], sqft: COMMON[k][1] }; });
    var local = STATES[state] || {};
    Object.keys(local).forEach(function (k) { list[k] = { name: NAMES[k] || (COMMON[k] && COMMON[k][0]) || k, sqft: local[k], local: !COMMON[k] }; });
    if (bighaOverride > 0) {
      var ratio = list.bigha ? bighaOverride / list.bigha.sqft : 1;
      list.bigha = { name: 'Bigha', sqft: bighaOverride, local: true };
      // Biswa and katha are fractions of the bigha, so they follow a custom bigha size.
      ['biswa', 'katha', 'dhur'].forEach(function (k) { if (list[k]) list[k].sqft *= ratio; });
    }
    return list;
  }
  function convert(value, from, to, state, bighaOverride) {
    var u = units(state, bighaOverride);
    if (!u[from] || !u[to]) return NaN;
    return value * u[from].sqft / u[to].sqft;
  }
  var api = { STATES: STATES, units: units, convert: convert };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LandUnits = api;
})(this);
