/* One copy button, everywhere: [data-sp-copy="<text>"].
 *
 * Delegated, so it covers buttons that arrive later (a carousel slide, an
 * injected snippet) and costs one listener instead of one per button.
 */
(function () {
  "use strict";

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-sp-copy]");
    if (!btn) return;

    var value = btn.getAttribute("data-sp-copy");
    // The attribute is HTML-escaped by the template; unescape it so what
    // lands on the clipboard is what was written, not &quot; and &amp;.
    try {
      var d = document.createElement("textarea");
      d.innerHTML = value;
      value = d.value;
    } catch (err) { /* keep the raw value */ }

    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(function () {
      var old = btn.innerHTML;
      btn.innerHTML = '<i class="ph-bold ph-check" aria-hidden="true"></i> Copied';
      btn.classList.add("is-copied");
      setTimeout(function () {
        btn.innerHTML = old;
        btn.classList.remove("is-copied");
      }, 1500);
    });
  });
})();
