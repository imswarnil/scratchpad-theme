# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Scratchpad** — a dev portfolio theme, and the demo site that shows it off, served at
`scratchpad.imswarnil.com` (see `CNAME`). Read **`ROADMAP.md` first**: the theme is one design
that will ship as a starter for Jekyll, plain HTML, Astro, Hugo, Next, Nuxt, Gatsby, WordPress
and Ghost, and the plan's phase order is deliberate — the design core and a frozen HTML
reference come before any port.

Today it is a **Jekyll** site, originally forked from the [Alembic](https://alembic.darn.es/)
theme and then rewritten past recognition — the theme's source (`_includes/`, `_layouts/`,
`_sass/`) is vendored directly into this repo rather than consumed as a gem, so edit those
files in place. It was called *Imprint* and served `dev.imswarnil.com` until 2026-09-27; the
75-commit history of that era lives in the archived `Personal-Website-Jekyll-Theme` repo, and
`docs/decisions/naming.md` records why the name changed.

Nothing in this repo credits a co-author in its commit messages.

## Commands

```bash
bin/serve                      # local dev server + livereload (recommended)
bin/build                      # production build into _site/
```

In an interactive terminal, plain `bundle install` / `bundle exec jekyll serve` work because `~/.zshrc` activates **chruby `ruby-3.4.1`** (`~/.rubies/ruby-3.4.1`). The **macOS system Ruby (2.6, `/usr/bin/ruby`) cannot build this site** — `sass-embedded` / `google-protobuf` crash with `cannot load such file -- google/protobuf_c` — so if a shell falls back to it (e.g. chruby didn't load), builds break. `bin/serve` / `bin/build` guard against that by forcing `~/.rubies/ruby-3.4.1/bin` onto PATH. `vendor/bundle` is per-Ruby: if you switch Ruby versions, `rm -rf vendor/bundle Gemfile.lock && bundle install`. CI (Ruby 3.1) is unaffected. `Gemfile.lock` is gitignored, so the scripts delete any stale lock before installing.

For a quick SCSS-only check without Jekyll: `npx --yes sass@1.77.8 --no-source-map _sass/main.scss /tmp/out.css`.

There is no test suite, linter, or JS build step — content is plain Markdown/Liquid and Sass compiled by `jekyll-sass-converter`.

## Deployment

Pushing to `main` triggers `.github/workflows/jekyll.yml`, which runs `bundle exec jekyll build` (Ruby 3.1, production env) and deploys `_site/` to GitHub Pages. `Gemfile.lock` is gitignored (`.gitignore`), so CI resolves gem versions fresh each run.

## Architecture

### Scratchpad CSS framework (`_sass/scratchpad/`)
The styling is a self-contained, custom framework called **Scratchpad CSS**. All previous Alembic/Swarnil SCSS (`_base`, `_normalize`, `_variables`, `components/`, `elements/`, `layouts/`, `sections/`, `utility/`) has been **deleted** — do not look for it. `assets/styles.scss` → `_sass/main.scss` → `_sass/scratchpad/_index.scss`. The `im/` partials are organized into folders — `abstracts/` (`_config`: build-time SCSS maps/breakpoints/mixins, the single source of truth), `tokens/` (`_tokens` = canonical scales + `:root` light theme; `_dark-mode` = `[data-color-scheme="dark"]`/system overrides), `base/` (`_elements` reset+typography, `_motion` background patterns/scroll-reveal), `layout/` (`_containers`, `_navbar`, `_hero`, `_shell`, `_footer`), `components/` (`_components`, `_content-components`, `_collection`, `_post`, `_home`, `_search`, `_resume`, `_sitetree`, `_tags-page`), and `utilities/` (`_utilities`). `_index.scss` still `@import`s them in a fixed order (abstracts → tokens → base/layout/components → utilities **last**); order matters because it's `@import` (one shared global scope), so edit the sequence there, not the folder names. Everything browser-facing is prefixed `sp-` (classes `sp-card`, `sp-row`, `sp-col-6`, `sp-pcard--video`, helpers `sp-padding-top-2`, `sp-text-small`, …) and reads `var(--sp-*)` tokens, so the whole site re-themes at runtime. Theme is set by an inline no-flash script in `head.html` writing `data-color-scheme` (light/dark/system) to `<html>`; the navbar toggle persists it to `localStorage` (`sp-color-scheme`).

### How a page is composed (read this before editing a layout)
Almost nothing in this theme is templated; it is **composed from `_config.yml`**.

- **An entry page** — `_layouts/post.html` is a composer, not a template. Each collection's `single:` block names `parts` (stacked in order), `widgets` (the sidebar) and `lead` (the block under the title). `parts` → `_includes/single/<name>.html`, `widgets` → `_includes/widgets/<name>.html`, `lead` → `_includes/leads/<name>.html`. **Adding a part means adding a file and naming it in config — no layout is edited.** Any entry can override all three in its own front matter. Defaults live in `layout.single`.
- **A landing page** — `_layouts/page.html` with `list_collection:` (`blog.html` and `videos.html` are their own pages for pagination and the reels split, but use the same partial). It renders `_includes/collection/hero.html`, which is the design system's `.sp-collhero`: a band bleeding out of the page gutter on `--sp-surface`, the collection's pattern fading in from the right in its own hue, a `.sp-caption` carrying the count, a display title, a mono meta line with drawn dots, and a foot bar on a hairline — topic chips scrolling left, the view switch right. Driven by the collection's `hero:` block (`pattern`, `video`, `cta`, `views`); `hero: false` falls back to the compact head.
- **Four feed views** — `data-view="card|grid|list|simple"` on `.sp-cards#feed`. The cards never change markup; the feed decides their shape. `assets/scripts/view.js` sets the attribute and remembers the choice across the site, so the switch is an enhancement — without it the feed keeps whatever view the page shipped.
- **The footer** — `footer.columns` in `_config.yml` is a list of columns, each naming either `collections:` (labels, which bring their own title, icon, hue and count) or `links:`. A new collection joins the footer by being named. Skins: `line`, `fill`, `ink` (inverted — it restates the semantic tokens rather than setting colours, so everything inside follows).
- **A card** — `card: <name>` on a collection picks `_includes/cards/<name>.html`; unset falls back to `blog`. `_includes/utility/card.html` is the chooser and reads the config, not a hard-coded case list.
- **Equal heights** — `.sp-cards` stretches each grid item and passes the row height to the card inside it; a card's body takes the slack (`flex: 1`) and its foot sits at the bottom (`margin-top: auto`). A row of cards is always one row, whatever the cards carry. Note that the prose `li + li` margin is scoped to unclassed lists precisely because it used to break this.
- **Standalone pages** — `chrome: false` in front matter drops the site header and footer. `/resume/` uses it: it brings its own hero and a bar that hero collapses into (`_includes/resume/`, `assets/scripts/resume.js`).

### Collections & layouts
Content lives in **thirteen content-typed collections**: Jekyll's native `posts` (backed by `_posts/`, files named `YYYY-MM-DD-slug.md`) plus `_portfolio` (projects, films and design work in one collection — each doc sets `kind: project|film|design`; the old `_projects` collection was merged into it on 2026-09-16 and `/projects/` redirects to `/portfolio/`), `_videos`, `_snippets`, `_prompts`, `_webseries` + `_episodes`, `_courses` + `_lessons`, `_podcast`, `_newsletter`, `_travel` and `_uses`. A child collection belongs to its parent by a slug in front matter (`series:`, `course:`), which is what `single/episodes.html`, `single/lessons.html` and `single/siblings.html` read. A video with `orientation: portrait` is a **reel**: it is kept out of the 16:9 card grid, shown in the reels band on `/videos/` (`_includes/collection/reels.html`) and given a two-column page of its own (`.sp-shell.is-reel`). `posts` is declared under `_config.yml` `collections:` (alongside the others) purely to attach the custom keys `singular`, `icon`, `schema` (schema.org type), `style` (homepage section style) and `image` (fallback cover) — Jekyll still populates it automatically from `_posts/` regardless of that declaration. `defaults` give every collection entry `layout: post` and pages `layout: page`. Only **three layouts** remain: `default`, `post`, `page` (archive/categories/home/note/project/resume were deleted). The **posts** collection is paginated via `jekyll-paginate-v2` (`pagination:` block in `_config.yml`, rendered by `blog.html` + `_includes/pagination.html`, pages at `/blog/page/:num/`), with per-post permalinks at `/blog/:title/`.
- `post.html` is collection-aware: it switches on `page.collection` to render type-specific lead media (YouTube embed for videos, `<audio>` for podcasts, star rating for reviews, fact bars for trips/projects).
- `page.html` doubles as a collection index when front matter sets `list_collection: <label>` (see `guides.md`, `videos.md`, …); otherwise it's a plain page.
- Cards: `_includes/utility/card.html` is a chooser that maps `item.collection` → a per-collection partial in `_includes/cards/`. Each is its own design (`blog` editorial, `portfolio` GitHub-repo card, `video` player, `snippet` VS Code window, `prompt` chat window), styled in `_sass/scratchpad/components/_cards.scss`; `utility/pcard.html` is the older shared body, now unused by them. `utility/collection-list.html` renders a whole collection as a grid; the portfolio list adds a sticky filter aside driven by `assets/scripts/filter.js` (kind + tag chips, state in the URL hash).
- SEO: `_includes/seo/jsonld.html` emits per-collection JSON-LD (`@type` from the collection's `schema`), included from `head.html` for `layout: post` entries. Image fallback chain (`_includes/utility/image.html`): entry `image`/`cover` → collection `image` → `site.placeholder_image` (`/assets/img/placeholder.svg`). Per-collection covers live in `assets/img/covers/`.

### Configurable chrome (header / footer / search / home)
- **Header** (`_includes/header.html`) is fully driven by the `header:` block in `_config.yml`: `layout: island|full`, `sticky`, `blur`, `brand: both|logo|title`, `show_icons`, `dropdowns`, `megamenu` (an item with `megamenu: true` + `children` opens a wide panel; `blurb`/`sub` keys feed it), `search`, `dark_toggle`, `github` (live star count via the GitHub API, cached in localStorage — JS in `default.html`), `sponsor`, `cta`. Styling lives in `_sass/scratchpad/_navbar.scss` (`.sp-navbar--island/--full`, `.is-sticky`, `.is-blur`, `.sp-dropdown`, `.sp-mega`, mobile drawer toggled by `.is-nav-open`).
- **Footer** (`_includes/footer.html` + `footer-social.html`) driven by `footer:` block: `layout: columns|minimal` (two switchable styles), `boxed: true` (optional rounded island-card wrapper, works with either), plus `tagline`, `show_collections`, `show_nav`, `show_social`, `newsletter`. Links use the animated-underline `.sp-flink` class; the columns style has a back-to-top link targeting `#top` on `<main>`. Styling in `_sass/scratchpad/_footer.scss`.
- **Search**: a command-palette overlay (`_includes/search-modal.html`, opens on the navbar search button or the `/` key) plus the full `/search/` page (`_includes/site-search.html`). Both read `assets/search.json` (which now includes a `collection` field per entry). Styling in `_sass/scratchpad/_search.scss`.
- **Homepage** (`index.html`): a full-viewport hero on the 12-column grid (`.sp-grid-12` in `_containers.scss`) with a GSAP entrance (`assets/scripts/hero.js` — GSAP loads from cdnjs only on pages with a `hero_title`; no CSS hidden start states, so it degrades to static HTML), then sections (selected work, writing, videos, skills, contact CTA) built from `utility/card.html`. Every card falls back to `utility/thumb.html`, an inline SVG cover generated from the doc's front matter, when it has no `image`/`cover`. Styling in `_sass/scratchpad/components/_home.scss` and `_pages.scss`.

### Reading layout, sidebar, TOC & ads
The `layout:` block in `_config.yml` (`sidebar`, `ad_rails`, `toc`) controls the content shell. `default.html` wraps `<main>` in `.sp-rails` (sticky vertical ad rails on ≥1500px when `ad_rails` + adsense enabled; per-page `ad_rails: false` opts out). `post.html` uses `.sp-shell.has-sidebar`: a reading-width article column (`--sp-content` 44rem) plus a right `.sp-sidebar` (`_includes/sidebar.html`: TOC widget, square ad, about/CTA). Per-page `sidebar: false` disables it. The **TOC** is generated by `_includes/toc-script.html` from the article's `h2/h3` — it fills the desktop sidebar widget (`#sp-toc`, IntersectionObserver active-highlight) and a mobile collapsible `<details>` (`#sp-toc-mobile`) shown above content. **Ads**: `_includes/ad.html` (param `type`: horizontal|square|vertical|in_article|fluid) renders a themed, "Advertisement"-labelled `adsbygoogle` unit from `site.adsense.placements`, with a dashed placeholder when ads are disabled. Container widths live in `--sp-container` (64rem) / `--sp-container-wide` (75rem) / `--sp-container-narrow` (42rem) tokens. Styling in `_sass/scratchpad/_shell.scss`.

- **`_config.yml`** is the control center and is large. Beyond standard Jekyll settings it drives most of the custom UI via data: `navigation_header` / `navigation_footer` (menus + submenus + Phosphor icons), `header:` (sticky/search/avatar toggles), `social_links`, `sharing_links`, `adsense:` (placement slot IDs), `fonts:`, and an entire `resume:` object (experience, education, skills, projects, stats) that the resume layout/include renders. Restart `jekyll serve` after editing `_config.yml`.
- **`_layouts/`** — page shells: `default`, `page`, `post`, `resume`. There is no `home.html` — the homepage hero is built inline in `index.html` from its own front matter (`hero_title`, `hero_subtitle`, `hero_image`).
- **`_includes/`** — modular partials assembled by layouts (`head.html`, `header.html`, `footer.html`, `ad.html`, nav/social/share fragments, `site-search.html`). `_includes/components/*.html` are content shortcodes (`card`, `badge`, `callout`, `cta`, `stat`, `stepper`, `tabs`, `timeline`, `accordion`) called from Markdown via `{% include components/....html %}`; they render plain (non `sp-`) class names styled in `_sass/scratchpad/_content-components.scss`. See `DESIGN.md` for the full design-system reference.
- **`_sass/`** — Sass partials imported by `assets/styles.scss`. `_variables.scss` holds colours/typography.
- **`_posts/`** — blog posts named `YYYY-MM-DD-slug.md` (Jekyll's native `posts` collection). Permalinks are `/blog/:title/` (see `collections.posts.permalink` in `_config.yml`), not the date-based default. Posts default to the `post` layout; root `.md` pages default to `page` (see `defaults` in `_config.yml`).
- **Search** is client-side JS reading `assets/search.json` (a generated index of site content).
- **PWA**: a service worker is wired in (`_includes/site-sw.html`, `offline.md`, `assets/manifest.json`) for offline support.

## Gotchas

- **`_config.yml` is long and repeats key *names* at different depths** — `title:` and `url:` appear inside `author:`, every nav item and every footer column. There are no duplicate *top-level* keys any more, and `url:` agrees with `CNAME` (`https://scratchpad.imswarnil.com`); check the indentation before assuming which one you are looking at.
- Page/post front matter options (from Alembic, documented in `README.md`): `aside: true` adds a sidebar, `feature_image` / `feature_text` add a header banner, `comments: false` disables comments, `indexing: false` adds `noindex`.
- `README.md` is the upstream Alembic theme documentation, useful as a reference for include options and layouts but not specific to this site's content.
