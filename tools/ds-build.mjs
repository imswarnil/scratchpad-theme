#!/usr/bin/env node
/**
 * tools/ds-build.mjs — package Scratchpad CSS for stacks that are not Jekyll.
 *
 * WHY THIS EXISTS. The design is authored once, in `_sass/scratchpad/`, and
 * Jekyll compiles it as part of building the site. Every other stack Scratchpad
 * targets — plain HTML, Astro, Hugo, Next, Nuxt, Gatsby, WordPress, Ghost — has
 * a different build, and some have none at all. So the shipped artifact is plain
 * CSS with no toolchain attached, and it is taken from the stylesheet the site
 * itself serves rather than compiled a second time. There is no second
 * toolchain, so there is nothing to drift: if the site looks right, dist/ is
 * right, by construction.
 *
 *   npm run ds:build        # after a build; pass --build to run one first
 *
 * Writes design/dist/:
 *   scratchpad.css       the stylesheet, with a banner
 *   scratchpad.min.css   comments and slack removed, nothing reordered
 *   tokens.json          every --sp-* value, light and dark, as data
 *   manifest.json        what was built, from which commit, and how big
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const built = path.join(root, '_site', 'assets', 'styles.css');
const dist = path.join(root, 'design', 'dist');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

if (process.argv.includes('--build') || !fs.existsSync(built)) {
  console.log('  building the site first…');
  execFileSync(path.join(root, 'bin', 'build'), { cwd: root, stdio: 'inherit' });
}

const css = fs.readFileSync(built, 'utf8');

/* ── the banner ───────────────────────────────────────────────────────── */
/* The banner carries no commit and no date on purpose: either one would make
 * dist/ differ on every build and fill the history with diffs that mean
 * nothing. manifest.json records both, which is where a consumer should look. */
const banner = `/*!
 * Scratchpad CSS ${pkg.version} — the design behind Scratchpad, a dev portfolio theme.
 * ${pkg.homepage}  ·  MIT
 *
 * Generated. Authored in _sass/scratchpad/ and taken from the stylesheet the
 * demo site serves, so this file and the site can never disagree.
 *
 * Everything is namespaced sp- / --sp-. Re-theme by redeclaring custom
 * properties on :root; dark mode is [data-color-scheme="dark"] on <html>.
 */
`;

/* ── a deliberately timid minifier ────────────────────────────────────────
 * It strips comments and collapses whitespace and does nothing else: no
 * reordering, no merging, no shorthand rewriting, no colour rewriting. A
 * clever minifier is a source of bugs nobody can see in a diff; this one
 * can only ever produce the same cascade.                                   */
function minify(src) {
  let out = '', i = 0, quote = null;
  while (i < src.length) {
    const c = src[i], next = src[i + 1];
    if (quote) {                                   // inside a string: copy verbatim
      out += c;
      if (c === '\\') { out += next ?? ''; i += 2; continue; }
      if (c === quote) quote = null;
      i++; continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; i++; continue; }
    if (c === '/' && next === '*') {                // comment
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      if (!/\s$/.test(out)) out += ' ';
      continue;
    }
    if (/\s/.test(c)) {                             // whitespace run → one space
      while (i < src.length && /\s/.test(src[i])) i++;
      if (!/[\s{};:,>~+(]$/.test(out)) out += ' ';
      continue;
    }
    if (/[{};:,>~+]/.test(c)) {                     // drop the space before punctuation
      out = out.replace(/ $/, '');
      out += c; i++;
      continue;
    }
    out += c; i++;
  }
  return out.replace(/;}/g, '}').replace(/ }/g, '}').trim() + '\n';
}

/* ── the tokens, as data ──────────────────────────────────────────────────
 * A WordPress theme.json, a Tailwind config, a Figma import and a Claude
 * design project all want the values and none of them want to parse CSS.   */
function tokens(src) {
  const grab = (re) => {
    const m = src.match(re);
    if (!m) return {};
    const t = {};
    for (const [, k, v] of m[1].matchAll(/--(sp-[a-z0-9-]+)\s*:\s*([^;]+);/g)) t[k] = v.trim();
    return t;
  };
  return {
    light: grab(/:root\s*\{([^}]*)\}/),
    /* Sass compiles the attribute selector without quotes, and the dark block
       is `:root[data-color-scheme=dark]` — not a bare attribute selector. */
    dark: grab(/:root\[data-color-scheme=["']?dark["']?\]\s*\{([^}]*)\}/),
  };
}

fs.mkdirSync(dist, { recursive: true });
const plain = banner + css.replace(/^@charset[^;]*;\s*/, '');
const min = banner + minify(css.replace(/^@charset[^;]*;\s*/, ''));
const tok = tokens(css);

fs.writeFileSync(path.join(dist, 'scratchpad.css'), plain);
fs.writeFileSync(path.join(dist, 'scratchpad.min.css'), min);
fs.writeFileSync(path.join(dist, 'tokens.json'), JSON.stringify(tok, null, 2) + '\n');

/* Brace balance is the one check worth making: if the minifier ever eats a
 * brace, every rule after it silently stops applying. */
const braces = (s) => [...s].reduce((n, c) => n + (c === '{' ? 1 : c === '}' ? -1 : 0), 0);
const countOpen = (s) => (s.match(/\{/g) ?? []).length;
const ok = braces(min) === 0 && countOpen(min) === countOpen(css);
if (!ok) {
  console.error('  ✗ minified CSS does not balance — refusing to ship it');
  process.exit(1);
}

const manifest = {
  name: 'scratchpad-css',
  version: pkg.version,
  license: 'MIT',
  /* No commit, no date, no build stamp. A generated file that is committed
   * cannot record which commit produced it — the commit it names is always the
   * one before the commit it lands in — so every build would rewrite it and
   * `npm run check` would dirty a clean tree. Git already knows: ask
   * `git log -1 design/dist/`. */
  source: '_sass/scratchpad/',
  bytes: { css: plain.length, min: min.length },
  rules: countOpen(css),
  tokens: { light: Object.keys(tok.light).length, dark: Object.keys(tok.dark).length },
};
fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`
  design/dist/ written

    scratchpad.css       ${kb(plain.length)}
    scratchpad.min.css   ${kb(min.length)}   (${Math.round((1 - min.length / plain.length) * 100)}% smaller)
    tokens.json          ${manifest.tokens.light} light · ${manifest.tokens.dark} dark
    ${manifest.rules} rules, braces balanced
`);
