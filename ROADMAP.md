# Scratchpad — the plan

**Scratchpad** is a dev portfolio theme. One design, authored once, shipped as a
starter for every stack a developer might already be living in: Jekyll first,
then plain HTML, then Astro, Hugo, Next, Nuxt, Gatsby, then WordPress and Ghost.
The base never changes between them — the same tokens, the same class names, the
same markup, the same pages. What changes is the templating language.

Served at **scratchpad.imswarnil.com**. Repo **`imswarnil/scratchpad-theme`**.
MIT.

> The name is *Scratchpad*. "A dev portfolio theme" is the tagline, the repo
> description and the first line of the README, because that is what people type
> into a search box — nobody searches a brand name. Ports are named
> *Scratchpad for Jekyll*, *Scratchpad for Astro*, and so on.

## The four decisions this plan rests on

| | Decision |
| --- | --- |
| **Name** | `Scratchpad`. npm and RubyGems `scratchpad-theme`, `npx scratchpad-theme my-site`, CSS prefix `sp-`, tokens `--sp-*`, Claude design project *Scratchpad Theme Design*. The name *Imprint*, and `THEME-NAME.md`'s search for it, are superseded. |
| **History** | A new repo with a **single initial commit**, authored by Swarnil alone. `Personal-Website-Jekyll-Theme` is left untouched and archived; it keeps the 75-commit history of `dev.imswarnil.com`. Nothing is rewritten, nothing force-pushed, and no commit in Scratchpad credits a co-author. |
| **Design core** | The CSS forks out of `_sass/im/` into Scratchpad's own framework-agnostic core — its own tokens, its own `sp-` prefix, authored as plain CSS. The Im Design System stays where it is: sold, all-rights-reserved, and from Phase 2 onward **not a dependency in either direction**. Scratchpad keeps the *contract* it taught (two states, one accent, nothing resting on a shadow); it ships none of its code or names. |
| **Layout** | A monorepo, restructured once, up front — `design/`, `reference/`, `starters/*`, `docs/`, `preview/`. Every stack that does not exist yet still gets its folder and a README saying so, so the shape never churns again. |

## The structure

```
scratchpad-theme/
├── design/                  the source of truth for how it looks
│   ├── tokens/              colour, type, space, radius, motion — light + dark
│   ├── core/                elements, layout, components, utilities
│   ├── dist/                scratchpad.css · scratchpad.min.css  (built, committed)
│   └── README.md            the contract: two states, one accent
├── reference/               every page and every state as static HTML
│   ├── pages/               home, blog, post, portfolio, project, resume, …
│   ├── states/             hover, current, focus, empty, dark, narrow
│   └── README.md            what a port is checked against
├── starters/
│   ├── jekyll/              ✅ shipping — the site that exists today
│   ├── html/                the reference, as a hand-editable starter
│   ├── astro/  hugo/        planned
│   ├── next/  nuxt/  gatsby/   planned — these get auth + newsletter
│   ├── wordpress/  ghost/   planned — CMS themes
│   └── PARITY.md            the checklist every starter must pass
├── docs/                    one page per stack + the shared concepts
│   ├── index.md             pick your stack
│   ├── concepts/            collections, composition, cards, tokens, theming
│   └── <stack>/             install, structure, deploy, customise
├── preview/                 thumbnails, screenshots, OG images, the demo frames
├── tools/                   setup wizard, create, doctor, test, thumbs, parity
├── .claude/skills/          what Claude Code does when someone opens this repo
└── ROADMAP.md  README.md  LICENSE
```

Two rules hold the whole thing together, and everything below is in service of
them:

- **One design, authored once.** `design/dist/scratchpad.css` is the only place a
  colour, a size or a state is decided. A starter may add layout glue; it may
  never restate a token or invent a state.
- **One markup contract.** `reference/` is plain HTML with no build step. A port
  is correct when its output matches the reference page for page and class for
  class. That is testable, so it is tested, and it is what lets a WordPress theme
  and a Nuxt app look identical without either one guessing.

## The phases

Each phase ends with the site building, a commit, and nothing half-finished.
Nothing in a later phase starts before the one before it is signed off.

### Phase 0 — this document
Names settled, decisions recorded, scope written down. No code.

### Phase 1 — rename and rehome
*Imprint → Scratchpad; `dev.` → `scratchpad.`; a first commit that is actually a
first commit.*

- `Imprint`/`imprint` → `Scratchpad`/`scratchpad` across the 23 files that carry
  it — `package.json`, the gemspec (renamed), `_config.yml`, the README, the
  docs, `tools/`, `_plugins/`, two SCSS files, the skill.
- `CNAME` → `scratchpad.imswarnil.com`, and `_config.yml`'s duplicate `url` key
  reconciled to the same host (today the last one wins and says
  `imswarnil.com`, which is the bug behind any wrong absolute link).
- Local folder `dev.imswarnil.com/` → `scratchpad.imswarnil.com/`, because every
  folder in this workspace is named for the host it serves. The umbrella
  `CLAUDE.md` and `swarnil.md` tables updated in the same commit.
- New GitHub repo `scratchpad-theme`, public, MIT, described as *"A dev portfolio
  theme — one design, every stack."* One squashed initial commit, one author.
  Pages enabled, DNS for `scratchpad.imswarnil.com`, and a permanent redirect
  from `dev.imswarnil.com` so nothing already linked breaks.
- `THEME-NAME.md` retired into `docs/decisions/naming.md`.

**Done when:** `scratchpad.imswarnil.com` serves the site, the old host redirects
to it, `npm run test && npm run check` pass, and `git log` is one commit with one
name on it.

### Phase 2 — the design core, and the Claude design loop
*Consistency before anything else — this is the phase that makes every later port
cheap.*

- Extract `_sass/im/` into `design/tokens/` + `design/core/`, renaming `im-` →
  `sp-` and `--im-*` → `--sp-*`. Authored as **plain CSS** with native nesting and
  custom properties, so a WordPress or Ghost theme can use it without a Sass
  toolchain. The Jekyll starter consumes `design/dist/scratchpad.css`.
- `design/README.md` writes the contract down: the two states (hover fills,
  current fills one step stronger and bolds), the one accent and the five places
  it is allowed to appear, dark mode as a token override rather than a second
  stylesheet.
- A style-guide page that renders every component in every state, in both colour
  schemes, on one page — the thing to look at when confirming "the full look and
  view" before any port is written.
- Then the round-trip: `/design-sync` creates the **Scratchpad Theme Design**
  project on claude.ai/design from `design/`. From that point a UI change can be
  made in Claude, pulled down component by component, and rebuilt into `dist/`.
  (Figma is not the path — the sync tool talks to Claude's design projects, which
  is the loop that actually lands back in this repo.)

**Done when:** the site is pixel-identical to Phase 1 with zero `im-` classes
left, the style guide shows every state in both schemes, and one component has
made a full round trip through the design project and back.

### Phase 3 — the monorepo shape
Move the Jekyll site into `starters/jekyll/`; teach the Pages workflow to build
from a subfolder; create every planned starter folder with a README that states
its status honestly; lay down `docs/` and `starters/PARITY.md`.

**Done when:** the deployed site is unchanged, and `ls starters/` shows the whole
roadmap.

### Phase 4 — the HTML reference
Generate `reference/` from the Jekyll build, so it cannot drift: every page type
and every interactive state as static HTML with no build step. `starters/html/`
is that output, tidied into something a person can edit by hand — which is also
the first port, and the one every other port is diffed against.

**Done when:** `reference/` opens from the filesystem, and `tools/parity.mjs`
compares a starter's output against it and reports per-page pass or fail.

### Phase 5 — preview, thumbnails, presentation
The docs site gets what a theme needs before anyone will install it: a browser
preview window with light/dark and phone/desktop toggles, generated thumbnails
and OG images, a screenshot set, a feature list, and the honest per-stack status
table.

### Phase 6 — docs and the Claude Code skill
One doc per stack — install, structure, deploy, customise — over shared concept
pages, so nothing is explained twice. Then `.claude/skills/scratchpad-setup`: a
skill that asks which stack, which collections and which accent, scaffolds the
starter, writes the config, and deploys it. Opening this repo in Claude Code
should be the easiest of the installation routes, not an afterthought.

### Phase 7 and on — the ports, in this order
Static first, because they need only the core CSS and the markup contract;
dynamic next; CMS last, once the markup has stopped moving.

1. **HTML** (Phase 4 output, hardened)
2. **Astro** — closest to the reference, content collections map cleanly
3. **Hugo** — the other static-site audience, no Node needed
4. **Next**, **Nuxt** — and only here: sign in / sign up, members, newsletter,
   comments, a dashboard. These are applications, and they are scoped separately.
5. **Gatsby**
6. **WordPress** — a block theme with `theme.json` generated from the tokens
7. **Ghost** — Handlebars, members and newsletter already provided by the platform

Each port is one phase, each ends green on `PARITY.md`, and none starts before
the reference is frozen.

## Open questions, to answer before the phase that needs them

- **Thirteen collections is a lot for a *dev portfolio*.** The default starter
  should probably ship dev-shaped — projects, blog, snippets, resume, uses — with
  web series, courses, podcast, travel, prompts and newsletter available but off.
  Decide in Phase 3; it changes what every port must implement.
- **Does `dev.imswarnil.com` keep serving Swarnil's own personal site?** Right
  now this repo is both the theme and the personal site. Once it becomes a
  product, the demo content should be a demo persona, not Swarnil — otherwise
  every installer starts by deleting his life. Decide in Phase 1.
- **One gem and one npm package, or one per starter?** Affects Phase 3's package
  metadata.

## What is deliberately not in scope

- Nothing is copied from any commercial theme, and nothing is read out of
  `imswarnil.com-backups/`.
- Scratchpad does not depend on `design.imswarnil.com`, and
  `design.imswarnil.com` does not take code back from Scratchpad. After Phase 2
  they are two systems that happen to share an author.
- No commit in this repo credits a co-author.
