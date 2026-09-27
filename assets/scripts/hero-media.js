/* The hero's photo / film switch.
 *
 * The frame morphs between the square a portrait wants and the 16:9 a
 * film wants — that part is CSS. This file does the one thing CSS cannot:
 * it does not request the film until somebody asks for it, and it takes
 * it back out when they switch away, so a muted video is never left
 * running behind a page nobody is looking at.
 */
(function () {
  "use strict";

  var media = document.querySelector("[data-hero-media]");
  if (!media) return;

  var slot = media.querySelector("[data-hero-film]");
  var film = media.querySelector("#sp-hero-film");
  var photo = media.querySelector("#sp-hero-photo");
  if (!slot || !film) return;

  var id = slot.getAttribute("data-video-id");

  function show() {
    if (slot.firstChild) return;
    var frame = document.createElement("iframe");
    frame.src =
      "https://www.youtube-nocookie.com/embed/" + id +
      "?autoplay=1&mute=1&loop=1&playlist=" + id + "&controls=0&playsinline=1";
    frame.title = "Showreel";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.setAttribute("allowfullscreen", "");
    slot.appendChild(frame);
  }

  function hide() { slot.innerHTML = ""; }

  film.addEventListener("change", function () { if (film.checked) show(); });
  if (photo) photo.addEventListener("change", function () { if (photo.checked) hide(); });
  if (film.checked) show();
})();
