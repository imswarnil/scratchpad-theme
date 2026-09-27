#!/usr/bin/env node
/**
 * `npm test` — the tooling's own tests.
 *
 * These cover the two pieces that can quietly corrupt someone's site:
 * the YAML reader (wrong values in, wrong site out) and the YAML editor
 * (a bad write leaves _config.yml unparseable and Jekyll refuses to
 * boot). The wizard is tested end to end against a COPY of the repo in a
 * temp directory, never against the repo itself.
 *
 * No test framework: Node's own assert, and a count at the end.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import * as Y from './lib/yaml-lite.mjs';
import * as E from './lib/yaml-edit.mjs';
import { apply } from './setup/apply.mjs';
import { accentHsl, collectionHue, hash } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const test = (name, fn) => {
  try { fn(); pass++; }
  catch (e) { fail++; console.log(`  ✗ ${name}\n      ${e.message.split('\n')[0]}`); }
};

// ── yaml-lite ──────────────────────────────────────────────────────────
test('reads scalars of every shape', () => {
  const y = Y.parse([
    'a: hello', 'b: "quoted: colon"', "c: 'single'", 'd: 42', 'e: 1.5',
    'f: true', 'g: false', 'h:', 'i: [1, two, "three"]', 'j: # only a comment',
    'k: value # trailing', 'l: "# not a comment"',
  ].join('\n'));
  assert.equal(y.a, 'hello');
  assert.equal(y.b, 'quoted: colon');
  assert.equal(y.c, 'single');
  assert.equal(y.d, 42);
  assert.equal(y.e, 1.5);
  assert.equal(y.f, true);
  assert.equal(y.g, false);
  assert.equal(y.h, null);
  assert.deepEqual(y.i, [1, 'two', 'three']);
  assert.equal(y.j, null);
  assert.equal(y.k, 'value');
  assert.equal(y.l, '# not a comment');
});

test('reads nested maps and sequences of maps', () => {
  const y = Y.parse([
    'nav:', '  - title: Home', '    url: /', '  - title: More',
    '    children:', '      - title: Deep', '        url: /deep/',
    'opts:', '  a:', '    b: 1',
  ].join('\n'));
  assert.equal(y.nav.length, 2);
  assert.equal(y.nav[1].children[0].title, 'Deep');
  assert.equal(y.opts.a.b, 1);
});

test('reads folded and literal block scalars', () => {
  const y = Y.parse(['s: >', '  one', '  two', 'l: |', '  a', '  b', 'after: x'].join('\n'));
  assert.equal(y.s, 'one two');
  assert.equal(y.l, 'a\nb');
  assert.equal(y.after, 'x');
});

test('reads an empty flow sequence written under its key', () => {
  assert.deepEqual(Y.parse('a:\n  []\nb: 1').a, []);
});

test('reads the real _config.yml', () => {
  const c = Y.parse(fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8'));
  assert.ok(c.title, 'title');
  assert.ok(Object.keys(c.collections).length >= 1, 'collections');
  assert.ok(Array.isArray(c.navigation_header), 'nav');
  assert.ok(c.resume.experience.length >= 1, 'resume survives');
});

test('get() walks a dotted path with a fallback', () => {
  const o = { a: { b: { c: 1 } } };
  assert.equal(Y.get(o, 'a.b.c'), 1);
  assert.equal(Y.get(o, 'a.x.c', 'dflt'), 'dflt');
});

// ── yaml-edit ──────────────────────────────────────────────────────────
const SAMPLE = [
  '# leading comment',
  'title: Old            # what it is called',
  'nested:',
  '  one: 1',
  '  two: 2',
  '  deep:',
  '    x: true',
  'list:',
  '  - a',
  '  - b',
  '',
  'tail: end',
].join('\n');

test('setScalar rewrites in place and keeps the comment column', () => {
  const out = E.setScalar(SAMPLE, ['title'], 'New');
  assert.match(out, /^title: New {12}# what it is called$/m);
  assert.equal(Y.parse(out).tail, 'end');
});

test('setScalar reaches a nested key without touching its siblings', () => {
  const y = Y.parse(E.setScalar(SAMPLE, ['nested', 'deep', 'x'], false));
  assert.equal(y.nested.deep.x, false);
  assert.equal(y.nested.one, 1);
  assert.equal(y.nested.two, 2);
});

test('setScalar creates a missing key, at the top level and nested', () => {
  let t = E.setScalar(SAMPLE, ['brand'], 'hi');
  t = E.setScalar(t, ['nested', 'three'], 3);
  const y = Y.parse(t);
  assert.equal(y.brand, 'hi');
  assert.equal(y.nested.three, 3);
  assert.equal(y.nested.one, 1);
});

test('setBlock swaps a whole block and keeps the comment above it', () => {
  const out = E.setBlock(SAMPLE, ['list'], E.dump(['x', 'y', 'z'], 2));
  assert.deepEqual(Y.parse(out).list, ['x', 'y', 'z']);
  assert.match(out, /^# leading comment$/m);
  assert.equal(Y.parse(out).tail, 'end');
});

test('setBlock writes an empty sequence inline', () => {
  const out = E.setBlock(SAMPLE, ['list'], E.dump([], 2));
  assert.match(out, /^list: \[\]$/m);
  assert.deepEqual(Y.parse(out).list, []);
});

test('deleteKey removes a key and everything under it', () => {
  const y = Y.parse(E.deleteKey(SAMPLE, ['nested']));
  assert.equal(y.nested, undefined);
  assert.equal(y.title, 'Old');
  assert.equal(y.tail, 'end');
});

test('scalar() quotes only what YAML would misread', () => {
  assert.equal(E.scalar('plain'), 'plain');
  assert.equal(E.scalar('/blog/'), '/blog/');
  assert.equal(E.scalar('#f22f46'), '"#f22f46"');
  assert.equal(E.scalar('a: b'), '"a: b"');
  assert.equal(E.scalar('true'), '"true"');
  assert.equal(E.scalar('12'), '"12"');
  assert.equal(E.scalar(12), '12');
  assert.equal(E.scalar(true), 'true');
  assert.equal(E.scalar(''), '""');
});

test('dump round-trips through the reader', () => {
  const value = { a: 1, b: 'two', c: [1, 2], d: [{ e: 'f', g: ['h'] }], i: { j: true } };
  assert.deepEqual(Y.parse(E.dump(value, 0).join('\n')), value);
});

// ── colour ─────────────────────────────────────────────────────────────
test('accentHsl reads hex and clamps to something usable', () => {
  const [h] = accentHsl('#f22f46');
  assert.ok(h > 340 && h < 360, `hue ${h}`);
  assert.deepEqual(accentHsl('not a colour'), [352, 0.88, 0.56]);
  assert.equal(Math.round(accentHsl('#000000')[2] * 100), 32);   // clamped up
});

test('every collection gets a hue of its own', () => {
  const hues = ['posts', 'portfolio', 'videos', 'snippets', 'prompts', 'zzz']
    .map((l) => ((collectionHue(352, l) % 360) + 360) % 360);
  assert.equal(new Set(hues).size, hues.length);
});

test('hash is stable', () => assert.equal(hash('abc'), hash('abc')));

// ── the wizard, end to end, on a copy ──────────────────────────────────
test('apply() configures a copy of the repo without breaking it', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scratchpad-'));
  for (const f of ['_config.yml', 'CNAME']) {
    if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
  }
  for (const d of ['_posts', '_portfolio', '_videos', '_snippets', '_prompts']) {
    if (fs.existsSync(path.join(ROOT, d))) fs.cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
  }
  for (const f of ['portfolio.md', 'videos.html', 'snippets.md', 'prompts.md', 'blog.html']) {
    if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
  }

  const report = apply(tmp, {
    identity: { title: 'Ada', description: 'Engines.', url: 'https://ada.dev/', author: 'Ada' },
    look: { accent_color: '#2563eb', header: { layout: 'full' }, footer: { layout: 'minimal' }, reading: { sidebar: false } },
    nav: { header: [{ title: 'Home', url: '/' }], footer: [], legal: [] },
    social: [{ label: 'GitHub', url: 'https://github.com/ada' }],
    collections: [
      { label: 'posts', enabled: true, title: 'Writing', singular: 'Essay', style: 'numbered' },
      { label: 'portfolio', enabled: false },
      { label: 'videos', enabled: false },
      { label: 'snippets', enabled: false },
      { label: 'prompts', enabled: false },
      { label: 'notes', enabled: true, title: 'Notes', singular: 'Note', style: 'cards' },
    ],
    extras: { github_repo: 'ada/site', service_worker: false },
    deploy: { cname: 'ada.dev', clean_demo: true },
  });

  const c = Y.parse(fs.readFileSync(path.join(tmp, '_config.yml'), 'utf8'));
  assert.equal(c.title, 'Ada');
  assert.equal(c.url, 'https://ada.dev', 'a trailing slash is stripped');
  assert.equal(c.accent_color, '#2563eb');
  assert.equal(c.header.layout, 'full');
  assert.equal(c.header.sticky, true, 'untouched header keys survive');
  assert.equal(c.layout.sidebar, false);
  // The wizard rewrites what it was ASKED about and leaves the rest alone:
  // a collection the form never listed survives untouched, and so do the
  // keys the form has no field for (`card`, `single`, …) on one it did.
  assert.ok(c.collections.posts, 'an enabled collection stays');
  assert.ok(c.collections.notes, 'a new one is added');
  assert.ok(!c.collections.portfolio, 'a disabled one goes');
  assert.ok(c.collections.podcast, 'one the form never mentioned is left alone');
  assert.equal(c.collections.posts.title, 'Writing');
  assert.equal(c.collections.posts.card, 'blog', 'keys the form has no field for survive');
  assert.deepEqual(
    c.collections.posts.single.widgets,
    ['toc', 'ad', 'collection', 'about', 'cta'],
    'and so does the whole layout composition',
  );
  assert.equal(c.collections.notes.permalink, '/notes/:name/');
  assert.deepEqual(c.navigation_legal, []);
  assert.ok(c.resume.experience.length >= 1, 'the resume block is never touched');
  assert.equal(fs.readFileSync(path.join(tmp, 'CNAME'), 'utf8').trim(), 'ada.dev');
  assert.ok(fs.existsSync(path.join(tmp, '_notes', 'hello-world.md')), 'a new collection gets a starter entry');
  assert.ok(fs.existsSync(path.join(tmp, 'notes.md')), 'and a landing page');
  assert.ok(!fs.existsSync(path.join(tmp, '_portfolio')), 'a disabled collection is retired');
  assert.ok(fs.existsSync(path.join(tmp, report.backup, '_portfolio')), 'and backed up, not deleted');
  assert.ok(fs.readdirSync(path.join(tmp, '_posts')).length >= 1, 'no collection is left empty');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('apply() is idempotent', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scratchpad-'));
  fs.copyFileSync(path.join(ROOT, '_config.yml'), path.join(tmp, '_config.yml'));
  const answers = {
    identity: { title: 'Twice', url: 'https://twice.dev' },
    look: { accent_color: '#0f766e' },
    collections: [{ label: 'posts', enabled: true, title: 'Blog', singular: 'Post', style: 'numbered' }],
  };
  apply(tmp, answers);
  const once = fs.readFileSync(path.join(tmp, '_config.yml'), 'utf8');
  apply(tmp, answers);
  const twice = fs.readFileSync(path.join(tmp, '_config.yml'), 'utf8');
  assert.equal(once, twice, 'running the wizard again changes nothing');
  fs.rmSync(tmp, { recursive: true, force: true });
});

console.log(`\n  ${pass} passed${fail ? `, ${fail} failed` : ''}\n`);
process.exit(fail ? 1 : 0);
