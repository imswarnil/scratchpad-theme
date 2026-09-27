---
title: Collections
section: Filling it
order: 4
icon: stack
description: The thirteen that ship, and how to add your own.
---

A collection is a kind of content. Each gets its own folder, card design,
colour, landing page and structured-data type.

| Folder | What it is | Lives at |
| --- | --- | --- |
| `_posts/` | Essays and notes | `/blog/` |
| `_portfolio/` | Projects, films, design | `/portfolio/` |
| `_videos/` | Films (9:16 entries become reels) | `/videos/` |
| `_webseries/` + `_episodes/` | A series and its episodes | `/webseries/` |
| `_courses/` + `_lessons/` | A course and its curriculum | `/courses/` |
| `_podcast/` | Audio episodes | `/podcast/` |
| `_newsletter/` | Issues, in full | `/newsletter/` |
| `_snippets/` | Copy-pasteable code | `/snippets/` |
| `_prompts/` | Prompts, and what they produced | `/prompts/` |
| `_travel/` | Trips | `/travel/` |
| `_uses/` | Hardware, software, gear | `/uses/` |
| `_docs/` | This manual | `/docs/` |

Delete any you do not want. The setup form retires the folder, the landing page
and the config entry together, and backs them up first.

## Adding one

```yaml
  recipes:
    output: true
    title: Recipes
    singular: Recipe
    description: "One line about this collection."
    permalink: /recipes/:name/
    landing: /recipes/
    icon: cooking-pot           # any phosphoricons.com name
    schema: Recipe              # schema.org type, for JSON-LD
    card: blog                  # which card design
    hero: { pattern: dots, views: true }
    image: "/assets/img/covers/recipes.svg"
    single:
      shell: reading
      lead: cover
      parts: [breadcrumbs, head, lead, prose, tags, share, ask, author, nav]
      widgets: [toc, collection, about]
```

Then:

```bash
mkdir _recipes
printf -- '---\nlayout: page\ntitle: Recipes\npermalink: /recipes/\nlist_collection: recipes\n---\n' > recipes.html
npm run thumbs      # draws the cover art
npm run doctor      # tells you if you missed a step
```

## Child collections

An episode belongs to a series by `series: <slug>`; a lesson belongs to a course
by `course: <slug>`. That is the whole relationship — the parent page lists its
children, and a child page carries a rail of its siblings.
