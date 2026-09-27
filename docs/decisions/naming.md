> **Decided: the name is `Scratchpad`.**
>
> This page is the study that got there and is kept for the reasoning, not the
> answer. Neither *Imprint* (which the repo used) nor *Manifold* (which this page
> recommended) survived: the theme was renamed **Scratchpad** on 2026-09-27, when
> its scope widened from one Jekyll theme to one design shipped as a starter for
> every stack. "A dev portfolio theme" became the tagline, which is the one thing
> this page got right — the search terms matter more than the word. See
> `ROADMAP.md`.

# Naming this theme

Ten candidates. The brief: it is for **builders, developers and creators** —
people who ship code *and* make things — and it should be what someone would
actually type into a search box when looking for this.

## What people actually search

Before the names, the search terms this has to sit near, because a name that
wins on taste and loses on search costs you every visitor who was looking for
exactly this:

> `jekyll portfolio theme` · `jekyll blog theme` · `developer portfolio
> template` · `personal website template github pages` · `jekyll theme for
> creators` · `multi collection jekyll theme` · `jekyll theme with portfolio
> and blog`

None of those contain a brand name. They contain **jekyll**, **portfolio**,
**developer**, **creator**, **github pages**. Whatever you pick, the repo
description and the README's first line should carry those words — the name
itself only has to be memorable, spellable and free.

## The ten

| # | Name | The idea | Why it might win | Why it might not |
| --- | --- | --- | --- | --- |
| 1 | **Imprint** | A mark pressed into a surface — what you leave behind. Also *print*, which is where this typography comes from. | Short, real word, spellable, no plural trap. Reads as craft rather than software. | Common word; `imprint` alone is taken on npm, so it ships as `imprint-theme`. |
| 2 | **Shipyard** | Where things get built and then actually leave. Developers already use "ship". | Strong single word; says *builders* immediately; memorable. | Slightly industrial; nothing about writing or film. |
| 3 | **Bylines** | The line that says who made this. A byline is the writer's, the director's, the committer's. | Points straight at the person; works for a blog, a film credit and a commit. | Skews editorial; a developer may not feel addressed. |
| 4 | **Makerfile** | A pun on `Makefile` — the file that says how a thing gets built. | Developers get it instantly and smile; "maker" covers creators too. | The joke needs one beat to land; risks reading as a build tool. |
| 5 | **Longform** | The format this theme is actually good at: essays, series, courses, films with a story. | Says what the content is, not what the tool is. Confident. | Undersells the portfolio and gear collections. |
| 6 | **Portfolio Kit** | Exactly what people search for, with no cleverness at all. | Unbeatable on search intent. Nobody has to be told what it is. | Generic; hard to own; forgettable as a brand. |
| 7 | **Groundwork** | The part you lay before anything else stands on it — which is what a theme is. | Warm, honest, developer-adjacent without being twee. | Abstract; says nothing about *what* it builds. |
| 8 | **Studio** | The place a creator works, whatever they make. | One word, universal across code, film and design. | Very taken. Search is hopeless on its own. |
| 9 | **Fieldnote** | What you write down while the work is still happening. Notes, trips, snippets, prompts. | Distinctive, fits the travel and snippets collections, quietly literary. | Doesn't say portfolio; singular/plural confusion. |
| 10 | **Everything** | The point of the theme: thirteen collections, one site, all of it in one place. | Cheeky and memorable; the tagline writes itself ("your everything, on one site"). | Unsearchable as a word; risky. |

## One name

**Manifold.**

> *manifold* (adj.) — many and various.
> *manifold* (n.) — the part that gathers many streams into one outlet.

Both meanings are the theme. Thirteen collections — essays, films, reels,
a course, a podcast, a newsletter, trips, gear — each shown the way that
kind of thing should be shown, all arriving at one site with one name on
it. The adjective describes the work; the noun describes the machine.

It also lands on all three audiences at once, which none of the ten below
manage: **builders** hear the engine part, **developers** hear the maths,
**creators** hear "many and various". Nobody has to be told what it means,
and nobody hears the same thing — which is the good kind of ambiguity.

Practically: one word, seven letters, spelled the way it sounds, no plural
trap, and `manifold-theme` is clean on npm and RubyGems. The tagline writes
itself — *many and various, on one site.*

Runner-up, if you want the publishing reading rather than the engineering
one: **Omnibus** — a single volume collecting works published separately,
which is literally the brief.

## If you want my read

**Imprint** if you want it to feel like craft, and you are happy being
`imprint-theme` on npm. It is already in the repo, the docs and the gemspec,
so choosing it costs nothing.

**Shipyard** if you want one word that says *builders* louder than anything
else here, and you are willing to pay the rename.

**Portfolio Kit** if you would rather win search than win taste. It is the
boring answer and it is probably the one that gets installed most.

## What renaming costs

The name appears in `package.json`, `imprint-theme.gemspec`, the README, the
docs, `.claude/skills/`, and the setup wizard's copy — about a dozen files.
`npm run test` and `npm run doctor` will catch anything missed. Nothing is
published yet, so there is no deprecation to manage: this is the cheapest it
will ever be to change.

Tell me the number and I will do the rename in one pass.
