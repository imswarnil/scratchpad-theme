/* The hero's choreography — entrance, drift, parallax.
 *
 * This used to load GSAP from a CDN: 70kB and a third party on the one
 * page a first-time visitor always sees, to move six elements. It is the
 * Web Animations API and a transform now, which every browser this theme
 * targets has had for years.
 *
 * Nothing here is load-bearing. With JavaScript off, or under
 * prefers-reduced-motion, the hero is simply already in place — the CSS
 * never hides it, so there is no state to recover from.
 */
(function () {
  "use strict";

  var hero = document.querySelector(".sp-hero");
  if (!hero) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;

  var EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

  // ---- Entrance -------------------------------------------------------
  // Staggered, and only once the tab is actually visible: an animation
  // that played while the page was in a background tab is an animation
  // nobody saw.
  function enter() {
    var parts = [
      hero.querySelector(".sp-hero-line"),
      hero.querySelector(".sp-hero-title"),
      hero.querySelector(".sp-hero-subtitle"),
      hero.querySelector(".sp-hero-meta"),
      hero.querySelector(".sp-hero-actions"),
      hero.querySelector(".sp-hero-subscribe"),
    ].filter(Boolean);

    parts.forEach(function (el, i) {
      el.animate(
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 620, delay: i * 70, easing: EASE, fill: "backwards" }
      );
    });

    var media = hero.querySelector(".sp-hero-media");
    if (media) {
      media.animate(
        [
          { opacity: 0, transform: "translateY(20px) scale(0.985)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 760, delay: 120, easing: EASE, fill: "backwards" }
      );
    }
  }

  if (document.visibilityState === "visible") {
    enter();
  } else {
    document.addEventListener("visibilitychange", function once() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", once);
      enter();
    });
  }

  // ---- Drift ----------------------------------------------------------
  // The picture leans a little towards the pointer. A transform on a
  // composited layer, written on a frame — no library, no layout.
  var media = hero.querySelector(".sp-hero-media");
  if (media && window.matchMedia("(hover: hover)").matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, drifting = false;

    function frame() {
      // Ease towards the target rather than snapping to it: the lag is
      // what makes it read as weight rather than as a jump.
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      media.style.transform = "translate(" + cx.toFixed(2) + "%, " + cy.toFixed(2) + "%)";
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        requestAnimationFrame(frame);
      } else {
        drifting = false;
      }
    }

    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2.4;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2.4;
      if (!drifting) { drifting = true; requestAnimationFrame(frame); }
    }, { passive: true });

    hero.addEventListener("pointerleave", function () {
      tx = 0; ty = 0;
      if (!drifting) { drifting = true; requestAnimationFrame(frame); }
    });
  }

  // ---- Parallax -------------------------------------------------------
  // The words leave a touch faster than the page scrolls. Capped, so a
  // long hero never drags the copy off its own section.
  var content = hero.querySelector(".sp-hero-content");
  if (content) {
    var ticking = false;
    function onScroll() {
      var r = hero.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      content.style.transform = "translateY(" + (-60 * p).toFixed(1) + "px)";
      content.style.opacity = String(1 - p * 0.85);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();
  }
})();
