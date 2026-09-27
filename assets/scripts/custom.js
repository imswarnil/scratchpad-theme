// Scroll-reveal for .im-reveal elements + the resume "Save as PDF" button.
// No dependencies; both features degrade to "just visible" / "browser print"
// if JS or IntersectionObserver support is unavailable.
document.addEventListener('DOMContentLoaded', function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.im-reveal');
    if (targets.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

      targets.forEach(function (el) {
        el.classList.add('js-reveal');
        io.observe(el);
      });
    }
  }

  // Every print button, not just the first: /resume/ has one in its hero
  // and one in the bar the hero becomes.
  Array.prototype.forEach.call(document.querySelectorAll('[data-im-print]'), function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });

  // In-article ads: insert a clone of #im-inline-ad-tpl after every Nth
  // paragraph inside a post's prose (N from data-im-inline-ads).
  var prose = document.querySelector('[data-im-inline-ads]');
  var adTpl = document.getElementById('im-inline-ad-tpl');
  if (prose && adTpl) {
    var every = parseInt(prose.getAttribute('data-im-inline-ads'), 10) || 3;
    var paras = Array.prototype.slice.call(prose.querySelectorAll(':scope > p'));
    // Skip inserting after the very last paragraph (nothing to separate).
    for (var i = every - 1; i < paras.length - 1; i += every) {
      var clone = adTpl.content.cloneNode(true);
      paras[i].insertAdjacentElement('afterend', clone.firstElementChild || clone);
    }
    if (window.adsbygoogle) {
      prose.querySelectorAll('.im-ad--inline ins.adsbygoogle').forEach(function () {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
      });
    }
  }

  // Floating bottom leaderboard: desktop-only, dismissible for the session.
  var stickyAd = document.querySelector('[data-im-sticky-ad]');
  if (stickyAd) {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem('im-sticky-ad-dismissed') === '1'; } catch (e) {}
    if (!dismissed && window.matchMedia('(min-width: 768px)').matches) {
      stickyAd.hidden = false;
    }
    var closeBtn = document.querySelector('[data-im-sticky-ad-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        stickyAd.hidden = true;
        try { sessionStorage.setItem('im-sticky-ad-dismissed', '1'); } catch (e) {}
      });
    }
  }
});
