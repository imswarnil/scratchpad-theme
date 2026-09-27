#!/usr/bin/env node
/**
 * `npm run doctor` — check the site before you push it.
 *
 * Jekyll builds happily with a menu that points at a page nobody made, a
 * post whose cover does not exist and a collection with no landing page.
 * All three look fine locally and broken in public. This reads the config
 * and the content and says so, in the order you would want to fix them.
 *
 * Exits 1 on an ERROR, 0 on warnings — so CI can gate on it without
 * failing on "you have not written a description yet".
 *
 *   node tools/doctor.mjs [--quiet]
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import * as Y from './lib/yaml-lite.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');
const cfg = Y.parse(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'));

const errors = [];
const warnings = [];
const err = (m, fix) => errors.push([m, fix]);
const warn = (m, fix) => warnings.push([m, fix]);
const exists = (rel) => fs.existsSync(path.join(ROOT, rel.replace(/^\//, '')));

/** Front matter of one content file. */
function fm(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  if (!m) return null;
  try { return Y.parse(m[1]) || {}; } catch { return {}; }
}

/** Every page Jekyll will publish, by URL, so menus can be checked. */
function publishedUrls() {
  const urls = new Set(['/']);
  const walk = (dir, depth = 0) => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (e.name.startsWith('.') || ['_site', 'node_modules', 'vendor', 'tools', 'bin', 'docs'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (depth < 2 && !e.name.startsWith('_')) walk(rel, depth + 1); continue; }
      if (!/\.(md|markdown|html)$/.test(e.name)) continue;
      const f = fm(path.join(ROOT, rel));
      if (!f) continue;
      if (f.permalink) urls.add(String(f.permalink).replace(/\/?$/, '/'));
      else {
        const base = rel.replace(/\.(md|markdown|html)$/, '');
        urls.add('/' + (base === 'index' ? '' : base + '/'));
      }
      for (const r of [].concat(f.redirect_from || [])) urls.add(String(r).replace(/\/?$/, '/'));
    }
  };
  walk('.');
  for (const [label, c] of Object.entries(cfg.collections || {})) {
    if (c.landing) urls.add(String(c.landing).replace(/\/?$/, '/'));
    const dir = path.join(ROOT, `_${label}`);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((n) => /\.(md|markdown|html)$/.test(n))) {
      const d = fm(path.join(dir, f)) || {};
      const name = f.replace(/\.(md|markdown|html)$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
      const pat = String(c.permalink || `/${label}/:name/`);
      urls.add(pat.replace(':title', d.slug || name).replace(':name', d.slug || name).replace(/\/?$/, '/'));
    }
  }
  // Tag pages are generated on demand by the archive, not as files.
  urls.add('/tags/'); urls.add('/search/'); urls.add('/archive/');
  return urls;
}

// ── the config ─────────────────────────────────────────────────────────
if (!cfg.url) err('`url:` is not set in _config.yml.', 'Absolute links, the sitemap and every social card need it.');
else if (String(cfg.url).endsWith('/')) warn('`url:` ends with a slash.', 'Drop it — Jekyll adds one, and you get //double// paths.');
if (!cfg.title) err('`title:` is not set.', 'It is the tab title and the name in every search result.');
if (!cfg.description) warn('`description:` is not set.', 'This is your search result. Write one sentence.');
else if (String(cfg.description).length > 170) warn(`\`description:\` is ${String(cfg.description).length} characters.`, 'Search engines cut it around 155.');
if (cfg.accent_color && !/^(#|rgb|hsl|oklch|color\()/.test(String(cfg.accent_color).trim())) {
  warn(`\`accent_color: ${cfg.accent_color}\` does not look like a CSS colour.`, 'Try a hex value like #2563eb.');
}
if (cfg.baseurl && !String(cfg.baseurl).startsWith('/')) err('`baseurl:` must start with a slash.', 'e.g. "/my-repo".');
if (exists('CNAME')) {
  const cname = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
  const host = String(cfg.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (cname && host && cname !== host) {
    warn(`CNAME says "${cname}" but url: says "${host}".`, 'They should match, or links will point at the wrong host.');
  }
}
for (const key of ['logo', 'avatarurl', 'placeholder_image']) {
  if (cfg[key] && String(cfg[key]).startsWith('/') && !exists(cfg[key])) {
    err(`\`${key}: ${cfg[key]}\` does not exist.`, 'Point it at a real file in assets/.');
  }
}

// ── the collections ────────────────────────────────────────────────────
const urls = publishedUrls();
for (const [label, c] of Object.entries(cfg.collections || {})) {
  const dir = `_${label}`;
  if (!exists(dir)) { err(`Collection "${label}" has no ${dir}/ folder.`, `mkdir ${dir} — or remove it from _config.yml.`); continue; }
  const entries = fs.readdirSync(path.join(ROOT, dir)).filter((f) => /\.(md|markdown|html)$/.test(f));
  if (!entries.length) warn(`Collection "${label}" is empty.`, `npm run new ${c.singular ? c.singular.toLowerCase() : label} "My first one"`);
  if (!c.output) warn(`Collection "${label}" has \`output: false\`.`, 'Its entries will not get pages of their own.');

  const landing = String(c.landing || `/${label}/`).replace(/\/?$/, '/');
  if (!urls.has(landing)) {
    err(`Collection "${label}" says it lists at ${landing}, but no page has that permalink.`,
      `Create ${label}.md with \`list_collection: ${label}\` and \`permalink: ${landing}\`.`);
  }
  if (c.image && String(c.image).startsWith('/') && !exists(c.image)) {
    err(`Collection "${label}" points at a cover that does not exist: ${c.image}`, 'Run `npm run thumbs` to draw it.');
  }
  for (const f of entries) {
    const rel = `${dir}/${f}`;
    const d = fm(path.join(ROOT, rel));
    if (d === null) { err(`${rel} has no front matter.`, 'Jekyll will copy it verbatim instead of rendering it.'); continue; }
    if (!d.title) err(`${rel} has no \`title:\`.`, 'Cards, search and the sitemap all need it.');
    if (!d.date && label !== 'pages') warn(`${rel} has no \`date:\`.`, 'It will sort to the bottom of every list.');
    if (!d.description && !d.summary && !d.excerpt) {
      warn(`${rel} has no \`description:\`.`, 'The card blurb and the social card fall back to the first paragraph.');
    }
    for (const key of ['image', 'cover']) {
      if (d[key] && String(d[key]).startsWith('/') && !exists(d[key])) {
        err(`${rel} → \`${key}: ${d[key]}\` does not exist.`, 'Remove the key and Scratchpad will draw a cover instead.');
      }
    }
    if (label === 'videos' && !d.video_id && !d.video_embed) {
      warn(`${rel} has neither \`video_id:\` nor \`video_embed:\`.`, 'The page will render without a player.');
    }
    if (label === 'portfolio' && d.repo && !/^https?:\/\//.test(String(d.repo))) {
      warn(`${rel} → \`repo:\` is not a URL.`, 'The card builds its owner/name slug from a full GitHub URL.');
    }
  }
}

// ── the menus ──────────────────────────────────────────────────────────
const checkNav = (rows, where) => {
  for (const item of rows || []) {
    if (item.children) checkNav(item.children, where);
    if (item.groups) for (const g of item.groups) checkNav(g.items, where);
    if (item.featured) checkNav([item.featured], where);
    if (!item.url) continue;
    const u = String(item.url);
    if (/^(https?:|mailto:|#)/.test(u)) continue;
    if (!urls.has(u.replace(/\/?$/, '/'))) {
      err(`${where} → "${item.title}" links to ${u}, which no page publishes.`, 'Fix the URL, or make the page.');
    }
  }
};
checkNav(cfg.navigation_header, 'navigation_header');
checkNav(cfg.navigation_footer, 'navigation_footer');
checkNav(cfg.navigation_legal, 'navigation_legal');

// ── the things that are easy to forget ─────────────────────────────────
if (cfg.adsense?.enabled && !cfg.adsense?.client) err('AdSense is on but `adsense.client` is empty.', 'Every ad slot will render blank.');
if (cfg.footer?.newsletter?.enabled && !cfg.footer?.newsletter?.action) {
  warn('The newsletter form is on but has no `action:`.', 'It will render disabled until you paste your endpoint in.');
}
// The contact form is a DIFFERENT endpoint from the newsletter: two things
// going to two places. Wiring one to the other fills a signup list with
// project enquiries.
if (!cfg.contact?.action) {
  warn('The contact form has no `action:`.', 'Set `contact.action` in _config.yml; the email link works either way.');
}
if (cfg.header?.github?.enabled && !/^[\w.-]+\/[\w.-]+$/.test(String(cfg.header?.github?.repo || ''))) {
  warn('`header.github.repo` is not in owner/repo form.', 'The star count will not load.');
}
if (!exists('.github/workflows')) warn('No GitHub Actions workflow found.', 'Nothing will deploy on push.');

// ── report ─────────────────────────────────────────────────────────────
const line = (mark, [m, fix]) => `  ${mark} ${m}\n      ${fix}`;
if (!QUIET || errors.length) {
  console.log('');
  if (errors.length) { console.log(`  ${errors.length} problem${errors.length === 1 ? '' : 's'}\n`); for (const e of errors) console.log(line('✗', e)); console.log(''); }
  if (warnings.length && !QUIET) { console.log(`  ${warnings.length} thing${warnings.length === 1 ? '' : 's'} worth a look\n`); for (const w of warnings) console.log(line('·', w)); console.log(''); }
  if (!errors.length && !warnings.length) console.log('  ✓ Everything checks out.\n');
  else if (!errors.length) console.log('  ✓ Nothing broken — the site will build and deploy.\n');
}
process.exit(errors.length ? 1 : 0);
