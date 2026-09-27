/**
 * apply.mjs — turn the wizard's answers into files on disk.
 *
 * Kept separate from server.mjs, and free of any HTTP or process concerns,
 * so it can be called from a test (or from another script) with a plain
 * object and a root path. Everything it writes is listed in the report it
 * returns, and everything it replaces is copied to a timestamped folder
 * under .scratchpad-backup/ first — the wizard never destroys work, even when
 * someone answers the form wrongly and runs it again.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as E from '../lib/yaml-edit.mjs';
import * as Y from '../lib/yaml-lite.mjs';

const ICONS = {
  posts: 'pen-nib', portfolio: 'briefcase', videos: 'video',
  snippets: 'code', prompts: 'sparkle', notes: 'note', books: 'book-open',
  talks: 'microphone-stage', photos: 'camera', uses: 'wrench',
};

const SCHEMAS = {
  posts: 'BlogPosting', portfolio: 'CreativeWork', videos: 'VideoObject',
  snippets: 'TechArticle', prompts: 'CreativeWork',
};

export const STYLES = ['numbered', 'gallery', 'featured', 'compact', 'cards'];

const slug = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** A single timestamped backup folder for one run of the wizard. */
function makeBackup(root) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join(root, '.scratchpad-backup', stamp);
  let used = false;
  return {
    dir,
    /** Copy a path into the backup, preserving its position in the tree. */
    keep(rel) {
      const src = path.join(root, rel);
      if (!fs.existsSync(src)) return false;
      const dest = path.join(dir, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.cpSync(src, dest, { recursive: true });
      used = true;
      return true;
    },
    /** Move a path into the backup — the wizard's version of deleting. */
    retire(rel) {
      if (!this.keep(rel)) return false;
      fs.rmSync(path.join(root, rel), { recursive: true, force: true });
      return true;
    },
    get used() { return used; },
  };
}

/** Everything the demo site ships that a new owner will not want. */
export const DEMO_CONTENT = [
  '_posts/2017-07-10-no-campus-job-lessons.md',
  '_posts/2025-04-02-lightweight-theming.md',
  '_posts/2025-06-02-why-cinematic-web.md',
  '_portfolio/cinematic-reel.md',
  '_portfolio/crm-analytics-academy.md',
  '_portfolio/project-sample.md',
  '_videos/video-sample.md',
  '_snippets/debounce.md',
  '_snippets/saql-windowing.md',
  '_prompts/pr-review-prompt.md',
];

/** The starter entry written into an emptied or brand-new collection. */
function starterEntry(label, singular, today) {
  return `---
title: "Hello, ${singular.toLowerCase()}"
date: ${today}
description: "One line that tells a reader what this is. It becomes the card
  blurb, the search result and the social card."
tags: [getting-started]
---

This is your first ${singular.toLowerCase()}. Delete it and write your own —
or run \`npm run new ${label} "My title"\` to scaffold the next one.

Scratchpad draws a cover for any entry that has no \`image:\`, straight from
this front matter, so you can publish before you have made any artwork.

<!-- more -->

## Write in Markdown

Anything Markdown does works here, plus a handful of components:

{% include components/callout.html type="tip" body="Components live in
_includes/components/ — see /docs/components/ for the full set." %}
`;
}

/** A landing page for a collection the wizard created. */
function landingPage(label, title) {
  return `---
layout: page
title: ${title}
list_collection: ${label}
permalink: /${label}/
---
`;
}

/**
 * @param {string} root  repository root
 * @param {object} a     the wizard's answers
 * @returns {{changed: string[], notes: string[], backup: string|null}}
 */
export function apply(root, a) {
  const changed = [];
  const notes = [];
  const backup = makeBackup(root);
  const cfgPath = path.join(root, '_config.yml');
  backup.keep('_config.yml');

  let t = fs.readFileSync(cfgPath, 'utf8');
  const before = Y.parse(t);
  const set = (p, v) => { if (v !== undefined && v !== null && v !== '') t = E.setScalar(t, p, v); };
  const setAlways = (p, v) => { if (v !== undefined && v !== null) t = E.setScalar(t, p, v); };

  // ── 1. Identity ──────────────────────────────────────────────────────
  const id = a.identity || {};
  set(['title'], id.title);
  set(['job_title'], id.job_title);
  set(['description'], id.description);
  set(['author'], id.author || id.title);
  set(['email'], id.email);
  set(['location'], id.location);
  set(['url'], String(id.url || '').replace(/\/+$/, ''));
  setAlways(['baseurl'], id.baseurl || '');
  set(['lang'], id.lang);
  set(['timezone'], id.timezone);
  set(['logo'], id.logo);
  set(['avatarurl'], id.avatarurl);
  set(['repo'], id.repo);
  if (id.company !== undefined) set(['work', 'company'], id.company);
  if (id.role !== undefined) set(['work', 'role'], id.role);
  // jekyll-seo-tag reads this one separately.
  set(['social', 'name'], id.author || id.title);

  // ── 2. Look ──────────────────────────────────────────────────────────
  const look = a.look || {};
  set(['accent_color'], look.accent_color);
  setAlways(['hero_video'], look.hero_video ?? '');
  for (const [k, v] of Object.entries(look.header || {})) setAlways(['header', k], v);
  for (const [k, v] of Object.entries(look.footer || {})) {
    if (k === 'newsletter') continue;
    setAlways(['footer', k], v);
  }
  if (look.footer?.newsletter) {
    for (const [k, v] of Object.entries(look.footer.newsletter)) {
      setAlways(['footer', 'newsletter', k], v);
    }
  }
  for (const [k, v] of Object.entries(look.reading || {})) setAlways(['layout', k], v);

  // ── 3. Navigation ────────────────────────────────────────────────────
  // The wizard writes FLAT menus. Anyone who wants a dropdown or a
  // megamenu adds `children:` / `groups:` by hand afterwards — the shapes
  // are documented in _config.yml and in /docs/navigation/, and re-running
  // the wizard is the only thing that would flatten them again.
  const clean = (rows) => (rows || [])
    .filter((r) => r && r.title && r.url)
    .map((r) => {
      const o = { title: r.title, url: r.url };
      if (r.icon) o.icon = r.icon;
      if (r.sub) o.sub = r.sub;
      return o;
    });
  const nav = a.nav || {};
  if (Array.isArray(nav.header)) {
    const rows = clean(nav.header);
    if (rows.length) t = E.setBlock(t, ['navigation_header'], E.dump(rows, 2));
    if ((before.navigation_header || []).some((i) => i.children || i.groups)) {
      notes.push('The header menu had a dropdown or a megamenu; the wizard writes flat menus, so those were replaced. See /docs/navigation/ to add them back.');
    }
  }
  if (Array.isArray(nav.footer) && nav.footer.length) t = E.setBlock(t, ['navigation_footer'], E.dump(clean(nav.footer), 2));
  if (Array.isArray(nav.legal)) {
    t = nav.legal.length
      ? E.setBlock(t, ['navigation_legal'], E.dump(clean(nav.legal), 2))
      : E.setBlock(t, ['navigation_legal'], E.dump([], 2));
  }

  // ── 4. Social ────────────────────────────────────────────────────────
  if (Array.isArray(a.social)) {
    const rows = {};
    for (const s of a.social) if (s && s.label && s.url) rows[s.label] = s.url;
    if (Object.keys(rows).length) t = E.setBlock(t, ['social_links'], E.dump(rows, 2));
    const sameAs = Object.values(rows).filter((u) => /^https?:\/\//.test(u));
    if (sameAs.length) t = E.setBlock(t, ['social', 'links'], E.dump(sameAs, 4));
  }

  // ── 5. Collections ───────────────────────────────────────────────────
  const d = new Date();
  const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  for (const c of a.collections || []) {
    const label = slug(c.label);
    if (!label) continue;
    const dir = `_${label}`;
    const title = c.title || (label[0].toUpperCase() + label.slice(1));
    const singular = c.singular || title.replace(/s$/, '');

    if (!c.enabled) {
      if (before.collections && before.collections[label]) {
        t = E.deleteKey(t, ['collections', label]);
        changed.push(`removed collection "${label}" from _config.yml`);
      }
      // `posts` is Jekyll's own; its folder stays even when unlisted.
      if (label !== 'posts') {
        for (const page of [`${label}.md`, `${label}.html`]) {
          if (backup.retire(page)) changed.push(`retired ${page}`);
        }
        if (fs.existsSync(path.join(root, dir))) {
          backup.retire(dir);
          changed.push(`retired ${dir}/`);
        }
      }
      continue;
    }

    // What the form knows about. Everything else a collection already has
    // — `card`, `single`, `permalink`, a hand-picked `image`, anything a
    // future version adds — is CARRIED OVER untouched below: the wizard
    // rewrites the keys it asked about and nothing more. Without that it
    // would silently strip the per-collection layout composition and
    // every entry page in that collection would fall back to the default.
    const prev = (before.collections && before.collections[label]) || {};
    const block = {
      output: true,
      title,
      singular,
      description: c.description || prev.description || `${title} — one line about this collection.`,
      permalink: prev.permalink || (label === 'posts' ? '/blog/:title/' : `/${label}/:name/`),
      landing: prev.landing || (label === 'posts' ? '/blog/' : `/${label}/`),
      icon: c.icon || prev.icon || ICONS[label] || 'folder',
      schema: c.schema || prev.schema || SCHEMAS[label] || 'CreativeWork',
      style: STYLES.includes(c.style) ? c.style : (prev.style || 'cards'),
      image: prev.image || `/assets/img/covers/${label}.svg`,
    };
    if (c.color) block.color = c.color;

    // Carry over every key the form never asked about, in its own order.
    for (const [k, v] of Object.entries(prev)) {
      if (!(k in block)) block[k] = v;
    }
    t = E.setBlock(t, ['collections', label], E.dump(block, 4));

    // A collection with no folder has nothing to list, and a collection
    // with no landing page cannot be linked — create both.
    if (!fs.existsSync(path.join(root, dir))) {
      fs.mkdirSync(path.join(root, dir), { recursive: true });
      fs.writeFileSync(path.join(root, dir, 'hello-world.md'), starterEntry(label, singular, today));
      changed.push(`created ${dir}/hello-world.md`);
    }
    const hasLanding = ['md', 'html'].some((e) => fs.existsSync(path.join(root, `${label}.${e}`))) ||
      (label === 'posts' && fs.existsSync(path.join(root, 'blog.html')));
    if (!hasLanding) {
      fs.writeFileSync(path.join(root, `${label}.md`), landingPage(label, title));
      changed.push(`created ${label}.md`);
    }
  }

  // ── 6. Extras ────────────────────────────────────────────────────────
  const x = a.extras || {};
  if (x.github_repo !== undefined) {
    setAlways(['header', 'github', 'enabled'], !!x.github_repo);
    if (x.github_repo) set(['header', 'github', 'repo'], x.github_repo);
  }
  if (x.newsletter_action !== undefined) setAlways(['footer', 'newsletter', 'action'], x.newsletter_action || '');
  if (x.adsense_enabled !== undefined) setAlways(['adsense', 'enabled'], !!x.adsense_enabled);
  if (x.adsense_client) set(['adsense', 'client'], x.adsense_client);
  if (x.service_worker !== undefined) setAlways(['service_worker'], !!x.service_worker);
  if (x.google_analytics) set(['google_analytics'], x.google_analytics);
  else if (x.google_analytics === '') t = E.deleteKey(t, ['google_analytics']);
  if (x.short_name) set(['short_name'], x.short_name);
  if (x.twitter_username !== undefined) set(['twitter', 'username'], x.twitter_username);

  fs.writeFileSync(cfgPath, t);
  changed.unshift('_config.yml');

  // ── 7. Deployment ────────────────────────────────────────────────────
  const dep = a.deploy || {};
  const cnamePath = path.join(root, 'CNAME');
  if (dep.cname) {
    backup.keep('CNAME');
    fs.writeFileSync(cnamePath, `${String(dep.cname).replace(/^https?:\/\//, '').replace(/\/.*$/, '')}\n`);
    changed.push('CNAME');
  } else if (dep.cname === '' && fs.existsSync(cnamePath)) {
    backup.retire('CNAME');
    changed.push('removed CNAME (the site will live at the github.io address)');
  }

  // ── 8. The demo content ──────────────────────────────────────────────
  if (dep.clean_demo) {
    let n = 0;
    for (const rel of DEMO_CONTENT) if (backup.retire(rel)) n++;
    if (n) changed.push(`retired ${n} demo entries`);
    // Leave every collection with something to render.
    for (const c of (a.collections || []).filter((c) => c.enabled)) {
      const label = slug(c.label);
      const dir = path.join(root, `_${label}`);
      if (!fs.existsSync(dir)) continue;
      const left = fs.readdirSync(dir).filter((f) => /\.(md|markdown|html)$/.test(f));
      if (left.length === 0) {
        const singular = c.singular || label.replace(/s$/, '');
        fs.writeFileSync(path.join(dir, 'hello-world.md'), starterEntry(label, singular, today));
        changed.push(`created _${label}/hello-world.md`);
      }
    }
    notes.push('The demo entries were moved into .scratchpad-backup/, not deleted — copy anything back that you wanted to keep.');
  }

  // Validate before handing control back: a config the wizard cannot
  // re-read is a config Jekyll will refuse to boot on.
  try {
    Y.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch (err) {
    fs.copyFileSync(path.join(backup.dir, '_config.yml'), cfgPath);
    throw new Error(`Wrote an unreadable _config.yml and rolled it back: ${err.message}`);
  }

  return { changed, notes, backup: backup.used ? path.relative(root, backup.dir) : null };
}
