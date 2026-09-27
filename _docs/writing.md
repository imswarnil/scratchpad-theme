---
title: Writing a post
section: Filling it
order: 3
icon: pen-nib
description: Front matter, images, and the bits that are easy to miss.
---

A post is a Markdown file in `_posts/`, named `YYYY-MM-DD-slug.md`:

```yaml
---
title: "What I learned shipping it"
date: 2026-01-14
description: "One line. It becomes the card blurb, the search result and the
  social card — so write it for someone who has not decided to read yet."
tags: [craft, web]
image: /assets/img/posts/shipping.jpg
---
```

Everything except `title` and `date` is optional.

## The fields worth knowing

| Field | What it does |
| --- | --- |
| `description` | The card blurb, the search result, the meta description. Write it. |
| `tags` | Chips on the card, and a page per tag at `/tags/<tag>/`. |
| `image` | The cover. Leave it out and one is drawn from the collection. |
| `author`, `author_bio`, `author_avatar` | Override the site defaults for one entry. |
| `comments: false` | Drop the thread on this one. |
| `sidebar`, `shell`, `parts`, `widgets` | Override the page's composition — see [What a page is made of](/docs/composition/). |

## Headings and the contents

The contents rail is built from the `h2` and `h3` in your prose, at build time
in the browser, and it hides itself when there are fewer than two. So write
`##` headings because the piece needs them, not to make the rail appear.

## Images

Put them in `assets/img/` and reference them from the front matter or the body.
Nothing is resized or processed — what you commit is what ships, so commit
something sensible. A 4 MB photograph is a 4 MB photograph on someone's phone.

## Drafts

A file with a future `date` is not built. There is no `_drafts` workflow beyond
that, on purpose: one fewer place for a post to hide.

## Other collections

Same idea, different folder. `npm run new` scaffolds one with the right front
matter for whichever collection you pick.
