---
title: Getting started
section: Start here
order: 1
icon: rocket-launch
description: Clone it, run the setup form, see it locally.
---

You need **Ruby 3.4** and **Node 18+**. The macOS system Ruby (2.6) cannot build
this site — `sass-embedded` fails to load — so use `bin/serve` and `bin/build`,
which put the right toolchain on your PATH rather than trusting the shell's.

```bash
git clone https://github.com/imswarnil/Personal-Website-Jekyll-Theme.git my-site
cd my-site
npm run setup      # a form opens in your browser
npm run dev        # http://localhost:4000
```

## The setup form

`npm run setup` serves one page on `127.0.0.1` and nothing else. Nothing is
uploaded, nothing is installed, and everything it replaces is copied into
`.scratchpad-backup/<timestamp>/` before it writes.

It covers your name and bio, the accent colour, the header and footer,
navigation, social links, which collections you want, ads, analytics, the
newsletter endpoint and the domain. Run it again whenever you like — it reads
the current config first, so it opens pre-filled rather than blank.

It deliberately does **not** touch the per-collection page composition
(`single:`), the card choice, or anything else it has no field for. Those are
carried through untouched.

## The commands

| Command | What it does |
| --- | --- |
| `npm run setup` | The browser setup form |
| `npm run dev` | Local server with live reload |
| `npm run build` | Production build into `_site/` |
| `npm run new` | Scaffold an entry in any collection |
| `npm run thumbs` | Redraw the generated cover art from your accent colour |
| `npm run doctor` | Check the config for the mistakes that break a build |
| `npm run test` | The config and wizard test suite |
| `npm run check` | Doctor + build — what CI runs |
