# Rebuild scratchpad.imswarnil.com in Next.js — implementation brief

You are rebuilding an existing Jekyll personal site (software engineer & filmmaker, Bengaluru) as a dynamic Next.js app with membership, payments and live data. Everything below is a requirement, not a suggestion. Where the current site defines a behaviour, reproduce it exactly; the behaviours are listed in §5. Build it in the phases in §8, in order.

---

## 1. Stack

- **Next.js 15, App Router, TypeScript strict.** Server Components by default; `"use client"` only for GSAP, filters, theme toggle, forms, checkout buttons.
- **Tailwind v4** with `@theme` mapping the IM tokens to CSS variables (§2). No arbitrary hex in components — tokens only.
- **Content:** MDX files under `content/<collection>/`. Use **`velite`** (typed frontmatter schemas, build-time collection index, no runtime FS). Schemas in §6.
- **Animation:** `gsap` (core only) for the hero. No ScrollTrigger; scroll effects are hand-rolled rAF listeners as on the current site.
- **Fonts:** `next/font/google` — `Geist` (variable, 100–900, body + headings), `Caveat` (500/600/700, handwritten accents only). `display: swap`, CSS variables `--sp-font-body`, `--sp-font-hand`.
- **DB:** Neon Postgres + Drizzle ORM (`drizzle-kit` migrations checked in).
- **Auth:** Auth.js v5 (`next-auth@beta`).
- **Payments:** Stripe (subscriptions + payment links) and Razorpay (India one-off support).
- **Deployment: Cloudflare Workers via `@opennextjs/cloudflare`.** Reason: the owner's other properties (`links.imswarnil.com`, `nac.imswarnil.com`, `creator.imswarnil.com`) already run as Workers on the `imswarnil.com` zone with Worker Routes; one platform, one secrets store (`wrangler secret put`), one DNS zone, and the site sits at the edge next to them. Use `wrangler.jsonc`, `nodejs_compat`, R2 for uploaded assets, KV for the YouTube/GitHub caches. Do not use Vercel-only APIs (`@vercel/og` → use `next/og` `ImageResponse`, which OpenNext supports).
- **Tooling:** pnpm, ESLint (next/core-web-vitals + typescript), Prettier, Vitest, Playwright, Husky pre-commit (`pnpm lint && pnpm typecheck`).

```
pnpm dlx create-next-app@latest imswarnil --ts --tailwind --app --src-dir --import-alias "@/*"
pnpm add gsap velite next-auth@beta @auth/drizzle-adapter drizzle-orm @neondatabase/serverless stripe razorpay zod
pnpm add -D drizzle-kit @opennextjs/cloudflare wrangler vitest @playwright/test
```

---

## 2. Design tokens (port verbatim)

Define in `src/styles/tokens.css`, imported by `globals.css`. Light on `:root`, dark under `:root[data-color-scheme="dark"]` and `@media (prefers-color-scheme: dark) { :root:not([data-color-scheme="light"]) }`.

```css
:root {
  /* colour — deliberately monochrome: accent IS black (light) / white (dark) */
  --sp-color-accent: #000; --sp-color-accent-foreground: #fff;
  --sp-color-contrast: #000; --sp-color-foreground: #4d4d4d;
  --sp-color-secondary: #757575; --sp-color-mute: #b2b2b2;
  --sp-color-background: #fff; --sp-color-background-100: #f3f3f3;
  --sp-color-background-200: #ededed; --sp-color-background-300: #dadada;
  --sp-color-surface: #fff; --sp-color-muted: #f1f1f1;
  --sp-color-border: rgba(0,0,0,.14); --sp-color-overlay: rgba(5,5,5,.7);
  --sp-color-success: #348f3f; --sp-color-warning: #d97706; --sp-color-danger: #c34d4d;
  /* space 1–10 */ --sp-space-1:.25rem; --sp-space-2:.5rem; --sp-space-3:.75rem; --sp-space-4:1rem; --sp-space-5:1.5rem; --sp-space-6:2rem; --sp-space-7:3rem; --sp-space-8:4rem; --sp-space-9:6rem; --sp-space-10:8rem;
  /* radius */ --sp-radius-1:6px; --sp-radius-2:8px; --sp-radius-3:10px; --sp-radius-4:14px; --sp-radius-5:18px; --sp-radius-6:24px; --sp-radius-pill:999px;
  /* type */ --sp-text-xs:.75rem; --sp-text-sm:.875rem; --sp-text-base:1rem; --sp-text-lg:1.125rem; --sp-text-xl:1.25rem; --sp-text-2xl:1.5rem; --sp-text-3xl:2rem; --sp-text-4xl:2.5rem; --sp-text-5xl:3.25rem;
  --sp-fw-regular:400; --sp-fw-medium:500; --sp-fw-semibold:600; --sp-fw-bold:700;
  --sp-leading-tight:1.2; --sp-leading-base:1.6;
  /* layout */ --sp-container:64rem; --sp-container-wide:78rem; --sp-container-narrow:42rem; --sp-content:44rem; --sp-sidebar:18rem; --sp-gutter:1.25rem;
  --sp-navbar-height:3.625rem; --sp-navbar-height-sm:3.25rem; --sp-hero-height:calc(100vh - var(--sp-navbar-height));
  /* shadow */ --sp-shadow-sm:0 1px 2px rgba(0,0,0,.06),0 1px 3px rgba(0,0,0,.08);
  --sp-shadow:0 10px 30px -10px rgba(0,0,0,.2),0 4px 10px -6px rgba(0,0,0,.16);
  --sp-shadow-lg:0 24px 60px -12px rgba(0,0,0,.22),0 8px 24px -10px rgba(0,0,0,.18);
  /* motion */ --sp-dur-1:180ms; --sp-dur-2:260ms; --sp-ease:cubic-bezier(.25,1,.5,1);
  /* z */ --sp-z-header:1000; --sp-z-overlay:1100; --sp-z-modal:1200; --sp-z-toast:1300;
  color-scheme: light;
}
@supports (height: 100svh) { :root { --sp-hero-height: calc(100svh - var(--sp-navbar-height)); } }
```

Dark overrides: accent/contrast `#fff`, foreground `#aaa`, secondary `#808080`, mute `#666`, background `#0f0f0f`, background-100 `#212121`, -200 `#282828`, -300 `#3f3f3f`, surface `#161616`, muted `#1c1c1c`, border `rgba(255,255,255,.16)`, shadow `0 20px 60px -10px rgba(0,0,0,.45),0 4px 20px -8px rgba(0,0,0,.4)`, `color-scheme: dark`.

Breakpoints: `sm 540`, `md 768`, `lg 992`, `xl 1200` px. Map into Tailwind `@theme` as `--breakpoint-*`, colours as `--color-sp-*`, spacing as `--spacing-sp-*`.

**Site width rule:** navbar (both states), hero, every section band, footer share `max-width: calc(var(--sp-container-wide) + 2*var(--sp-gutter))`, `padding-inline: var(--sp-gutter)`, `margin-inline: auto`. Reading pages use `--sp-container` / `--sp-content`. 12-column grid: `grid-template-columns: repeat(12, minmax(0,1fr)); gap: var(--sp-gutter)`; utilities `span-{n}`, `md:span-{n}`, `lg:span-{n}`.

---

## 3. Auth, membership, payments

### Auth.js v5
- Providers: GitHub, Google, Resend email magic link. Drizzle adapter, JWT sessions, `session.user.tier` injected from `members`.
- Routes: `/login`, `/account` (profile, tier, manage billing, delete account), `/api/auth/[...nextauth]`.
- Middleware protects `/account`, `/api/member/*`; never blocks public content (gating is in-render, §3.3).

### Schema (Drizzle, `src/db/schema.ts`)
```ts
users, accounts, sessions, verificationTokens // Auth.js adapter tables
members: { id uuid pk, userId fk unique, tier enum('free','supporter','pro') default 'free',
  stripeCustomerId text unique, stripeSubscriptionId text, subscriptionStatus text,
  currentPeriodEnd timestamptz, createdAt, updatedAt }
supporters: { id, userId nullable, name text, message text, amountMinor int, currency text,
  provider enum('stripe','razorpay'), providerRef text unique, public bool default true, createdAt }
webhookEvents: { id text pk (provider event id), provider, receivedAt } // idempotency
```

### Gated content
- Frontmatter `access: 'public' | 'supporter' | 'pro'` (default public).
- Server component `<Gated doc>`: reads session tier; renders full MDX if `tier >= access`, else the first `excerptLines` (frontmatter, default 8) + `<Paywall tier>` (benefits list, price, "Unlock with Pro" → Checkout, "Sign in" if anonymous). The gated body must never be sent to the client for non-members (render on server, no hidden DOM).
- Cards show a small lock chip for gated docs.

### Stripe
- Products: `supporter` (₹199/mo or $3), `pro` (₹499/mo or $8). Prices in env.
- `POST /api/billing/checkout` → Checkout Session (subscription, `client_reference_id = userId`, `customer` reused from `members.stripeCustomerId`).
- `POST /api/billing/portal` → Customer Portal session.
- `POST /api/webhooks/stripe`: verify signature; handle `checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.payment_failed`; upsert `members.tier/status/periodEnd`; dedupe via `webhookEvents`.

### Support / Donate (`/support`)
- Stripe Payment Links (one-off ₹/$ tiers) for international; Razorpay Checkout (order API + signature verification in `POST /api/webhooks/razorpay`) for India — detect by `Accept-Language`/geo header, let the user switch.
- On success, insert into `supporters` (name/message from the checkout form, `public` opt-in). `/support` renders a **supporters wall** (public rows, newest first, amounts hidden, name + message + date) plus totals.

### Env
```
DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_RESEND_KEY,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_SUPPORTER, STRIPE_PRICE_PRO, STRIPE_PAYMENT_LINK_SUPPORT,
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET,
YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID, GITHUB_TOKEN, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN,
NEXT_PUBLIC_SITE_URL
```
All server-only except `NEXT_PUBLIC_SITE_URL`. On Workers: `wrangler secret put` each; never in `wrangler.jsonc` vars.

---

## 4. Dynamic data

- **`/api/youtube`** (route handler, server-only key): channel uploads playlist → `playlistItems.list` (50) → `videos.list(part=snippet,contentDetails,statistics)`. Returns `{ id, title, publishedAt, duration (ISO8601→mm:ss), views, likes, thumb }`. Cache in KV 15 min (`revalidate = 900`); on the videos page and homepage, **merge** with `content/videos/*.mdx` by `video_id` (MDX adds essays/notes; API adds stats and fills videos with no MDX).
- **GitHub**: for each portfolio doc with `repo`, `GET /repos/{owner}/{name}` → `stargazers_count, forks_count, language, pushed_at`. Cached 1 h in KV; frontmatter values are the fallback. Rate-limit aware (`GITHUB_TOKEN`).
- **Spotify now-playing** (optional, `/api/spotify`): refresh-token flow, 30 s cache, shown on `/now` sidebar; "Not playing" state.
- **Search**: build-time JSON index from velite (title, excerpt, collection, tags, url) served from `/search-index.json`; client command palette (`/` key) fuzzy-matches it.

---

## 5. Pages & components — exact behaviours

### Global chrome
- [ ] **Theme**: inline `<script>` in `<head>` (before paint) reads `localStorage['sp-color-scheme']` (`light|dark|system`) and sets `data-color-scheme` on `<html>`; toggle in navbar persists it. No flash.
- [ ] **Skip link** to `#main`; visible focus rings (`outline: 2px solid var(--sp-color-accent); outline-offset: 2px`).
- [ ] **Navbar (island)**: at `scrollY ≤ 8` a full-width top bar (height `--sp-navbar-height`, translucent bg, blur). At `> 8` it becomes a floating pill: **same site width** (edges never move), height `--sp-navbar-height-sm`, `padding-inline: var(--sp-gutter)` (brand and last action sit on the hero's content edges), `border-radius: var(--sp-radius-6)`, border, `box-shadow: var(--sp-shadow-lg)`, `backdrop-filter: blur(12px) saturate(1.4)`, `padding-top: var(--sp-space-3)` on the outer sticky header. Transition 260ms.
- [ ] **Brand**: circular initials mark "SS" (from author name, `1.9rem`, contrast bg / background fg, 0.65rem bold) + site name; identical in both states; no logo image.
- [ ] **Progress ring**: an `<svg>` absolutely positioned at `inset:-1px` over the pill (compensates the 1px border so it matches the border-box), containing `<path pathLength="1">` whose `d` is a rounded-rect traced **left → bottom → right → top** (start at `(r,0)`, arcs with sweep-flag 0), `r = 24px`; `stroke-dasharray: 1; stroke-dashoffset: calc(1 - var(--sp-progress-ratio))`; `--sp-progress-ratio = scrollY / (scrollHeight - clientHeight)` set on rAF; stroke `color-mix(in srgb, var(--sp-color-contrast) 30%, transparent)`, 1.5px. Recompute geometry on resize AND on the pill's `transitionend` (measuring mid-transition gives wrong corners). Hidden in the top state.
- [ ] Nav: Home, Blog, Portfolio, Videos, Library (mega menu: Code → Snippets; AI → Prompts; featured → Archive), About (dropdown: About, Resume, More → Now, Timeline, Contact). Active item = pill highlight (`aria-current="page"`); Home only active on `/`. Actions: search, theme, GitHub star count (cached 24 h localStorage), optional sponsor/CTA. Mobile: hamburger drawer, dropdowns inline, tap-to-expand.
- [ ] **Footer**: 4 columns (details + social, Explore collection pills, Site links, Newsletter form), faint huge wordmark (`clamp(2.25rem, 9vw, 6rem)`, opacity .08), then a **full-bleed bottom strip** (bg `background-100`, border-top) with © year, legal links, "Back to top". Not boxed.

### Homepage `/`
- [ ] **Hero** on the 12-col grid: copy `col 1 / span 7`, photo `col 8 / span 5` centred; desktop `min-height: var(--sp-hero-height)`; mobile natural height, photo first. Copy: one-line row of handwritten quote (Caveat, −1.5° rotate) + uppercase pill eyebrow; H1 `clamp(2.5rem, 6vw, 3.25rem)` `letter-spacing:-.03em`; subtitle; meta row (role · company, location, green "open to" dot); CTAs "See my work" (/portfolio) + "Watch" (opens video lightbox) — **no search button**; social icon row. No "that's me"/signature annotations.
- [ ] **Hero background** (≥ lg, no reduced-motion): grid lines (42px, masked ellipse at 72%/28%), a drifting blurred accent glow (16 s yoyo), and an ambient YouTube iframe (`autoplay=1&mute=1&loop=1&playlist=<id>&controls=0&playsinline=1`) at 180% size, `filter: blur(26px)`, `opacity: .5`; its wrapper has `mask-image: radial-gradient(circle closest-side at 50% 45%, #000 0%, transparent 100%)` **and** `mix-blend-mode: screen`, and the hero sets an explicit `background: var(--sp-color-background)` + `isolation: isolate` so the blend has a white base (otherwise it renders as a grey smudge). `overflow: clip` on the hero. Nothing hidden by CSS.
- [ ] **Hero choreography (GSAP, `power3.out`)** — only when `document.visibilityState === 'visible'` (else wait for `visibilitychange`), skipped under reduced motion: photo `from {opacity:0, scale:1.05, y:28} 1.1s @0`; quote/eyebrow row `from {opacity:0,y:14} .7s @.12`; title words each wrapped `<span class="split"><span class="split-i">` (outer `overflow:hidden; padding-bottom:.14em; margin-bottom:-.14em` for descenders) `from {yPercent:115} .9s stagger .055 @.18`; subtitle/meta/CTAs/socials `from {opacity:0,y:18} .7s stagger .08 @.5`. Safety: `setTimeout(6000)` → `tl.progress(1)` if incomplete. Idle: photo `<img>` `to {yPercent:-2.2, rotation:.7} 5.5s sine.inOut yoyo repeat -1 delay 1.2`. Pointer (`(min-width:992px) and (pointer:fine)`): figure `xPercent/yPercent = (cursor - .5) * 2` via `gsap.quickTo` .7s. Scroll: copy container `y = -60*p`, `opacity = 1 - .85*p`, `p = scrollY / heroHeight`. Use `y` on the figure for entrance and `xPercent/yPercent` for drift so tweens never share a property.
- [ ] Sections below (each on the grid, `reveal` on intersect): Selected work (3 portfolio cards, "All work →"), Writing (3 posts), Videos (2, live from `/api/youtube` merged with MDX), Skills & stack (grouped pills from `content/resume.json`), "Let's talk" CTA band.

### Cards (`src/components/cards/*`)
- [ ] **Cover fallback**: `cover ?? <Thumb doc/>` where `<Thumb>` is the generated SVG (§5 Thumbnail).
- [ ] **BlogCard**: cover, kicker + read time, title, excerpt (140 chars), author avatar row, date, tags, "Read article →" button.
- [ ] **PortfolioCard** (GitHub-repo style): header `repo-icon owner/name` (from `repo` URL, else title) + `kind` badge; description; meta row language-dot + `language`, ★ stars, ⑂ forks, "Updated {pushed_at}" (live GitHub values override frontmatter); topic chips (`tags` ∪ `stack`); footer "View project" / "Code" / "Live". Carries `data-kind`, `data-tags`.
- [ ] **VideoCard** (player-styled): 16:9 media (`i.ytimg.com/vi/{id}/hqdefault.jpg`), centred play button, duration badge, fake progress bar; title, date/views row, "Watch →".
- [ ] **SnippetCard** (VS Code window): traffic lights + filename tab (`slug.ext` from `lang`), `<pre><code>` of `preview` (else first fenced block), CSS-counter line numbers, always-dark editor surface, footer lang badge + "Open snippet →" + Copy (Clipboard API, "Copied" state 1.5 s).
- [ ] **PromptCard** (chat window): header with model badge, user bubble (first 140 chars of `prompt`), assistant bubble with 3-dot typing indicator (CSS, reduced-motion → static), footer "Use prompt →" + Copy.

### Collection pages
- [ ] Compact head band on the grid: icon + title + one-line description (span 8) | count + "Updated {latest}" (span 4); dotted background; roughly half the old height.
- [ ] `/blog` (paginated 6/page, `/blog/page/[n]`), `/snippets`, `/prompts`: head + card grid (3-up ≥ lg, 2-up ≥ sm).
- [ ] `/videos`: background-video band (same masked/blurred iframe technique) + head + VideoCards from API ∪ MDX.
- [ ] `/portfolio` (+ `/projects` → 308 redirect): grid with a **sticky filter aside** (`lg:span-3`, `top: calc(var(--sp-navbar-height) + var(--sp-space-4))`) and cards (`lg:span-9`). Groups: Kind (`kind` values) and Stack (union of `tags` ∪ `stack`), toggle buttons with counts, Clear, "N of M shown". **State lives in URL search params** (`?kind=project&tag=web&tag=jekyll`), read on load, updated with `router.replace` (no scroll). Mobile: aside becomes a horizontal scrolling chip row above the grid.
- [ ] `/archive`: every collection grouped, compact lists. (`/explore` removed.)
- [ ] Single doc pages `/[collection]/[slug]`: reading shell (`--sp-content` column + `--sp-sidebar` right sidebar with TOC from h2/h3 via IntersectionObserver highlight, about widget, CTA); collection lead blocks — video embed; prompt box with Copy; snippet lang line; **portfolio header**: Code/Live buttons, stack chips, role/year/kind facts, facts grid. JSON-LD per collection `schema`. Gated rendering per §3.3.

### Thumbnail generator
- [ ] `<Thumb doc size?>` inline SVG (`viewBox 0 0 1200 675`): pattern chosen by `title.length % 4` (dots 28px / grid 48px / diagonal 22px / rings 120px) in `currentColor` at .16–.22 opacity, background `background-100`, radial white veil from 85%/15%, initials disc top-right (contrast fill, background text, r 46, 34px bold), `<foreignObject>` block bottom-left: uppercase kicker (`kind ?? collection singular`, 26px, .12em tracking, secondary), title (72px bold, 3-line clamp), meta line (`lang|model|duration|year|date` · first 3 tags, 28px). Pattern/gradient ids suffixed with the slug (duplicate ids across many inline SVGs break `url(#…)`). Themed via tokens.
- [ ] `app/og/[collection]/[slug]/route.tsx`: same composition as an `ImageResponse` (1200×630, Geist loaded via `fetch` of the font file) used for `<meta property="og:image">` when the doc has no cover.

### Standalone pages
- [ ] **/about**: header row; photo (span 5) + story (span 7); "How I work" 3 cards; toolbox pills; "Elsewhere" social row; CTA. Real copy.
- [ ] **/contact**: message card (span 7: mailto CTA + form → `POST /api/contact` with Turnstile, stores to `contacts` table + emails via Resend) and sticky aside (span 5: email, location, response time, socials, "Book a call").
- [ ] **/now**: dated stacked sections (span 8) + sticky sidebar (span 4: updated date, location, Spotify now-playing, nownownow note, contact CTA).
- [ ] **/resume**: its own **sticky bar** just under the navbar (`top: var(--sp-navbar-height)`, island treatment, site width): "← Back to site" | name + tagline | Save as PDF (`window.print`) · Email · LinkedIn. ATS-compliant semantic sections in order: Summary, Core Skills (grouped), Experience (role · company · location · `Mon YYYY – Mon YYYY`, numeric bullets), Projects, Education, Certifications, Awards, Languages, Links. Grid: main span 8 + sticky sidebar span 4 (contact, skills-at-a-glance, links, 3 stat tiles, "Open to", "Currently"). `@media print`: hide navbar/footer/bar/sidebar, single column, black on white, `break-inside: avoid`, URLs after links. Data from `content/resume.json`.
- [ ] **/timeline**: every doc with `timeline: true`, newest first, on a vertical rail (span 8): milestone cards (date pill, media = `video_id` embed | cover | Thumb, kicker, title, note, tags), alternating sides ≥ lg; sticky sidebar (span 4): year jump links, per-collection counts, how-to note.
- [ ] **/sitemap**: centred tree stage (root = site, branches = collections + Pages) with connector lines, horizontally scrollable and auto-centred on the root on load; per-branch collapse/expand buttons (`aria-expanded`, keyboard), Expand all / Collapse all, list-view toggle. Plus `sitemap.xml`, `robots.txt`, `feed.xml` (RSS 2.0, posts).
- [ ] **/design**: live style guide — architecture note, token swatches (live, flip with theme), type scale, weights, spacing/radius rows, buttons, cards, navbar/footer/dark-mode/motion write-ups. Reuse real components.
- [ ] **/search**: full page over the index; command palette (`/`, `Esc`, arrow keys) global.
- [ ] `/login`, `/account`, `/support`, `/404`, `/offline` (PWA: manifest + service worker via `serwist`).

### Motion & a11y globals
- [ ] `.reveal` elements fade/rise on intersect; visible if JS fails. `@media (prefers-reduced-motion: reduce)` kills all durations. View Transitions API cross-fade between routes where supported.

---

## 6. Content model

`velite.config.ts` collections (all: `title`, `date`, `updated?`, `description?`, `excerpt?`, `tags: string[]`, `cover?`, `image?`, `access: 'public'|'supporter'|'pro' = 'public'`, `timeline?: boolean`, `timeline_note?`, `draft?`):

```ts
posts:     { read_time?: number, author?: string, series?: string }
portfolio: { kind: 'project'|'film'|'design', summary?, role?, year?: number,
             stack?: string[], lang?: string, stars?: number, forks?: number,
             repo?: url, demo?: url, facts?: {label, value, icon?}[], client?: string }
videos:    { video_id: string, duration?: string, channel?: string, views?: number }
snippets:  { lang: string, preview?: string, source?: url }
prompts:   { model: string, prompt: string, variables?: string[] }
```
Slugs from filename; URLs `/blog/[slug]`, `/portfolio/[slug]`, `/videos/[slug]`, `/snippets/[slug]`, `/prompts/[slug]`. Posts keep `YYYY-MM-DD-slug.mdx` → date from filename if absent.

**Migration from Jekyll**
- `_posts, _portfolio, _videos, _snippets, _prompts` → `content/<collection>/*.mdx` (rename `.md`; convert Liquid includes to MDX components; `{% include components/callout.html %}` → `<Callout>` etc.).
- `_config.yml resume:` → `content/resume.json` (`name, tagline, avatar, summary, contact, core_skills{}, experience[], projects[], education[], certifications[], awards[], languages[], links[], stats[]`).
- `navigation_header/footer/legal` → `src/config/nav.ts`; `header:`/`footer:` options → `src/config/site.ts` (`siteWidth`, `heroVideoId`, `social`, `email`, `location`, `work`).
- Old URLs: keep `/blog/:slug`, `/portfolio/:slug`; add redirects `/projects/*→/portfolio/*`, `/cv→/resume`, `/explore→/archive` in `next.config.ts`.
- Assets: `/assets/**` copied to `public/assets/**`; portrait `public/assets/Swarnil-Singhai.png`.

---

## 7. Non-functional

- Lighthouse ≥ 95 (perf/a11y/best/SEO) on `/`, `/blog`, `/portfolio`, a post; **CLS 0 on the hero** — reserve the photo box with `width/height` + `aspect-ratio`, fonts `size-adjust`, no CSS-hidden start states.
- GSAP only on routes with a hero (dynamic import in the hero client component); videos iframe only ≥ lg and never under reduced motion.
- `next/image` for covers; remote patterns for `i.ytimg.com`, `avatars.githubusercontent.com`.
- Security: CSP (script-src self + cdnjs/js.stripe.com/checkout.razorpay.com; frame-src youtube.com youtube-nocookie.com stripe razorpay), webhook signature verification, Turnstile on forms, rate-limit API routes (KV token bucket).
- SEO: metadata per route, canonical, OG/Twitter (generated OG route), JSON-LD (`Person` site-wide; `BlogPosting/CreativeWork/VideoObject/TechArticle` per doc), `sitemap.xml`, `robots.txt`, RSS.
- Tests: Vitest — thumb pattern selection, filter param parsing, tier gating, duration parsing. Playwright smoke — hero completes (no element left at opacity 0 after 7 s), navbar pill width == hero width after scroll, portfolio filter updates URL and count, gated post shows paywall anonymous / body as pro (mock session), Stripe webhook upserts tier (mock event).
- CI (GitHub Actions): lint, typecheck, unit, build, Playwright on preview, deploy via `wrangler deploy` on `main`.

---

## 8. Delivery phases

1. **Foundation** — scaffold, tokens, fonts, theme script, layout shell, 12-col grid, navbar (both states + ring), footer, `/design`. *Done:* pixel-match of chrome against the Jekyll site at 1440/1024/390; ring passes the width/transitionend test.
2. **Content + cards** — velite schemas, migrated MDX, Thumb + OG route, all five cards, collection pages, single pages, filter sidebar, archive, search index + palette. *Done:* every old URL resolves or redirects; Playwright filter test green.
3. **Hero + motion** — GSAP hero, background video, reveal, view transitions, reduced-motion. *Done:* CLS 0, hero smoke test green, Lighthouse ≥ 95.
4. **Standalone pages** — about, contact (+ API + Turnstile), now, resume (+ print), timeline, sitemap page/xml, RSS, PWA. *Done:* print preview of resume is single-column and readable; sitemap toggles keyboard-operable.
5. **Dynamic data** — YouTube route + KV cache + merge, GitHub stats, Spotify, ISR. *Done:* videos page renders with API down (MDX fallback) and with MDX absent (API only).
6. **Auth + membership** — Drizzle schema/migrations, Auth.js providers, `/login`, `/account`, gating + paywall. *Done:* gated body absent from HTML for anonymous users; auth-gate test green.
7. **Payments** — Stripe checkout/portal/webhooks, Razorpay support, supporters wall. *Done:* webhook test green; test-mode subscription upgrades tier end-to-end.
8. **Ship** — CSP, rate limits, CI, `wrangler.jsonc`, secrets, Worker Route on `imswarnil.com` zone, DNS. *Done:* production Lighthouse ≥ 95 and all Playwright smoke tests green against the live URL.
