// ======================================================================
// filter.js — collection listing behaviour (no dependencies)
// • tag / kind filtering for [data-sp-filter] + [data-sp-filter-grid]
//   (state mirrored in the URL hash: #kind=project,film&tag=web)
// • [data-sp-copy] clipboard buttons on cards
// ======================================================================
(function () {
  // ---- Copy buttons ----
  document.querySelectorAll('[data-sp-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-sp-copy');
      try { var d = document.createElement('textarea'); d.innerHTML = v; v = d.value; } catch (e) {}
      if (navigator.clipboard) navigator.clipboard.writeText(v);
      var old = b.innerHTML;
      b.innerHTML = '<i class="ph-bold ph-check"></i> Copied';
      setTimeout(function () { b.innerHTML = old; }, 1500);
    });
  });

  // ---- Filters ----
  var panel = document.querySelector('[data-sp-filter]');
  var grid = document.querySelector('[data-sp-filter-grid]');
  if (!panel || !grid) return;

  var buttons = panel.querySelectorAll('[data-filter-key]');
  var countEl = panel.querySelector('[data-sp-filter-count]');
  var clearBtn = panel.querySelector('[data-sp-filter-clear]');
  // The "nothing matches" line lives outside the panel, beside the grid.
  var emptyEl = document.querySelector('[data-sp-filter-empty]');
  var clearAll = document.querySelectorAll('[data-sp-filter-clear]');
  // The grid's OWN children, not every descendant that happens to carry
  // the attributes — a card's <article> carries them as well, and
  // matching both counted every entry twice.
  var cards = Array.prototype.slice.call(grid.children).filter(function (el) {
    return el.hasAttribute('data-kind') || el.hasAttribute('data-tags');
  });
  var active = { kind: [], tag: [] };

  function readHash() {
    active = { kind: [], tag: [] };
    var h = location.hash.replace(/^#/, '');
    if (!h) return;
    h.split('&').forEach(function (pair) {
      var kv = pair.split('=');
      if ((kv[0] === 'kind' || kv[0] === 'tag') && kv[1]) {
        active[kv[0]] = decodeURIComponent(kv[1]).split(',').filter(Boolean);
      }
    });
  }
  function writeHash() {
    var parts = [];
    if (active.kind.length) parts.push('kind=' + active.kind.join(','));
    if (active.tag.length) parts.push('tag=' + active.tag.join(','));
    var next = parts.length ? '#' + parts.join('&') : location.pathname + location.search;
    history.replaceState(null, '', next);
  }

  function matches(card) {
    var kind = card.getAttribute('data-kind') || '';
    var tags = (card.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
    if (active.kind.length && active.kind.indexOf(kind) === -1) return false;
    for (var i = 0; i < active.tag.length; i++) {
      if (tags.indexOf(active.tag[i]) === -1) return false;
    }
    return true;
  }

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var ok = matches(card);
      var li = card.closest('li') || card;
      li.hidden = !ok;
      if (ok) shown++;
    });
    buttons.forEach(function (b) {
      var on = active[b.getAttribute('data-filter-key')].indexOf(b.getAttribute('data-filter-value')) !== -1;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (countEl) countEl.textContent = shown + ' of ' + cards.length;
    if (clearBtn) clearBtn.hidden = !(active.kind.length || active.tag.length);
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-filter-key');
      var val = b.getAttribute('data-filter-value');
      var i = active[key].indexOf(val);
      if (i === -1) active[key].push(val); else active[key].splice(i, 1);
      writeHash();
      apply();
    });
  });
  clearAll.forEach(function (b) { b.addEventListener('click', function () {
    active = { kind: [], tag: [] };
    writeHash();
    apply();
  }); });
  window.addEventListener('hashchange', function () { readHash(); apply(); });

  readHash();
  apply();
})();
