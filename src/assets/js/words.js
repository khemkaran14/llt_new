/* Rupees in words, Indian numbering (lakh, crore). Browser: window.InWords. Node: module.exports. */
(function (root) {
  'use strict';
  var ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : ''); }
  function three(n) {
    var h = Math.floor(n / 100), r = n % 100;
    return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
  }
  function words(num) {
    var n = Math.floor(Math.abs(Number(num) || 0));
    if (n === 0) return 'Zero';
    var parts = [];
    var crore = Math.floor(n / 1e7); n %= 1e7;
    var lakh = Math.floor(n / 1e5); n %= 1e5;
    var thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push((crore > 99 ? words(crore) : two(crore)) + ' Crore');
    if (lakh) parts.push(two(lakh) + ' Lakh');
    if (thousand) parts.push(two(thousand) + ' Thousand');
    if (n) parts.push(three(n));
    return parts.join(' ');
  }
  function rupees(num) {
    var x = Math.round((Number(num) || 0) * 100) / 100;
    var r = Math.floor(x), p = Math.round((x - r) * 100);
    return 'Rupees ' + words(r) + (p ? ' and ' + two(p) + ' Paise' : '') + ' Only';
  }
  var api = { words: words, rupees: rupees };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.InWords = api;
})(this);
