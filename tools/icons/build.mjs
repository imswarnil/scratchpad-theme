#!/usr/bin/env node
/**
 * Build the theme's icon set into one stylesheet.
 *
 * The theme used to load an icon font from a CDN. That is a third party on
 * every page load, and it ships two thousand glyphs to draw eighty. This
 * takes the eighty the theme actually uses, from Lucide (ISC), and writes
 * them as CSS custom properties holding inline SVG — so an icon is a
 * `mask-image` painted in `currentColor`, with no request, no font file
 * and no flash of the wrong glyph.
 *
 * The class names stay what they were (`ph-house`), so no markup changed
 * when this replaced the font.
 *
 *   node tools/icons/build.mjs            # writes _sass/scratchpad/base/_icons.scss
 *   node tools/icons/build.mjs --check    # lists icons used but not mapped
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, '_sass', 'im', 'base', '_icons.scss');

// Where the source drawings come from. Lucide is ISC-licensed; the notice
// travels in assets/icons/NOTICE.txt. A checkout without it falls back to
// whatever is already mapped, so a build never fails for want of icons.
const LUCIDE = path.resolve(ROOT, '..', 'design.imswarnil.com', 'node_modules', 'lucide-static', 'icons');

/** The theme's name → Lucide's name. Ours are Phosphor's, historically. */
const MAP = {
  'address-book': 'contact', 'arrow-bend-down-right': 'corner-down-right',
  'arrow-left': 'arrow-left', 'arrow-right': 'arrow-right',
  'arrow-square-out': 'external-link', 'arrow-up': 'arrow-up',
  'arrow-up-right': 'arrow-up-right', 'arrows-in-line-vertical': 'fold-vertical',
  'arrows-out-line-vertical': 'unfold-vertical', 'book-open': 'book-open',
  briefcase: 'briefcase', 'calendar-blank': 'calendar', 'calendar-check': 'calendar-check',
  'caret-down': 'chevron-down', 'caret-right': 'chevron-right', certificate: 'award',
  'chat-circle': 'message-circle', 'chats-circle': 'messages-square', check: 'check',
  clock: 'clock', 'clock-counter-clockwise': 'history', code: 'code', copy: 'copy',
  'device-mobile-camera': 'smartphone', 'dots-three': 'ellipsis', envelope: 'mail',
  'envelope-simple': 'mail', 'facebook-logo': 'facebook', 'file-code': 'file-code',
  'file-pdf': 'file-text', 'file-text': 'file-text', 'film-slate': 'clapperboard',
  gauge: 'gauge', 'git-branch': 'git-branch', 'git-fork': 'git-fork',
  'git-pull-request': 'git-pull-request', 'github-logo': 'github', globe: 'globe',
  'graduation-cap': 'graduation-cap', hammer: 'hammer', hash: 'hash',
  headphones: 'headphones', heart: 'heart', house: 'house',
  'identification-card': 'id-card', image: 'image', info: 'info', layout: 'layout-panel-top',
  link: 'link', 'linkedin-logo': 'linkedin', list: 'menu', 'list-bullets': 'list',
  'list-checks': 'list-checks', 'list-dashes': 'list', 'list-numbers': 'list-ordered',
  'magnifying-glass': 'search', 'map-pin': 'map-pin', 'map-trifold': 'map',
  microphone: 'mic', 'microphone-stage': 'mic-vocal', 'monitor-play': 'monitor-play',
  moon: 'moon', note: 'notebook-pen', 'paper-plane-tilt': 'send', 'pen-nib': 'pen-tool',
  phone: 'phone', play: 'play', 'play-circle': 'circle-play', 'plus-circle': 'circle-plus',
  prohibit: 'ban', 'reddit-logo': 'message-circle', robot: 'bot',
  'rocket-launch': 'rocket', rows: 'rows-3', rss: 'rss', scissors: 'scissors',
  'share-network': 'share-2', sparkle: 'sparkles', 'squares-four': 'layout-grid',
  stack: 'layers', star: 'star', sun: 'sun', tag: 'tag', 'telegram-logo': 'send',
  translate: 'languages', 'tree-structure': 'network', trophy: 'trophy', user: 'user',
  'user-circle': 'circle-user', video: 'video', 'whatsapp-logo': 'message-circle',
  wrench: 'wrench', x: 'x', 'x-logo': 'x', 'youtube-logo': 'youtube',
  'film-strip': 'film', article: 'file-text', 'cooking-pot': 'cooking-pot',
  'caret-up': 'chevron-up', folder: 'folder', 'trend-up': 'trending-up',
  'trend-down': 'trending-down', 'check-circle': 'circle-check', 'lightbulb': 'lightbulb',
  'warning': 'triangle-alert', 'warning-circle': 'circle-alert', palette: 'palette',
  'stack-simple': 'layers-2', 'squares-four-alt': 'layout-grid', 'notebook': 'notebook',
  'download': 'download', 'buildings': 'building-2', 'student': 'graduation-cap',
  archive: 'archive', 'chart-line-up': 'trending-up', 'dots-three-outline': 'ellipsis',
  timer: 'timer', 'gear': 'settings', 'bookmark': 'bookmark', 'compass': 'compass',
  'currency-circle-dollar': 'circle-dollar-sign', 'seal-check': 'badge-check',
  'medal': 'medal', 'wifi-high': 'wifi', 'coffee': 'coffee', 'shopping-bag': 'shopping-bag',
};

/** The brand marks. Lucide dropped its brand icons, and a logo is a
 *  trademark rather than an icon set's to give away — these are simple,
 *  recognisable shapes drawn here, filled rather than stroked. */
const BRANDS = {
  'github-logo': "<path fill='currentColor' stroke='none' d='M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2Z'/>",
  'linkedin-logo': "<path fill='currentColor' stroke='none' d='M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.65h.05A4.17 4.17 0 0 1 16.6 8.7c3.99 0 4.73 2.5 4.73 5.76V21h-4v-5.66c0-1.35-.03-3.09-1.9-3.09-1.9 0-2.19 1.47-2.19 2.99V21H9V9Z'/>",
  'youtube-logo': "<path fill='currentColor' stroke='none' d='M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z'/>",
  'facebook-logo': "<path fill='currentColor' stroke='none' d='M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z'/>",
  file: "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path d='M14 2v6h6'/>",
};

/** Which icons the templates actually ask for. */
function used() {
  const found = new Set();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/^(_site|node_modules|\.git)$/.test(e.name)) walk(p); continue; }
      if (!/\.(html|md|js|scss)$/.test(e.name)) continue;
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/ph-(?:bold|fill)\s+ph-([a-z0-9-]+)/g)) found.add(m[1]);
      for (const m of s.matchAll(/ph-\{\{[^}]*default:\s*'([a-z0-9-]+)'/g)) found.add(m[1]);
    }
  };
  walk(ROOT);

  // Icons named in CONFIG rather than in markup — a collection's `icon:`,
  // a nav item's, a footer column's. The templates write them as
  // `ph-{{ item.icon }}`, so scanning the markup alone misses every one.
  const cfg = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8');
  for (const m of cfg.matchAll(/^\s*icon:\s*["']?([a-z0-9-]+)["']?\s*$/gm)) found.add(m[1]);
  for (const m of cfg.matchAll(/icon:\s*ph-([a-z0-9-]+)/g)) found.add(m[1]);
  // `icon: ph-buildings` matches the line rule above as well, with the
  // prefix still attached. Drop those; the rule below already added the
  // bare name.
  for (const n of [...found]) if (n.startsWith('ph-')) found.delete(n);

  found.delete('');
  // `ph-trend-{{ ... }}` is a Liquid expression, not an icon name.
  for (const n of [...found]) if (n.endsWith('-')) found.delete(n);
  return [...found].sort();
}

/** Lucide ships each icon as a standalone svg; take what is inside it. */
function body(name) {
  const f = path.join(LUCIDE, `${name}.svg`);
  if (!fs.existsSync(f)) return null;
  const svg = fs.readFileSync(f, 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  return inner.replace(/\s+/g, ' ');
}

function dataUri(inner) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  // Only what a url() cannot carry raw. Keeping the rest readable makes the
  // generated file reviewable, which a base64 blob is not.
  return 'data:image/svg+xml,' + svg
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E');
}

const names = used();
const missing = [];
const rules = [];

for (const n of names) {
  const inner = BRANDS[n] || (MAP[n] ? body(MAP[n]) : null);
  if (!inner) { missing.push(n); continue; }
  rules.push(`.ph-${n} { --sp-icon: url("${dataUri(inner)}"); }`);
}

if (process.argv.includes('--check')) {
  console.log(`  ${names.length} icons used, ${rules.length} mapped`);
  if (missing.length) console.log('  unmapped:', missing.join(' '));
  process.exit(missing.length ? 1 : 0);
}

const header = `// ======================================================================
// base/_icons.scss — GENERATED by tools/icons/build.mjs. Do not edit.
// ----------------------------------------------------------------------
// The theme's icons, as inline SVG in custom properties. An icon is a
// mask painted in currentColor, so it inherits colour and size from the
// text beside it and costs no request.
//
// This replaced an icon font loaded from a CDN: a third party on every
// page load, shipping two thousand glyphs to draw ${rules.length}. The class names
// are unchanged, so no markup moved.
//
// Drawings: Lucide (ISC) — see assets/icons/NOTICE.txt.
// Regenerate: npm run icons
// ======================================================================

[class*="ph-"] {
  display: inline-block;
  width: 1em;
  height: 1em;
  flex: none;
  vertical-align: -0.125em;
  background-color: currentColor;
  mask-image: var(--sp-icon);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-image: var(--sp-icon);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

// A "fill" icon is the same drawing with the strokes filled — near enough
// at the sizes these are used, and one file instead of two.
.ph-fill { mask-size: contain; }

`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, header + rules.join('\n') + '\n');
console.log(`  ✓ wrote ${rules.length} icons to _sass/scratchpad/base/_icons.scss`);
if (missing.length) console.log(`  ! ${missing.length} unmapped: ${missing.join(' ')}`);
