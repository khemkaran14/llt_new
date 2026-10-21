// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../src/assets/js/kundli.js');
const Land = require('../src/assets/js/land-units.js');

test('Moon longitude matches Meeus example 47.a (1992-04-12 0h)', () => {
  const jd = K.julianDay(1992, 4, 12, 0, 0, 0);
  assert.equal(jd, 2448724.5);
  const lon = K.moonLongitude(jd);
  assert.ok(Math.abs(lon - 133.162655) < 0.02, 'got ' + lon);
});

test('Lahiri ayanamsa is about 23°51\' at J2000 and 24°13\' in 2026', () => {
  assert.ok(Math.abs(K.ayanamsa(2451545) - 23.853) < 0.01);
  const a = K.ayanamsa(K.julianDay(2026, 1, 1, 0, 0, 0));
  assert.ok(a > 24.18 && a < 24.25, 'got ' + a);
});

test('nakshatra and pada from a known position', () => {
  const p = K.fromNakshatra(5, 3); // Ardra pada 3
  assert.equal(p.nakshatra, 5);
  assert.equal(p.pada, 3);
  assert.equal(p.rashi, 2); // Mithuna
});

test('same nakshatra: 28 points, Nadi dosha', () => {
  const a = K.fromNakshatra(7, 2), b = K.fromNakshatra(7, 2);
  const m = K.match(a, b);
  assert.equal(m.total, 28);
  assert.deepEqual(m.doshas, ['Nadi dosha']);
  assert.ok(m.total <= 36);
});

test('every pair of nakshatras scores between 0 and 36', () => {
  for (let i = 0; i < 27; i++) for (let j = 0; j < 27; j++) {
    const m = K.match(K.fromNakshatra(i, 1), K.fromNakshatra(j, 4));
    assert.ok(m.total >= 0 && m.total <= 36);
    assert.equal(m.kootas.length, 8);
  }
});

test('land units: common and state conversions', () => {
  assert.equal(Land.convert(1, 'acre', 'sqft'), 43560);
  assert.equal(Land.convert(1, 'acre', 'cent'), 100);
  assert.equal(Land.convert(1, 'guntha', 'sqyd'), 121);
  assert.equal(Land.convert(1, 'kanal', 'marla', 'Punjab'), 20);
  assert.equal(Land.convert(1, 'bigha', 'sqft', 'West Bengal'), 14400);
  assert.equal(Land.convert(1, 'bigha', 'katha', 'West Bengal'), 20);
  assert.equal(Land.convert(1, 'bigha', 'biswa', 'Uttar Pradesh'), 20);
  // custom bigha keeps biswa at 1/20 of a bigha
  assert.equal(Land.convert(1, 'bigha', 'biswa', 'Uttar Pradesh', 20000), 20);
  assert.ok(Number.isNaN(Land.convert(1, 'bigha', 'sqft', 'Kerala')));
});
