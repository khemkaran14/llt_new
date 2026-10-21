/*
 * Kundli Milan (Ashtakoota, 36 points).
 * Moon position: Meeus, "Astronomical Algorithms" ch. 47 (main terms, error well under 0.05°),
 * converted to sidereal with the Lahiri (Chitrapaksha) ayanamsa.
 * Browser: window.Kundli. Node: module.exports.
 */
(function (root) {
  'use strict';
  var RAD = Math.PI / 180;
  var NAK = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
    'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
    'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
  var RASHI = ['Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)',
    'Tula (Libra)', 'Vrishchika (Scorpio)', 'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)'];

  function norm(x) { x %= 360; return x < 0 ? x + 360 : x; }

  // Julian Day from a local date/time and its UTC offset in hours (IST = 5.5).
  function julianDay(y, mo, d, h, mi, tz) {
    var dayFrac = (h + mi / 60 - (tz || 0)) / 24;
    if (mo <= 2) { y -= 1; mo += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + dayFrac + B - 1524.5;
  }

  // [coefficient (1e-6 degrees), D, M, M', F]
  var TERMS = [
    [6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0], [213618, 0, 0, 2, 0], [-185116, 0, 1, 0, 0],
    [-114332, 0, 0, 0, 2], [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0], [53322, 2, 0, 1, 0], [45758, 2, -1, 0, 0],
    [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0], [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2],
    [10980, 0, 0, 1, -2], [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0], [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0],
    [-6766, 2, 1, 0, 0], [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0], [3994, 2, 0, 2, 0],
    [3861, 4, 0, 0, 0], [3665, 2, 0, -3, 0], [-2689, 0, 1, -2, 0], [-2602, 2, 0, -1, 2], [2390, 2, -1, -2, 0],
    [-2348, 1, 0, 1, 0], [2236, 2, -2, 0, 0], [-2120, 0, 1, 2, 0], [-2069, 0, 2, 0, 0], [2048, 2, -2, -1, 0],
    [-1773, 2, 0, 1, -2], [-1595, 2, 0, 0, 2], [1215, 4, -1, -1, 0], [-1110, 0, 0, 2, 2], [-892, 3, 0, -1, 0],
    [-810, 2, 1, 1, 0], [759, 4, -1, -2, 0], [-713, 0, 2, -1, 0], [-700, 2, 2, -1, 0], [691, 2, 1, -2, 0],
    [596, 2, -1, 0, -2], [549, 4, 0, 1, 0], [537, 0, 0, 4, 0], [520, 4, -1, 0, 0], [-487, 1, 0, -2, 0]
  ];

  // Tropical ecliptic longitude of the Moon (degrees) for a Julian Day.
  function moonLongitude(jd) {
    var T = (jd - 2451545) / 36525;
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841;
    var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868;
    var M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699;
    var F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;
    var A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var sum = 0;
    for (var i = 0; i < TERMS.length; i++) {
      var t = TERMS[i], arg = (t[1] * D + t[2] * M + t[3] * Mp + t[4] * F) * RAD;
      var e = Math.abs(t[2]) === 1 ? E : Math.abs(t[2]) === 2 ? E * E : 1;
      sum += t[0] * e * Math.sin(arg);
    }
    sum += 3958 * Math.sin(A1 * RAD) + 1962 * Math.sin((Lp - F) * RAD) + 318 * Math.sin(A2 * RAD);
    return norm(Lp + sum / 1e6);
  }

  // Lahiri ayanamsa (degrees): 23°51'11" at J2000, about 50.29" a year.
  function ayanamsa(jd) { return 23.85306 + 1.39722 * (jd - 2451545) / 36525; }

  function fromSidereal(sid) {
    var nak = Math.floor(sid / (360 / 27));
    return { sidereal: sid, rashi: Math.floor(sid / 30), nakshatra: nak, pada: Math.floor((sid - nak * 360 / 27) / (360 / 108)) + 1,
      degInRashi: sid % 30 };
  }
  // From birth details: { date: 'YYYY-MM-DD', time: 'HH:MM', tz: 5.5 }
  function moonSign(b) {
    var d = String(b.date).split('-').map(Number), t = String(b.time || '12:00').split(':').map(Number);
    var jd = julianDay(d[0], d[1], d[2], t[0], t[1] || 0, b.tz == null ? 5.5 : Number(b.tz));
    var sid = norm(moonLongitude(jd) - ayanamsa(jd));
    var r = fromSidereal(sid);
    // How close to a nakshatra boundary (degrees): near a boundary, birth time accuracy matters.
    var into = sid % (360 / 27);
    r.nearBoundary = Math.min(into, 360 / 27 - into) < 0.25;
    return r;
  }
  // From a known nakshatra (0-26) and pada (1-4)
  function fromNakshatra(nak, pada) { return fromSidereal(nak * 360 / 27 + ((pada || 1) - 0.5) * 360 / 108); }

  // ---------- Ashtakoota tables ----------
  var VARNA_OF_RASHI = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]; // 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra
  var VARNA_NAME = { 4: 'Brahmin', 3: 'Kshatriya', 2: 'Vaishya', 1: 'Shudra' };
  var VASHYA_NAME = ['Chatushpada (quadruped)', 'Manava (human)', 'Jalachara (water)', 'Vanachara (wild)', 'Keeta (insect)'];
  function vashyaOf(p) {
    var r = p.rashi, deg = p.degInRashi;
    var map = [0, 0, 1, 2, 3, 1, 1, 4, deg < 15 ? 1 : 0, deg < 15 ? 0 : 2, 1, 2];
    return map[r];
  }
  var VASHYA = [[2, 1, 1, 0.5, 1], [1, 2, 0.5, 0, 1], [1, 0.5, 2, 1, 1], [0.5, 0, 1, 2, 0], [1, 1, 1, 0, 2]];
  var YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
  var YONI_NAME = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'];
  var YONI = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1], [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0], [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2], [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1], [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2], [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1], [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1], [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1], [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2], [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]
  ];
  // Rashi lords: 0 Sun, 1 Moon, 2 Mars, 3 Mercury, 4 Jupiter, 5 Venus, 6 Saturn
  var LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
  var PLANET = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  // Natural relationship of planet a towards planet b: 1 friend, 0 neutral, -1 enemy
  var REL = [
    [1, 1, 1, 0, 1, -1, -1], [1, 1, 0, 1, 0, 0, 0], [1, 1, 1, -1, 1, 0, 0], [1, -1, 0, 1, 0, 1, 0],
    [1, 1, 1, -1, 1, -1, 0], [-1, -1, 0, 1, 0, 1, 1], [-1, -1, -1, 1, 0, 1, 1]
  ];
  function maitri(a, b) {
    if (a === b) return 5;
    var x = REL[a][b], y = REL[b][a], s = x + y;
    if (x === 1 && y === 1) return 5;
    if (s === 1) return 4;                // friend + neutral
    if (x === 0 && y === 0) return 3;     // both neutral
    if (s === 0) return 1;                // friend + enemy
    if (s === -1) return 0.5;             // neutral + enemy
    return 0;                             // both enemies
  }
  var GANA_OF = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]; // 0 Deva, 1 Manushya, 2 Rakshasa
  var GANA_NAME = ['Deva', 'Manushya', 'Rakshasa'];
  var GANA = [[6, 6, 0], [5, 6, 0], [1, 0, 6]]; // [boy][girl]
  var NADI_OF = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2]; // 0 Adi, 1 Madhya, 2 Antya
  var NADI_NAME = ['Adi', 'Madhya', 'Antya'];

  // boy, girl: results of moonSign / fromNakshatra
  function match(boy, girl) {
    var k = [];
    var vb = VARNA_OF_RASHI[boy.rashi], vg = VARNA_OF_RASHI[girl.rashi];
    k.push({ key: 'varna', name: 'Varna', max: 1, score: vb >= vg ? 1 : 0, boy: VARNA_NAME[vb], girl: VARNA_NAME[vg], about: 'Spiritual compatibility and ego.' });
    var wb = vashyaOf(boy), wg = vashyaOf(girl);
    k.push({ key: 'vashya', name: 'Vashya', max: 2, score: VASHYA[wb][wg], boy: VASHYA_NAME[wb], girl: VASHYA_NAME[wg], about: 'Mutual attraction and influence.' });
    var t1 = ((boy.nakshatra - girl.nakshatra + 27) % 27) + 1, t2 = ((girl.nakshatra - boy.nakshatra + 27) % 27) + 1;
    var bad = function (n) { var r = n % 9; return r === 3 || r === 5 || r === 7; };
    k.push({ key: 'tara', name: 'Tara', max: 3, score: (bad(t1) ? 0 : 1.5) + (bad(t2) ? 0 : 1.5), boy: NAK[boy.nakshatra], girl: NAK[girl.nakshatra], about: 'Health, well-being and destiny.' });
    var yb = YONI_OF[boy.nakshatra], yg = YONI_OF[girl.nakshatra];
    k.push({ key: 'yoni', name: 'Yoni', max: 4, score: YONI[yb][yg], boy: YONI_NAME[yb], girl: YONI_NAME[yg], about: 'Physical and intimate compatibility.' });
    var lb = LORD[boy.rashi], lg = LORD[girl.rashi];
    k.push({ key: 'maitri', name: 'Graha Maitri', max: 5, score: maitri(lb, lg), boy: PLANET[lb], girl: PLANET[lg], about: 'Friendship and mental compatibility.' });
    var gb = GANA_OF[boy.nakshatra], gg = GANA_OF[girl.nakshatra];
    k.push({ key: 'gana', name: 'Gana', max: 6, score: GANA[gb][gg], boy: GANA_NAME[gb], girl: GANA_NAME[gg], about: 'Temperament and nature.' });
    var dist = ((boy.rashi - girl.rashi + 12) % 12) + 1, rev = ((girl.rashi - boy.rashi + 12) % 12) + 1;
    var pair = [Math.min(dist, rev), Math.max(dist, rev)].join('/');
    var bhakootBad = pair === '2/12' || pair === '5/9' || pair === '6/8';
    k.push({ key: 'bhakoot', name: 'Bhakoot', max: 7, score: bhakootBad ? 0 : 7, boy: RASHI[boy.rashi], girl: RASHI[girl.rashi], about: 'Love, family welfare and prosperity.', dosha: bhakootBad ? 'Bhakoot dosha (' + pair + ')' : '' });
    var nb = NADI_OF[boy.nakshatra], ng = NADI_OF[girl.nakshatra];
    k.push({ key: 'nadi', name: 'Nadi', max: 8, score: nb === ng ? 0 : 8, boy: NADI_NAME[nb], girl: NADI_NAME[ng], about: 'Health and children.', dosha: nb === ng ? 'Nadi dosha' : '' });
    var total = k.reduce(function (a, x) { return a + x.score; }, 0);
    var verdict = total >= 33 ? 'Excellent match' : total >= 25 ? 'Very good match' : total >= 18 ? 'Average match (acceptable)' : 'Not recommended traditionally';
    return { kootas: k, total: total, verdict: verdict, doshas: k.filter(function (x) { return x.dosha; }).map(function (x) { return x.dosha; }) };
  }

  var api = { NAK: NAK, RASHI: RASHI, julianDay: julianDay, moonLongitude: moonLongitude, ayanamsa: ayanamsa, moonSign: moonSign, fromNakshatra: fromNakshatra, match: match };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Kundli = api;
})(this);
