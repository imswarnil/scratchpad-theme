/* /resume/ — the hero hands over to the bar.
 *
 * The page has no site header: it opens with a full-height hero, and once
 * that hero has left the screen the island bar under it takes its place.
 * An IntersectionObserver on the hero is all that needs to happen — no
 * scroll handler, so nothing runs on the frames in between.
 *
 * The "Save as PDF" buttons are wired in custom.js, with every other
 * print button on the site.
 */
(function () {
  "use strict";

  var hero = document.querySelector("[data-resume-hero]");
  var bar = document.querySelector("[data-resume-bar]");

  if (hero && bar && "IntersectionObserver" in window) {
    // Fire when the hero's last sliver passes under where the bar sits, so
    // the bar arrives as the hero leaves rather than on top of it.
    new IntersectionObserver(
      function (entries) {
        bar.classList.toggle("is-stuck", !entries[0].isIntersecting);
      },
      { rootMargin: "-72px 0px 0px 0px", threshold: 0 }
    ).observe(hero);
  } else if (bar) {
    // No observer: show the bar always rather than never.
    bar.classList.add("is-stuck");
  }

})();
