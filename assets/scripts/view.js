/* view.js — the card / grid / list / simple switch on a collection.
 *
 *     <div class="im-btn-group" role="group" data-im-view="#feed">
 *       <button value="card" aria-pressed="true">…</button>
 *       …
 *     </div>
 *     <ul class="im-cards" id="feed" data-view="card"> … </ul>
 *
 * The group's data-im-view is a selector for the thing it dresses.
 * Pressing a button sets data-view on that element and remembers the
 * choice, so a reader who prefers a list gets one on every collection.
 *
 * Without this file the feed keeps whatever data-view the page shipped
 * and the CSS does the rest — the switch is an enhancement, not the
 * mechanism.
 */
(function () {
  "use strict";

  var KEY = "im-view";

  function remembered() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* private window */ }
  }

  function setup(group) {
    var target = document.querySelector(group.getAttribute("data-im-view"));
    if (!target) return;

    var buttons = [].slice.call(group.querySelectorAll("button[value]"));
    if (!buttons.length) return;

    function apply(value, save) {
      var known = buttons.some(function (b) { return b.value === value; });
      if (!known) return;
      target.setAttribute("data-view", value);
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.value === value ? "true" : "false");
      });
      if (save) remember(value);
    }

    group.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("button[value]");
      if (btn) apply(btn.value, true);
    });

    var saved = remembered();
    if (saved) apply(saved, false);
  }

  document.querySelectorAll("[data-im-view]").forEach(setup);
})();
