---
title: What a page is made of
section: Shaping it
order: 5
icon: stack-simple
description: Parts, widgets, leads and shells — the four dials on an entry page.
---

This is the part that stops you editing templates. **An entry page is composed
from lists in `_config.yml`:**

```yaml
collections:
  portfolio:
    single:
      shell: split
      lead: portfolio
      parts: [breadcrumbs, head, lead, prose, tags, share, ask, comments, author, nav]
      widgets: [details, toc, collection, cta]
```

- **`shell`** — how wide the page is and what sits beside it
- **`lead`** — the block between the title and the body
- **`parts`** — stacked down the page, in the order you write them
- **`widgets`** — the sidebar, in the order you write them

Every name is a file. `parts` are `_includes/single/<name>.html`, `widgets` are
`_includes/widgets/<name>.html`, `lead` is `_includes/leads/<name>.html`.
**To invent one, drop a file in and name it.** No layout changes.

Any single entry can override all four in its own front matter, so one post can
drop its comments or add a widget without affecting the rest.

## The five shells

| `shell` | What it is | Used by |
| --- | --- | --- |
| `reading` | A reading column, centred, nothing beside it | posts, snippets, prompts, newsletter |
| `aside` | A reading column with a rail beside it | podcast |
| `wide` | The full fluid container | videos, web series, episodes, courses |
| `split` | 70 / 30, the rail sticky | portfolio, travel, uses |
| `course` | Contents on the **left**, the page beside them | lessons, these docs |

A post is read, not scanned, and a column of widgets beside 44rem of type is a
second thing competing for the same attention — so prose collections have no
sidebar. A film and a lesson are pictures, so they take the room. Inside a
`wide` shell the prose still sets itself on the reading measure; only the media
spans.

## What ships

**Parts** — `breadcrumbs`, `head`, `head-split`, `toc-mobile`, `lead`,
`prose`, `tags`, `share`, `ask`, `comments`, `author`, `nav`, `episodes`,
`lessons`, `siblings`, `coursenav`, `docsnav-prevnext`.

`head-split` is `head` with a second column: the words on one side, the
picture on the other, across the full width of the shell, with the body and
its rail below. Use it instead of `head` **and** `lead` for an entry whose
picture earns a whole column — `_travel` uses it. With no picture it falls
back to one column, so it is safe anywhere.

**Widgets** — `toc`, `details`, `collection`, `about`, `cta`, `share`,
`subscribe`, `ad`.

**Leads** — `cover`, `video`, `prompt`, `snippet`, `portfolio`, `series`,
`audio`, or `none`.
