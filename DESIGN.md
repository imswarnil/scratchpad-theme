# DESIGN.md — IM CSS design system reference

This documents the visual/design conventions used across the site: the `im-*`
framework's tokens, motion rules, and the content-facing "shortcode"
components authors use from Markdown. Read `CLAUDE.md` first for the
Jekyll/collections architecture — this file is design-only.

## Tokens (single source of truth)

Build-time SCSS scales live in `_sass/im/_config.scss` and `_sass/im/_tokens.scss`;
they're emitted as runtime `--im-*` custom properties (light + `[data-color-scheme="dark"]`),
so any new component should read `var(--im-*)`, never hardcode a colour/size.

| Scale | Keys | Source |
|---|---|---|
| Space | `0, 1..10` (0.25rem → 8rem) | `$im-space` in `_tokens.scss` |
| Radius | `1..6, pill` (6px → 24px, 999px) | `$im-radius` in `_tokens.scss` |
| Text | `xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl` | `$im-text` in `_tokens.scss` |
| Weight | `regular, medium, semibold, bold` | `_config.scss` |
| Color | `accent, contrast, foreground, secondary, mute, background(-100/200/300), surface, border, muted, success, warning, danger` | `$theme-light` / `$theme-dark` maps in `_config.scss` |
| Motion | `--im-dur-1` (180ms), `--im-dur-2` (260ms), `--im-ease` (`cubic-bezier(.25,1,.5,1)`) | `_config.scss` |
| Container | `--im-container` (64rem), `--im-container-wide` (75rem), `--im-container-narrow` (42rem) | `_tokens.scss` |

The theme is monochrome (black/white accent) by design — new components should
lean on `--im-color-contrast`/`--im-color-accent` rather than introducing hues.

## Motion conventions (`_sass/im/_motion.scss`)

- **Always reuse `--im-dur-1/2` + `--im-ease`.** Don't invent new timing values.
- **Every animation is gated behind `@media (prefers-reduced-motion: no-preference)`**
  (opt-in), matching the existing `scroll-behavior: smooth` guard in `_base.scss`.
  A global `@media (prefers-reduced-motion: reduce)` kill-switch at the bottom of
  `_motion.scss` is the backstop in case a new effect forgets its own gate.
- **Background patterns**: `.im-bg-dots` / `.im-bg-grid` utility classes (subtle,
  theme-aware, ~5% opacity `::before` pseudo-elements) — apply to any full-width
  section that needs texture. The hero (`.im-hero`) gets the dot pattern automatically.
- **Scroll reveal**: add `.im-reveal` to any block-level element. `assets/scripts/custom.js`
  progressively enhances it with an `IntersectionObserver` (adds `.js-reveal` +
  toggles `.is-revealed` on first intersection); if JS never runs, the element
  just stays visible — there's no CSS-only "hidden by default" state.
- **Page transitions**: `@view-transition { navigation: auto; }` in `_motion.scss`
  opts every same-origin navigation into the browser's native View Transitions
  API — zero JS, zero dependency, silently ignored in browsers that don't
  support it yet (progressive enhancement, not a requirement).

## Content-facing "shortcode" components

`_includes/components/*.html` are used directly from Markdown (`{% include
components/card.html ... %}`) and intentionally emit **plain, non-`im-`-prefixed
class names** so they read cleanly inline in prose. All of their styling lives
in one place: `_sass/im/_content-components.scss` (a separate layer from
`_sass/im/_components.scss`, which styles the framework's own `im-btn`/`im-card`/
`im-badge`/`im-alert` used by layouts, not content).

| Include | Renders | Notes |
|---|---|---|
| `components/card.html` | `.card`, `.card--link`, `.card--bento`, `.card__icon/title/text/footer` | `href` param renders an `<a>`; wrap several in `<div class="card-grid">` |
| `components/badge.html` | `.badge`, `.badge--solid/success/warning/danger/info` | inline pill label |
| `components/callout.html` | `.callout`, `.callout--info/tip/success/warning/danger` | admonition box, Phosphor icon per type |
| `components/cta.html` | `.cta`, `.cta--split` | banner; `split=true` for left-aligned two-column |
| `components/stat.html` | `.stat`, `.stat__icon/value/label/trend` | wrap several in `<div class="stats">` |
| `components/stepper.html` | `.stepper`, `.stepper--horizontal`, `.step`, `.step--done` | numbered flow, CSS counters, no JS |
| `components/tabs.html` | `.tabs`, `.tab__radio/label/panel` | CSS-only (radio-driven), no JS — see the `@for` loop in `_content-components.scss` if you need to support more than 8 tabs |
| `components/timeline.html` | `.timeline`, `.timeline__item/date/title/body` | vertical line + dot markers |
| `components/accordion.html` | `.accordion`, `.accordion__item/summary/icon/body` | native `<details>`/`<summary>`, no JS |

Other unprefixed classes styled in the same partial: `.lead`, `.text-muted`,
`.text-sm`, `.fw-medium` (typography helpers used inline in Markdown),
`.contact-form`/`.field` (used by `contact.md`).

**When adding a new shortcode component**: give it plain class names (BEM-ish,
`.thing__part`), style it only in `_content-components.scss`, and reuse the
existing card/badge/stat visual language (surface background, `--im-shadow`,
hover lift via `translateY(-3px/-4px)`) so it doesn't look like a different
product.

## Resume page (`/resume/`)

`_layouts/resume.html` + `resume.md` render `site.resume.*` from `_config.yml`
(experience, education, skills, projects, awards, stats, highlights). Styling
is `_sass/im/_resume.scss`. Two things to know before editing:

- **`/cv/` redirects to `/resume/`** via `jekyll-redirect-from` (`redirect_from:`
  in `resume.md`'s front matter) — don't recreate a separate CV page.
- **`@media print`** in `_resume.scss` hides nav/footer/ad rails and collapses
  the two-column grid to one, so the "Save as PDF" button (`window.print()`,
  wired in `assets/scripts/custom.js` via `[data-im-print]`) produces a clean
  single-column printout. Any new resume section should be wrapped so it's
  still readable after that collapse (check `.im-resume-grid` in print mode).
- Company/project logos are referenced by Phosphor **icon**, not image file —
  there are no real logo/screenshot assets for `site.resume.company_icons`/
  `projects[].cover` yet, so avoid re-introducing hardcoded image paths that
  don't exist on disk (`resume.projects[].cover` currently falls back to
  `site.placeholder_image`).

## Known gaps / next steps

- No dark-mode-specific screenshots have been visually reviewed for the new
  background patterns (`.im-bg-dots`/`.im-hero::before`) — they're built from
  `--im-color-contrast` so they should auto-adapt, but check contrast in dark
  mode before shipping more of them.
- View Transitions are Chromium-only today (no Safari/Firefox support as of
  this writing) — treat any visual you build around it as an enhancement,
  never a requirement for correctness.
- AdSense rendering itself (as opposed to the CSS containment in
  `_sass/im/_shell.scss` `.im-ad`) depends on Google having verified the exact
  serving domain in the AdSense account — a dev/staging subdomain not added
  there will show blank ad slots by design, not a CSS bug.
