---
title: Deploying to GitHub Pages
section: Start here
order: 2
icon: rocket
description: A user page, a project page, and a custom domain.
---

1. Create a repository. Name it **`username.github.io`** for a site at
   `https://username.github.io`, or anything you like for a project page at
   `https://username.github.io/repo-name/`.
2. Push this tree to `main`.
3. **Settings → Pages → Source: GitHub Actions.**

That is the whole setup.

## Why you never set `baseurl`

`.github/workflows/jekyll.yml` passes GitHub's own base path to Jekyll:

```yaml
run: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
```

On a user page that value is empty; on a project page it is `/repo-name/`. The
**same workflow is correct for both**, which is why `baseurl` in `_config.yml`
should stay empty and every link in the theme goes through `relative_url`.

## A custom domain

Put the domain in `CNAME` — the setup form does this — and point the DNS at
GitHub. No custom domain? Delete the file; the form does that too when you
leave the domain blank.

## One caveat about plugins

Tag pages are written by `_plugins/tag_pages.rb`. A `_plugins/` generator runs
whenever Jekyll is invoked by us, which is what the workflow does. It would
**not** run under GitHub's legacy "build from a branch" mode. If you switch to
that, set `tag_pages: false` and the tag links fall back to anchors on
`/tags/`, which work either way.
