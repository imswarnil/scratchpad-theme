# Scratchpad CSS — the contract

This folder is how a stack that is not Jekyll gets the design. Everything
Scratchpad looks like is decided here and nowhere else, and a port that restates
a colour, a size or a state has already broken.

```
design/
├── index.html      the living style guide, served at /design/
├── dist/           what other stacks consume — generated, committed
│   ├── scratchpad.css       plain CSS, no toolchain, no dependencies
│   ├── scratchpad.min.css   comments and slack removed, nothing reordered
│   ├── tokens.json          every --sp-* value, light and dark, as data
│   └── manifest.json        version, commit, size, rule and token counts
└── README.md       this file
```

## Where it is authored

In `_sass/scratchpad/`, as Sass, and Jekyll compiles it while building the site.
`npm run ds:build` then takes **the stylesheet the site actually serves** and
writes `dist/` from it. There is no second toolchain, so there is nothing to
drift: if the demo site looks right, `dist/` is right, by construction.

That is a deliberate narrowing of the roadmap's "authored as plain CSS". The
source is 8,800 lines with 129 uses of mixins, maps and loops; hand-converting
it would be a rewrite with no way to prove it changed nothing, and the reason to
want plain CSS was never the authoring — it was that WordPress, Ghost and a bare
HTML file have no build step. `dist/` is what they needed. Authoring can move to
plain CSS later, and until then nothing downstream can tell the difference.

## The contract, in full

**Two states, and they are the whole vocabulary.**
- **Hover** fills: `--sp-hover-bg`. Nothing moves, nothing grows, nothing lifts.
- **Current** — the page you are on, the tab you are in — fills one step
  stronger (`--sp-current-bg`) *and* bolds the label. It is legible with colour
  turned off, which is the point.

**One accent, and exactly five places it may appear.** The primary button, a
link's hover, the focus ring, text selection, and a collection's hue (the accent
rotated on the colour wheel). An icon that turns accent while its label stays
ink is a bug. The accent is never "you are here" — that is Current's job.

**Nothing rests on a shadow.** Elevation is a hairline (`--sp-line`) and a
surface step (`--sp-surface`, `-2`, `-3`). A shadow may soften a thing that is
genuinely floating — a dialog, a dropdown — and never separates two things that
sit on the same plane.

**Dark mode is a token override, not a second stylesheet.** `:root` carries the
light values; `:root[data-color-scheme="dark"]` redeclares 22 of them and every
component follows without knowing. A component that names a grey directly instead
of a semantic token will be wrong in one of the two schemes, always.

**Type is two families and one scale.** Geist for text, Geist Mono for code,
metadata and anything that should read as a machine wrote it. Sizes come from
`--sp-text-*`; a component never sets a `px` font size.

## Using it from another stack

```html
<link rel="stylesheet" href="scratchpad.min.css">
<html data-color-scheme="dark">   <!-- light | dark | system -->
```

Re-theme by redeclaring custom properties after the stylesheet — one accent is
all most sites change:

```css
:root { --sp-accent: oklch(55% 0.2 260deg); }
```

`tokens.json` exists so a stack's own config can be generated rather than
transcribed: a WordPress `theme.json`, a Tailwind theme, a Ghost settings block,
a Claude design project. Read the values; never copy them into a second file a
human has to keep in step.

## Rebuilding

```bash
npm run ds:build           # after a site build
npm run ds:build -- --build  # build the site first, then package
npm run check              # doctor → build → ds:build, which is what CI does
```

`manifest.json` records the commit it came from, so a `dist/` in the wild can
always be traced back to the source that produced it.
