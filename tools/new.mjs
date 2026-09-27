#!/usr/bin/env node
/**
 * `npm run new <collection> "Title"` — scaffold one entry, correctly.
 *
 * Every collection wants slightly different front matter (a video wants a
 * `video_id`, a snippet wants a `lang`, a project wants a `repo` and a
 * `kind`), and getting it wrong is the single most common way a card
 * renders half-empty. This writes the right shape, with every optional
 * key present but commented, so the choice is visible rather than
 * remembered.
 *
 *   npm run new post     "Why I rewrote the build"
 *   npm run new project  "CRM Analytics Academy" --kind film
 *   npm run new snippet  "Debounce in six lines" --lang JavaScript
 *   npm run new page     "Uses"
 *
 * Singular or plural, collection label or `singular:` name — all work.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import * as Y from './lib/yaml-lite.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const cfg = Y.parse(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'));

const argv = process.argv.slice(2);
const opt = (n, d = '') => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));

const [kindArg, ...titleParts] = positional;
const title = titleParts.join(' ').trim();

const slug = (s) => String(s).toLowerCase().trim()
  .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72);

function usage(msg) {
  const names = Object.entries(cfg.collections || {})
    .map(([l, c]) => `${(c.singular || l).toLowerCase()} (${l})`).join(', ');
  console.error(`
  ${msg}

  Usage:  npm run new <kind> "Title" [--tags a,b] [--draft]

  Kinds:  ${names}, page
`);
  process.exit(1);
}

if (!kindArg) usage('Which kind of thing?');
if (!title) usage('It needs a title.');

/** Match "post", "posts", "Post" or the label itself. */
function resolveCollection(word) {
  const w = String(word).toLowerCase();
  for (const [label, c] of Object.entries(cfg.collections || {})) {
    if (w === label) return label;
    if (w === String(c.singular || '').toLowerCase()) return label;
    if (w + 's' === label) return label;
  }
  return null;
}

/** Today, in the author's own time zone — a post filed at 11pm should not
 *  be dated tomorrow because UTC says so. */
function localDate() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
const today = localDate();
const tags = opt('tags') ? opt('tags').split(',').map((t) => t.trim()).filter(Boolean) : [];
const draft = argv.includes('--draft');

/** Per-collection front matter. Shown keys are set; hinted keys are commented. */
const SHAPES = {
  posts: () => ({
    set: { title, date: today, description: '', tags: tags.length ? tags : ['write', 'something'] },
    hint: [
      ['image', '/assets/img/covers/blog.svg', 'a cover. Leave it out and Scratchpad draws one from this front matter'],
      ['read_time', '6', 'minutes. Left out, it is estimated from the word count'],
      ['sidebar', 'false', 'hide the reading sidebar on this one page'],
      ['comments', 'false', 'hide the comment thread'],
    ],
    body: `Open with the thing you actually want to say. The first paragraph is
what shows up as the excerpt on the card and in search.

<!-- more -->

## The part with the detail in it

Everything below the \`more\` marker is the article.
`,
  }),
  portfolio: () => ({
    set: {
      title, date: today, kind: opt('kind', 'project'), summary: '',
      year: today.slice(0, 4), role: '', stack: tags.length ? tags : ['Jekyll', 'CSS'],
    },
    hint: [
      ['repo', 'https://github.com/you/thing', 'shows the GitHub-style header and Source button'],
      ['demo', 'https://thing.example.com', 'adds a Live site button'],
      ['lang', 'TypeScript', 'the language dot on the card'],
      ['stars', '128', 'and forks: — shown in the card meta'],
      ['image', '/assets/img/covers/portfolio.svg', 'a cover'],
      ['facts', '', 'a row of label/value pairs under the header — see docs/content.md'],
    ],
    body: `What it is, in one paragraph, for someone who has thirty seconds.

## The problem

## What I built

## What it cost

Numbers if you have them. A project page with a number in it is worth
three without.
`,
  }),
  videos: () => ({
    set: { title, date: today, video_id: opt('video', 'aqz-KE-bpKQ'), duration: '', description: '', tags },
    hint: [
      ['video_embed', '<iframe …>', 'use instead of video_id for anything not on YouTube'],
      ['image', '/assets/img/covers/videos.svg', 'a poster frame'],
    ],
    body: `A paragraph about what is in the film and why you made it.

## Chapters

- **00:00** — Cold open
- **01:12** — The bit that took three days
`,
  }),
  snippets: () => ({
    set: { title, date: today, lang: opt('lang', 'JavaScript'), description: '', tags },
    hint: [['image', '', 'snippets draw their own card — a cover is rarely worth it']],
    body: `One or two lines on when you would reach for this.

\`\`\`js
// the snippet
\`\`\`

**Why it works.** The part a reader could not have guessed.
`,
  }),
  prompts: () => ({
    set: { title, date: today, model: opt('model', 'Any'), description: '', tags },
    hint: [['prompt', '|', 'the prompt itself, as a block scalar — it gets its own copy button']],
    body: `What this prompt is for, and what it is bad at.

## How to use it

## What good output looks like
`,
  }),
};

const generic = () => ({
  set: { title, date: today, description: '', tags },
  hint: [['image', '', 'a cover; left out, Scratchpad draws one']],
  body: `Write the thing.\n`,
});

function render(shape, layout) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(shape.set)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.join(', ')}]`);
    else if (v === '') lines.push(`${k}: ""`);
    else lines.push(`${k}: ${/[:#]/.test(String(v)) ? JSON.stringify(v) : v}`);
  }
  if (layout) lines.push(`layout: ${layout}`);
  if (draft) lines.push('published: false');
  if (shape.hint?.length) {
    lines.push('');
    lines.push('# Optional — uncomment what you need:');
    for (const [k, v, why] of shape.hint) lines.push(`# ${k}: ${v}${why ? `   # ${why}` : ''}`);
  }
  lines.push('---', '', shape.body);
  return lines.join('\n');
}

let dest, shape, what;
if (kindArg.toLowerCase() === 'page') {
  shape = { set: { title, description: '', permalink: `/${slug(title)}/` }, hint: [], body: `## ${title}\n\nWrite the page.\n` };
  dest = path.join(ROOT, `${slug(title)}.md`);
  what = 'page';
} else {
  const label = resolveCollection(kindArg);
  if (!label) usage(`No collection called "${kindArg}".`);
  const builder = SHAPES[label] || generic;
  shape = builder();
  const name = label === 'posts' ? `${today}-${slug(title)}.md` : `${slug(title)}.md`;
  dest = path.join(ROOT, `_${label}`, name);
  what = cfg.collections[label].singular || label;
}

if (fs.existsSync(dest)) {
  console.error(`\n  ✗ ${path.relative(ROOT, dest)} already exists.\n`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, render(shape, kindArg.toLowerCase() === 'page' ? 'page' : null));

console.log(`
  ✓ new ${what}:  ${path.relative(ROOT, dest)}
    ${draft ? 'Draft — it will not be published until you remove `published: false`.' : 'It is live the moment you push.'}
    No cover needed: Scratchpad draws one from the front matter.
`);
