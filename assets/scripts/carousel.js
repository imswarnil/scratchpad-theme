/* Carousel — enhancement only.
 *
 * The strip is a scroll container with scroll-snap, so paging already
 * works with a finger, a trackpad and the keyboard before this file runs.
 * All this adds is the two buttons, the dots, and keeping them in step
 * with wherever the reader has scrolled to.
 */
(function () {
  "use strict";

  function setup(root) {
    var track = root.querySelector("[data-carousel-track]");
    if (!track) return;

    var slides = [].slice.call(root.querySelectorAll("[data-carousel-slide]"));
    // A shelf has no dots and pages by however many cards are on screen;
    // a figure carousel has dots and pages one slide at a time.
    var isShelf = root.classList.contains("sp-shelf-wrap");
    var dots = [].slice.call(root.querySelectorAll("[data-carousel-dot]"));
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    if (slides.length < 2) return;

    var current = 0;

    function go(i) {
      if (isShelf) {
        // Page by the visible width, less one card, so the card at the
        // edge stays on screen as an anchor.
        var step = Math.max(track.clientWidth - 160, 240);
        track.scrollBy({ left: i > current ? step : -step, behavior: "smooth" });
        return;
      }
      current = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[current].offsetLeft - track.offsetLeft, behavior: "smooth" });
    }

    function sync() {
      // Whichever slide's left edge is nearest the track's is the one showing.
      var best = 0;
      var min = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var d = Math.abs(slides[i].offsetLeft - track.offsetLeft - track.scrollLeft);
        if (d < min) { min = d; best = i; }
      }
      current = best;
      for (var j = 0; j < dots.length; j++) {
        dots[j].classList.toggle("is-current", j === current);
        dots[j].setAttribute("aria-current", j === current ? "true" : "false");
      }
      if (isShelf) {
        // For a shelf the ends are where the scroller actually is, not
        // which slide index we think is current.
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
        return;
      }
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === slides.length - 1;
    }

    if (prev) prev.addEventListener("click", function () { go(current - 1); });
    if (next) next.addEventListener("click", function () { go(current + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });

    sync();
  }

  document.querySelectorAll("[data-carousel]").forEach(setup);
})();
