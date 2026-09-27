// ======================================================================
// navbar.js — IM navbar behaviour (no dependencies)
// • scroll border/shadow (.is-scrolled)
// • page / reading progress along the navbar edge (--im-progress)
// • mobile menu toggle + nested submenu tap-to-expand
// • light/dark theme toggle
// • live GitHub star count (cached 24h in localStorage)
// ======================================================================
(function () {
  var navbar = document.querySelector('[data-im-navbar]') || document.querySelector('.im-navbar');
  var progress = document.querySelector('[data-im-progress]');
  var ring = document.querySelector('[data-im-progress-ring]');
  var ringPath = ring && ring.querySelector('path');
  var RING_RADIUS = 24; // px — matches --im-radius-6, the scrolled island pill's border-radius

  // ---- Mobile menu toggle ----
  var navBtn = document.querySelector('[data-im-nav-toggle]');
  if (navBtn && navbar) {
    navBtn.addEventListener('click', function () {
      var open = navbar.classList.toggle('is-nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ---- Nested submenu: tap-to-expand on touch / small screens ----
  document.querySelectorAll('.im-dropdown-item.has-sub > .im-dropdown-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.matchMedia('(min-width: 992px)').matches) return; // desktop uses hover
      e.preventDefault();
      var li = link.parentElement;
      var open = li.classList.toggle('is-open');
      link.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // ---- Theme toggle ----
  var themeBtn = document.querySelector('[data-im-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var el = document.documentElement;
      var cur = el.getAttribute('data-color-scheme');
      var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = cur === 'dark' || (cur === 'system' && sysDark);
      var next = isDark ? 'light' : 'dark';
      el.setAttribute('data-color-scheme', next);
      try { localStorage.setItem('im-color-scheme', next); } catch (e) {}
    });
  }

  // ---- Progress ring geometry --------------------------------------
  // A rounded-rect path, traced left -> bottom -> right -> top (i.e.
  // counter-clockwise, starting by the brand mark) so `stroke-dashoffset`
  // reveals it in that order. `pathLength="1"` normalizes the path's
  // length to 1 regardless of its real size, so stroke-dashoffset can
  // just use the 0-1 scroll ratio directly — and because it's driven by
  // real path length (not angle), the fill moves at one constant visual
  // rate all the way round, corners included, instead of speeding up on
  // the straight edges and bunching up on the curves.
  function roundedRectPath(w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return 'M' + r + ',0' +
      ' A' + r + ',' + r + ' 0 0 0 0,' + r +
      ' L0,' + (h - r) +
      ' A' + r + ',' + r + ' 0 0 0 ' + r + ',' + h +
      ' L' + (w - r) + ',' + h +
      ' A' + r + ',' + r + ' 0 0 0 ' + w + ',' + (h - r) +
      ' L' + w + ',' + r +
      ' A' + r + ',' + r + ' 0 0 0 ' + (w - r) + ',0' +
      ' Z';
  }
  function updateRing() {
    if (!ring || !ringPath || !navbar || !navbar.classList.contains('is-scrolled')) return;
    var rect = navbar.querySelector('.im-navbar-inner').getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    ring.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    ringPath.setAttribute('d', roundedRectPath(rect.width, rect.height, RING_RADIUS));
  }

  // ---- Scroll: border/shadow + progress ----
  var ticking = false;
  function onScroll() {
    if (navbar) navbar.classList.toggle('is-scrolled', window.scrollY > 8);
    if (progress) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progress.style.setProperty('--im-progress-ratio', ratio);
    }
    updateRing();
    ticking = false;
  }
  onScroll();
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // The pill's own size/radius/padding animate over --im-dur-2 (260ms)
  // when .is-scrolled toggles. getBoundingClientRect() at the instant the
  // class flips reads the box mid-transition, so if the user scrolls just
  // past the threshold and then stops, the ring freezes with stale
  // geometry — wrong width and a corner radius that doesn't match the
  // now-settled pill. Re-measure once the transition actually finishes.
  var navInner = navbar && navbar.querySelector('.im-navbar-inner');
  if (navInner) navInner.addEventListener('transitionend', updateRing);

  // ---- Live GitHub star count ----
  var gh = document.querySelector('[data-im-ghstars]');
  if (gh) {
    var repo = gh.getAttribute('data-im-ghstars');
    var countEl = gh.querySelector('.im-ghstar-count');
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('im-ghstars-' + repo) || 'null'); } catch (e) {}
    function show(n) { if (countEl) { countEl.textContent = n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n; countEl.hidden = false; } }
    if (cached && (Date.now() - cached.t) < 86400000) { show(cached.n); }
    else {
      fetch('https://api.github.com/repos/' + repo)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (typeof d.stargazers_count === 'number') {
            show(d.stargazers_count);
            try { localStorage.setItem('im-ghstars-' + repo, JSON.stringify({ n: d.stargazers_count, t: Date.now() })); } catch (e) {}
          }
        }).catch(function () {});
    }
  }
})();
