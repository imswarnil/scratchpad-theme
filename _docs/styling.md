---
title: Styling
section: Shaping it
order: 7
icon: palette
description: One colour, two interactions, and where the CSS lives.
---

## One colour

`accent_color` in `_config.yml` sets the accent. Every collection's hue is
derived from it by rotating the hue, so changing one value moves the whole
site. Run `npm run thumbs` afterwards to redraw the covers.

Dark mode is automatic, with a toggle in the header. Every colour is an
`--im-*` custom property, so nothing is defined twice.

## Two interactions, and only two

The CSS follows the Im Design System, and knowing this is most of what you need:

- **Hover** — the thing *fills* (`--im-hover-bg`). Nothing sharpens a border,
  nothing grows three per cent, nothing rests on a drop shadow.
- **Current** ("you are here") — a stronger fill and a bolder label
  (`--im-current-bg`, `--im-current-fg`, `--im-current-weight`). It is never a
  change of colour.

A filled button and a card both lift exactly one pixel and cast one hairline.
That is the entire motion vocabulary; resist adding a third.

The accent belongs to the primary button, a link's hover, the focus ring, text
selection, and each collection's hue. Nothing else. An icon that turns accent
while its label stays ink is the bug this rule exists to prevent.

## Where things are

```
_sass/im/
  abstracts/   build-time maps and the two interactions, written once
  tokens/      the --im-* properties, light and dark
  base/        reset, element typography, motion
  layout/      containers, navbar, hero, shell, footer
  components/  cards, collections, the single-page parts, …
  utilities/   spacing and text helpers (imported last)
```

`_index.scss` imports them in a fixed order — abstracts, tokens, base, layout,
components, utilities last. It uses `@import`, so order matters; change the
sequence there rather than renaming folders.
