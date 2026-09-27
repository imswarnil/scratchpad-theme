/**
 * color.mjs — just enough colour maths to derive a collection's hue from
 * the site accent, in Node, with no dependencies.
 *
 * The CSS does the same thing at runtime with `oklch(from … l c calc(h - N))`.
 * This is the build-time twin, used by the thumbnail generator so a
 * generated cover and a live card agree on what colour a collection is.
 * It works in HSL rather than OKLCH — close enough for artwork, and it
 * fits in thirty lines.
 */

export function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [h, s, l];
}

export const hsl = (h, s, l, a = 1) => {
  const deg = Math.round(((h % 360) + 360) % 360);
  const sp = Math.round(s * 100), lp = Math.round(l * 100);
  return a === 1 ? `hsl(${deg} ${sp}% ${lp}%)` : `hsl(${deg} ${sp}% ${lp}% / ${a})`;
};

/** The accent as HSL, with a sane fallback for a colour we cannot read. */
export function accentHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [352, 0.88, 0.56];          // the design system's default
  const [h, s, l] = rgbToHsl(rgb);
  return [h, Math.max(s, 0.25), Math.min(Math.max(l, 0.32), 0.68)];
}

/**
 * How far each collection's hue sits from the accent. The same rotations
 * the CSS uses in tokens/_tokens.scss — keep the two lists in step.
 */
export const HUE_SHIFT = {
  posts: 0, portfolio: -140, videos: -20, snippets: -115, prompts: -180,
  notes: -65, talks: -90, books: -160, photos: -200, uses: -220, pages: -250,
};

/** A stable hue for any collection, named or not. */
export function collectionHue(baseHue, label) {
  if (label in HUE_SHIFT) return baseHue + HUE_SHIFT[label];
  // An unknown collection still gets a hue of its own: hash the name.
  let n = 0;
  for (const ch of String(label)) n = (n * 31 + ch.charCodeAt(0)) % 360;
  return baseHue + n;
}

/** A small deterministic hash, for picking a pattern from a title. */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
