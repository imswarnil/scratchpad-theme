---
name: collection-art
description: Decide what a cover image should be for an entry in this theme — a post, a project, a film, an episode, a course, a podcast, a newsletter issue, a trip, a piece of gear — and either brief a photograph, generate one, or leave the drawn fallback in place. Use when someone asks what image a post should have, asks for thumbnail or cover art, or is adding a collection and wants to know what its pictures should look like.
---

# What a cover should be, per collection

Every entry in this theme can have an `image:`. If it does not, one is drawn
from its collection — the collection's colour, its pattern and its mark. **That
fallback is a real answer, not a placeholder**, and for several collections it
is the right one. The first question is therefore not "what picture" but
"should there be a picture at all".

## The rule that governs all of them

**A cover carries no words.** The title is already under the card, in real type
that wraps, reflows and can be selected. Setting it again inside the picture
means it is set twice, at a size nobody chose, and clipped the moment the card
is narrower than the artwork. If a cover seems to need a caption, the caption
belongs in `description:`.

A cover is 16:10 in a card, 2:3 as a series poster, 9:16 as a reel, and 1200×675
as a social card. Anything shipped should survive all of those crops, which
means: subject centred-ish, nothing important in the outer sixth.

## Per collection

**`posts`** — leave it drawn unless you have a photograph that is *about the
post*. A stock image of a laptop is worse than the drawn cover, because the
drawn one at least says "this is a post" honestly. Good exceptions: a photo you
took of the thing you are writing about, a screenshot of the actual artefact, a
diagram you made.

**`portfolio`** — a real screenshot, always. This is the one collection where a
generic cover is a failure: the whole point of a project entry is showing what
you made. Use `screenshots:` for the carousel and let `image:` be the best of
them. Shoot the interface at a real width with real content — never lorem, never
an empty state.

**`videos`** — do not set one. The YouTube thumbnail is fetched from
`video_id:`, and it is the frame you already chose in the uploader. Setting a
different `image:` means the card and the video disagree.

**`webseries`** — a `poster:` in 2:3, and it is worth making properly: a still
from the series, graded, with room at the foot where the title and the facts sit
over the scrim. Portrait, because that is the shape a title card has been since
the video shop.

**`episodes`** — the still from that episode, or nothing. If `video_id:` is set
it comes from YouTube like a video.

**`courses`** — leave it drawn, or use a frame of the thing being taught (the
dashboard, the editor, the instrument). A cover with a smiling person at a
laptop is a stock-photo tell.

**`lessons`** — nothing. A lesson lives inside a course; the course's art is
the identity and a per-lesson image just adds noise to the curriculum list.

**`podcast`** — leave it drawn. The podcast's own artwork belongs on the
collection (`image:` in `_config.yml`), not per episode. A guest photo is worth
it only when the guest is the draw.

**`newsletter`** — leave it drawn. An issue is a letter; a picture on the front
of it is a magazine cover, which sets the wrong expectation for the format.

**`snippets`** and **`prompts`** — never set one. Both cards *are* the artwork:
a code window and a chat window, drawn from the entry's own content. An image
would sit above a picture of the thing it is trying to illustrate.

**`travel`** — a photograph, and the best one you have. This is the other
collection where the picture is the content. Landscape, shot wide enough that
the 4:3 card crop does not cut the subject. The words sit over the scrim at the
foot, so leave that third uncluttered.

**`uses`** — a clean product shot on a plain ground, or the drawn cover. Shoot
it yourself where you can: a manufacturer's render next to your own photographs
looks borrowed, because it is.

**`docs`** — nothing. The rows carry an icon.

## If you are generating one

Brief it as a photograph, not as an illustration of a concept:

> A [wide/portrait] photograph of [the actual subject], [lighting], shot on
> [lens character]. No text, no logos, no people looking at the camera.
> Composition leaves the lower third uncluttered.

Then check it at 320px wide — the size a card actually shows — before deciding
it works. Most generated images fall apart there, and a cover that only reads at
full size is a cover that only reads in the brief.

## Adding a collection

Give it a mark in `_includes/utility/mark.html` and the same drawing in
`MARKS` in `tools/thumbs.mjs` — the inline cover and the file-based one have to
match, because an entry that gains a real `.svg` later should not suddenly look
like it belongs to a different site. Simple shapes on a 24-unit grid: at the
size a card shows them, detail is noise.

Then `npm run thumbs` and the collection has art.
