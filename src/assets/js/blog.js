/* Blog pages: share buttons and email sign-up. */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var copy = e.target.closest('.share-copy');
    if (copy) {
      var url = copy.getAttribute('data-copy');
      var done = function () { var t = copy.textContent; copy.textContent = 'Copied!'; setTimeout(function () { copy.textContent = t; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); });
      else prompt('Copy this link:', url);
    }
    var nat = e.target.closest('.share-native');
    if (nat && navigator.share) navigator.share({ title: nat.getAttribute('data-title'), url: nat.getAttribute('data-url') }).catch(function () {});
  });
  if (navigator.share) document.querySelectorAll('.share-native').forEach(function (b) { b.hidden = false; });

  document.querySelectorAll('form[data-subscribe]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = f.querySelector('input[type=email]'), msg = f.querySelector('.nl-msg'), btn = f.querySelector('button');
      btn.disabled = true; msg.textContent = 'Saving…';
      fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.value, source: 'blog' }) })
        .then(function (r) { return r.json().then(function (j) { return [r.ok, j]; }); })
        .then(function (x) { msg.textContent = x[0] ? 'Subscribed! Thank you.' : (x[1].error || 'Could not save. Please try again.'); if (x[0]) f.reset(); })
        .catch(function () { msg.textContent = 'Could not save. Please try again.'; })
        .then(function () { btn.disabled = false; });
    });
  });
})();
