#!/usr/bin/env node
/**
 * `npm run thumbs` — draw every placeholder cover the site needs.
 *
 * Scratchpad never ships a stock photograph. Artwork here is DRAWN: an SVG
 * built from the collection's hue (derived from your one accent colour,
 * exactly the way the CSS derives it) and a pattern chosen by hashing the
 * title, so the same entry always gets the same picture and two entries
 * side by side never get the same one.
 *
 * Three things come out of this:
 *   assets/img/covers/<collection>.svg   the fallback cover per collection
 *   assets/img/demo/<slug>.svg           dummy art for the demo content
 *   assets/img/placeholder.svg           the last-resort cover
 *
 * The runtime twin of this is _includes/utility/thumb.html, which draws
 * the same thing inline from an entry's own front matter — that one needs
 * no build step and is what most cards actually use. This script exists
 * for the cases that need a real FILE: a social card, an <img src>, a
 * collection's `image:`.
 *
 *   node tools/thumbs.mjs [--accent "#f22f46"] [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import * as Y from './lib/yaml-lite.mjs';
import { accentHsl, collectionHue, hsl, hash } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const FORCE = argv.includes('--force');

const cfg = Y.parse(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'));
const ACCENT = opt('accent', cfg.accent_color || '#f22f46');
const [H, S, L] = accentHsl(ACCENT);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Same rule as tools/new.mjs, so a generated cover's filename matches the
// slug an entry would get. Apostrophes vanish rather than becoming hyphens.
const slug = (s) => String(s).toLowerCase().trim()
  .replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72);

/**
 * Five patterns. Each is a <pattern> body drawn in `ink`; which one an
 * entry gets is decided by hashing its title, so it is stable across
 * builds and unrelated to the order things happen to be in.
 */
const PATTERNS = [
  (ink) => `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.7" fill="${ink}"/></pattern>`,
  (ink) => `<pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="${ink}" stroke-width="1"/></pattern>`,
  (ink) => `<pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M-2 24 24-2" stroke="${ink}" stroke-width="1.3"/></pattern>`,
  (ink) => `<pattern id="p" width="120" height="120" patternUnits="userSpaceOnUse"><circle cx="60" cy="60" r="46" fill="none" stroke="${ink}" stroke-width="1"/><circle cx="60" cy="60" r="20" fill="none" stroke="${ink}" stroke-width="1"/></pattern>`,
  (ink) => `<pattern id="p" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 22q15-18 30 0t30 0" fill="none" stroke="${ink}" stroke-width="1.2"/></pattern>`,
];

/** Wrap a title onto at most three lines of roughly `per` characters. */
function wrap(text, per = 22, max = 3) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = []; let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= per) cur += ' ' + w;
    else { lines.push(cur); cur = w; if (lines.length === max) break; }
  }
  if (cur && lines.length < max) lines.push(cur);
  if (lines.length === max && words.join(' ').length > lines.join(' ').length) {
    lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lines;
}

/** Initials for the corner mark — the site's, not the entry's. */
const MONOGRAM = (() => {
  const parts = String(cfg.author || cfg.title || 'Im').trim().split(/\s+/);
  const a = parts[0]?.[0] ?? 'I';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? 'm');
  return (a + b).toUpperCase();
})();

/**
 * One 1200×675 cover. Dark by design: a picture sits on top of the page
 * in both themes, so it has to be legible against either, and white type
 * on a deep field is the one combination that always is.
 */

/* The collection's mark, on a 24-unit grid. The same drawings as
 * _includes/utility/mark.html — a cover has to work as a standalone file,
 * where no icon font is loaded and no stylesheet applies, so the shapes
 * are paths rather than glyphs. */
const MARKS = {
  posts:      '<path d="M4 20h4L20 8a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="M14 6l4 4"/>',
  portfolio:  '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
  videos:     '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M10 9l5 3-5 3V9Z" fill="currentColor" stroke="none"/>',
  webseries:  '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M10 8.5l4 2.5-4 2.5v-5Z" fill="currentColor" stroke="none"/>',
  episodes:   '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 9h20M2 15h20"/><path d="M7 5v14M17 5v14"/>',
  courses:    '<path d="M12 4 2 9l10 5 10-5-10-5Z"/><path d="M6 11.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>',
  lessons:    '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M8 8h8M8 12h5"/>',
  snippets:   '<path d="M8 6 3 12l5 6"/><path d="M16 6l5 6-5 6"/><path d="M13 4l-2 16"/>',
  prompts:    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/>',
  podcast:    '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
  newsletter: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m2.5 7 9.5 6 9.5-6"/>',
  travel:     '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
  uses:       '<path d="M15 4.5a4.5 4.5 0 0 0-5.9 5.7L3.6 15.7a2 2 0 0 0 2.8 2.8l5.5-5.5A4.5 4.5 0 0 0 17.5 7L15 9.5 13 8l2.5-2.5Z"/>',
  tags:       '<path d="M3 11V4h7l10 10-7 7L3 11Z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/>',
};
const MARK_FALLBACK = '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>';

function cover({ title, kicker = '', meta = '', label = 'posts', seed, portrait = false }) {
  // A reel is shot 9:16, and a portrait card cropped out of a landscape
  // drawing loses most of the mark. Same art, the frame it belongs in.
  const W = portrait ? 720 : 1200;
  const H = portrait ? 1280 : 675;
  const hue = collectionHue(H, label);
  const s = Math.max(S, 0.4);
  // Tinted charcoal, not a slab of colour: a cover has to sit behind a
  // title and beside five others without shouting. The hue is legible,
  // the saturation is not the point.
  const bgA = hsl(hue, s * 0.30, 0.12);
  const bgB = hsl(hue, s * 0.44, 0.22);
  const glow = hsl(hue, s * 0.9, 0.52, 0.38);
  const ink = hsl(hue, s * 0.4, 0.75, 0.16);
  const rule = hsl(hue, s * 0.85, 0.66);
  const pattern = PATTERNS[hash(seed ?? title) % PATTERNS.length](ink);
  const mark = MARKS[label] || MARK_FALLBACK;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="14%" r="70%">
      <stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    ${pattern}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#p)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g transform="translate(${W / 2 - 120} ${H / 2 - 120}) scale(10)" fill="none" stroke="#fff" stroke-opacity="0.85"
     stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" color="#fff">
    ${mark}
  </g>
</svg>
`;
}

function write(rel, body) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!FORCE && fs.existsSync(dest) && fs.readFileSync(dest, 'utf8') === body) return false;
  fs.writeFileSync(dest, body);
  return true;
}

/** Read an entry's front matter — just enough of it for a cover. */
function frontMatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!m) return {};
  try { return Y.parse(m[1]) || {}; } catch { return {}; }
}

let made = 0;

// ── 1. One fallback cover per collection ───────────────────────────────
// Written to the path the collection's own `image:` names, so the config
// stays the single source of truth and a renamed cover is never orphaned.
for (const [label, c] of Object.entries(cfg.collections || {})) {
  const body = cover({
    title: c.title || label,
    kicker: 'Collection',
    meta: c.description || '',
    label,
    seed: label,
  });
  const rel = String(c.image || `/assets/img/covers/${label}.svg`).replace(/^\//, '');
  if (!rel.endsWith('.svg')) continue;   // a real picture — leave it alone
  if (write(rel, body)) made++;
}

// ── 2. Dummy art for whatever content is actually here ─────────────────
// So a freshly cloned repo LOOKS finished the first time it is served —
// every card has a picture, and no two pictures are the same.
for (const label of Object.keys(cfg.collections || {})) {
  const dir = path.join(ROOT, `_${label}`);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => /\.(md|markdown|html)$/.test(f))) {
    const fm = frontMatter(path.join(dir, file));
    const name = slug(fm.title || file.replace(/\.\w+$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
    const singular = cfg.collections[label].singular || label;
    const body = cover({
      title: fm.title || name,
      kicker: fm.kind || singular,
      portrait: fm.orientation === 'portrait' || fm.reel === true,
      meta: [fm.lang, fm.model, fm.duration, fm.year, (fm.tags || []).slice(0, 2).join(' · ')].filter(Boolean).join('  ·  '),
      label,
      seed: `${label}/${name}`,
    });
    // Posts draw their cover inline instead — a file adds nothing when
    // the art is the collection's colour and mark, and a file has to be
    // redrawn every time the accent changes. See utility/thumb.html.
    if (label === 'posts') continue;
    if (write(`assets/img/demo/${label}-${name}.svg`, body)) made++;
  }
}

// ── 3. The last resort ─────────────────────────────────────────────────
if (write('assets/img/placeholder.svg', cover({
  title: cfg.title || 'Scratchpad',
  kicker: cfg.job_title || '',
  meta: String(cfg.url || '').replace(/^https?:\/\//, ''),
  label: 'pages',
  seed: 'placeholder',
}))) made++;

// ── 4. A social card ───────────────────────────────────────────────────
if (write('assets/img/social-card.svg', cover({
  title: cfg.title || 'Scratchpad',
  kicker: '',
  meta: cfg.description ? String(cfg.description).slice(0, 72) : '',
  label: 'posts',
  seed: 'social',
}))) made++;

console.log(made
  ? `  ✓ drew ${made} cover${made === 1 ? '' : 's'} from accent ${ACCENT}`
  : '  · covers already up to date (use --force to redraw)');
