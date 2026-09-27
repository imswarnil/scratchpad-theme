# Contributing

Thanks for your interest in improving this project! It's a **Jekyll** site with a
self-contained CSS framework (**IM CSS**, in `_sass/im/`). Contributions of all
kinds are welcome — bug fixes, docs, components, and theme improvements.

## Prerequisites

- **Ruby 3.x** (the repo pins **3.4.1** via [`.ruby-version`](.ruby-version)).
  The macOS **system Ruby (2.6) cannot build this site** — `sass-embedded` /
  `google-protobuf` fail to load. Install a modern Ruby with
  [chruby](https://github.com/postmodern/chruby), [rbenv](https://github.com/rbenv/rbenv),
  or [asdf](https://asdf-vm.com/). With chruby's auto-switcher, `cd`-ing into the
  repo picks up `.ruby-version` automatically.
- **Bundler** (`gem install bundler`).

## Getting started

```bash
git clone https://github.com/imswarnil/imswarnil.github.io
cd imswarnil.github.io

./bin/setup      # checks Ruby, clears any stale lockfile, runs bundle install
./bin/serve      # local dev server + livereload → http://localhost:4000
./bin/build      # production build into _site/
```

If you'd rather run the tools directly (Ruby 3.x active):

```bash
bundle install
bundle exec jekyll serve --livereload
```

### Troubleshooting

- **`Could not find 'bundler' (x.y.z) required by your Gemfile.lock`** — a stale
  lock is pinning a bundler version. `Gemfile.lock` is intentionally gitignored
  and resolved fresh; delete it (`rm -f Gemfile.lock && bundle install`), or just
  run `./bin/setup`.
- **`Address already in use - bind(2) for 127.0.0.1:4000`** — a dev server is
  already running on that port. Stop it, or serve on another port:
  `bundle exec jekyll serve --port 4001`.
- **`cannot load such file -- google/protobuf_c`** — you're on system Ruby 2.6.
  Switch to Ruby 3.x (see Prerequisites).

## Project layout

```
_config.yml     site config — nav, header/footer options, collections
_layouts/       page shells (default, page, post, …)
_includes/      header, footer, components, SEO partials
_sass/im/       the IM CSS framework, organised into folders:
  abstracts/    build-time SCSS (maps, breakpoints, mixins)
  tokens/       runtime --im-* custom properties (light + dark)
  base/         reset, element typography, motion/background patterns
  layout/       containers, navbar, hero, shell, footer
  components/    buttons, cards, collections, post, home, search, …
  utilities/    spacing / text / flex helpers
assets/         styles, scripts, images, search index
```

## Conventions

- **Everything browser-facing is prefixed `im-`** (classes like `im-card`,
  `im-row`, helpers like `im-text-small`) and reads `var(--im-*)` tokens, so the
  whole site re-themes at runtime. Don't hard-code colours — add/consume a token.
- **`_sass/im/_index.scss` controls the `@import` order** (one shared global
  scope, so order matters). Add new partials there.
- Keep front matter minimal; prefer config- and layout-driven defaults.
- There's no test suite or linter. For a fast SCSS-only sanity check:
  `npx --yes sass@1.77.8 --no-source-map _sass/main.scss /tmp/out.css`.

## Pull requests

1. Fork and create a branch (`git checkout -b fix/thing`).
2. Make your change; confirm `./bin/build` succeeds with no warnings.
3. Keep the diff focused; match the surrounding code style.
4. Open a PR describing **what** changed and **why**.

## Deployment

Pushing to `main` triggers `.github/workflows/jekyll.yml`, which builds with
Jekyll in production and deploys `_site/` to GitHub Pages. `Gemfile.lock` is
gitignored, so CI resolves gem versions fresh.
