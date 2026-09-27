/* /about/ — the chapter rail follows the reading.
 *
 * One observer over the chapters; whichever is nearest the top of the
 * screen is the one the rail marks. Same idea as the article contents,
 * and the same reason it is a script: which chapter you are reading is
 * not something CSS can know.
 */
(function () {
  "use strict";

  var sections = [].slice.call(document.querySelectorAll("[data-story-section]"));
  var links = [].slice.call(document.querySelectorAll("[data-story-link]"));
  if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

  var seen = {};

  function mark() {
    // The topmost section still on screen wins; if none is, keep the last.
    var current = null;
    for (var i = 0; i < sections.length; i++) {
      if (seen[sections[i].dataset.storySection]) { current = sections[i].dataset.storySection; break; }
    }
    if (!current) return;
    links.forEach(function (a) {
      var on = a.dataset.storyLink === current;
      a.classList.toggle("is-current", on);
      if (on) { a.setAttribute("aria-current", "true"); } else { a.removeAttribute("aria-current"); }
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { seen[e.target.dataset.storySection] = e.isIntersecting; });
    mark();
  }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });

  sections.forEach(function (s) { io.observe(s); });
})();
