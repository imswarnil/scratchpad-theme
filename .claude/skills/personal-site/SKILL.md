---
name: personal-site
description: Stand up a personal website on this Jekyll theme — blog, portfolio, videos, web series, courses, podcast, newsletter, travel, gear and a resume — and deploy it to GitHub Pages at username.github.io. Use when someone wants their own site from this repo, wants to add or reshape a collection, wants to change what an entry page is made of, or is deploying it for the first time.
---

# Build someone a personal site on this theme

This theme is **composed from data**, not from templates. Almost every change
someone asks for is a change to `_config.yml` plus a file dropped in a folder —
if you find yourself editing a layout, check this document first, because the
hook you want probably already exists.

## 1. The fastest path: the setup wizard

```bash
npm run setup          # opens a local form, writes _config.yml, backs up what it replaces
```

It binds to 127.0.0.1 only, never uploads anything, and copies everything it
replaces into `.scratchpad-backup/<timestamp>/` first. It pre-fills from the
current config, so it is safe to run again later.

The wizard covers identity, accent colour, header and footer, navigation,
social links, collections, ads, analytics, the newsletter endpoint and the
domain. It deliberately does **not** cover per-collection page composition —
it carries those keys over untouched (see §4).

Then:

```bash
npm run dev            # http://localhost:4000
npm run check          # doctor + a production build
```

## 2. Deploying to username.github.io

1. Create a repo named exactly `username.github.io` (a *user* page), or any
   name for a *project* page.
2. Push this tree to `main`.
3. Settings → Pages → Source: **GitHub Actions**.

`.github/workflows/jekyll.yml` builds with Ruby 3.4 and deploys `_site/`. It
passes `--baseurl "${{ steps.pages.outputs.base_path }}"`, so the **same
workflow is correct for both** a user page (empty base path) and a project
page (`/repo-name/`) — do not hard-code `baseurl`.

`CNAME` holds the custom domain. No custom domain → delete the file; the
wizard does this for you when you leave the domain blank.

## 3. Adding a collection

A collection is a kind of content: a blog, a portfolio, a podcast, a shelf of
gear. Add one in `_config.yml` under `collections:`:

```yaml
  recipes:
    output: true
    title: Recipes
    singular: Recipe
    description: "One line about this collection."
    permalink: /recipes/:name/
    landing: /recipes/
    icon: cooking-pot          # any phosphoricons.com name
    schema: Recipe             # schema.org type, for JSON-LD
    card: blog                 # which card design (see §5)
    hero: { pattern: dots }    # the landing hero; `hero: false` for the compact head
    image: "/assets/img/covers/recipes.svg"
    single:                    # what an entry page is made of (see §4)
      lead: cover
      parts: [breadcrumbs, head, lead, prose, tags, share, ask, author, nav]
      widgets: [toc, collection, about]
```

Then:

```bash
mkdir _recipes                       # the folder Jekyll reads
# a landing page that lists it:
printf -- '---\nlayout: page\ntitle: Recipes\npermalink: /recipes/\nlist_collection: recipes\n---\n' > recipes.html
npm run thumbs                       # draws the cover art for the new collection
```

`npm run doctor` will tell you if you missed one of those steps.

The theme ships thirteen: `posts`, `portfolio`, `videos`, `snippets`,
`prompts`, `webseries` + `episodes`, `courses` + `lessons`, `podcast`,
`newsletter`, `travel`, `uses`. A child collection (an episode, a lesson)
belongs to its parent by a slug in front matter — `series:` or `course:`.

## 4. Changing what an entry page is made of

This is the part people usually think needs a new layout. It does not.

```yaml
    single:
      lead: portfolio                 # _includes/leads/portfolio.html
      parts: [breadcrumbs, head, lead, prose, tags, share, ask, comments, author, nav]
      widgets: [details, toc, collection, cta]
      sidebar: true
```

- `parts` → `_includes/single/<name>.html`, stacked in the order given
- `widgets` → `_includes/widgets/<name>.html`, down the sidebar
- `lead` → `_includes/leads/<name>.html` (`none` for no lead)

**Invent a part by dropping a file in and naming it.** No layout is edited.
Any single entry can override all three in its own front matter.

Parts that ship: `breadcrumbs head toc-mobile lead prose tags share ask
comments author nav episodes lessons siblings`.
Widgets: `toc details collection about cta share subscribe ad`.
Leads: `cover video prompt snippet portfolio series audio`.

## 5. Card designs

`card: <name>` on a collection picks `_includes/cards/<name>.html`. Shipped:
`blog` (editorial), `portfolio` (repo card), `video` (player), `snippet` (code
window), `prompt` (chat window), `webseries` (portrait poster), `episode`,
`course`, `lesson`, `podcast`, `issue`, `trip`, `product`. Unset falls back to
`blog`, so a new collection looks right before it has a design of its own.

**Cards in a grid row are always the same height.** `.im-cards` stretches each
item and the card's body takes the slack — so a new card only has to put
`flex: 1` on its body and `margin-top: auto` on its foot.

## 6. Tag pages

`_plugins/tag_pages.rb` writes a page per tag at `/tags/<slug>/`, across
**every** collection — Jekyll's own `site.tags` only sees posts, which on a
site that tags films and gear as well would quietly show a third of what
carries the tag. Tags group by slug, so `Analytics` and `analytics` are one
subject.

A `_plugins/` generator runs whenever Jekyll is invoked by us, which is what
`.github/workflows/jekyll.yml` does. It would **not** run under GitHub's
legacy "build from a branch" Pages mode; there, set `tag_pages: false` and
the tag links fall back to anchors on `/tags/`.

## 7. House style — read before writing CSS

The theme follows the Im Design System, and it has exactly two interactions:

- **HOVER** — the thing FILLS (`--im-hover-bg`). Nothing sharpens a border,
  nothing grows three per cent, nothing rests on a drop shadow.
- **CURRENT** — "you are here": a stronger fill and a bolder label
  (`--im-current-bg/-fg/-weight`). It is never a change of colour.

The accent is for the primary button, a link's hover, the focus ring,
selection, and each collection's derived hue — nothing else. A filled button
and a card both lift exactly one pixel and cast one hairline.

Everything is a `--im-*` custom property; nothing is a literal colour.
`_sass/im/abstracts/_mixins.scss` holds both interactions, written once.

## 8. The commands

```bash
npm run setup     # the browser setup form
npm run dev       # local server + livereload
npm run build     # production build into _site/
npm run new       # scaffold an entry in any collection
npm run thumbs    # (re)draw the generated cover art from the accent colour
npm run doctor    # check the config for the mistakes that break a build
npm run test      # the config/wizard test suite
npm run check     # doctor + build, i.e. what CI does
```

Ruby 3.4 is required (`.ruby-version`); macOS system Ruby 2.6 cannot build
this site. `bin/serve` and `bin/build` force the right toolchain onto PATH.
