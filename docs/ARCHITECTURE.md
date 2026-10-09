# Architecture — Relish Torte Static Site

No framework, no build step, no server. Everything runs in the browser from `file://` or any
static host. This document is the map.

---

## 1. Page inventory & load order

Every page follows the same skeleton:

```html
<body data-page="home">           <!-- identifies the page for ui.js/admin.js -->

  <header class="site-header">…   <!-- shared nav -->
  <main>…                          <!-- page sections -->
  <footer class="site-footer">…    <!-- shared footer -->
  <a class="wa-float">             <!-- WhatsApp float -->
  <button class="ai-fab">          <!-- Ask Torte -->

  <script src="js/data.js"></script>   <!-- 1. pure data, no DOM -->
  <script src="js/site.js"></script>   <!-- 2. RT.* helpers (uses data) -->
  <script src="js/ui.js"></script>     <!-- 3. chrome: theme, reveals, rails, lightbox -->
  <script src="js/config.js"></script> <!-- 4. RT_CONFIG (Groq / Google) -->
  <script src="js/ai.js"></script>     <!-- 5. Ask Torte panel -->
  <script src="js/engage.js"></script> <!-- 6. likes, ratings, survey, carousel -->
  <script>…DOMContentLoaded page wiring…</script>
```

Order matters: `ui.js`, `ai.js`, `engage.js` and the inline block all listen for
`DOMContentLoaded`, so they may appear in any order after `site.js` — but `data.js` must always
be first. `access-control.html` (dashboard, formerly `admin.html`) swaps steps 4–6 for `js/admin.js`.

**Per-page markers:** `data-page` values are `home | menu | cake | order | about | reviews |
contact | admin`.

---

## 2. Module responsibilities

### `data.js` — pure data (no DOM access)
| Export | Purpose |
|---|---|
| `RT_MENU` | 20 items: `slug, name, category(cake/kitchen/pastry), price, desc, img, svg, tags, available, featured, bestseller` |
| `RT_REVIEWS` | Seed testimonials (name, quote, stars, tags, date) |
| `RT_PROGRAMS`, `RT_SOON_PROGRAM`, `RT_ARCHIVE_PROGRAM`, `RT_ALUMNI` | Apprenticeship content |
| `RT_CATERING` | Catering chip labels |
| `RT_ABOUT`, `RT_WHY`, `RT_HOW`, `RT_GALLERY`, `RT_SPACE` | Editable content blocks (v3) |
| `RT_PHOTO_MAP` | slug → photo path override (defaults for real photography) |
| `RT_ADMIN_PIN` | Admin PIN (`'2407'`) |
| `RT_WA`, `RT_PHONE`, `RT_ADDRESS`, `RT_IG` | Contact constants |

### `site.js` — the `RT` namespace (helpers, no visuals)
- **Formatting:** `naira`, `prettyDate`, `esc`, `initials`, `starsHtml`
- **URL:** `getParam`, `waLink(msg)` (builds `wa.me` deep links), `minOrderDate`
- **Storage:** `load(key, fallback)` / `save(key, value)` — try/catch wrapped because
  `file://` origins may block storage; falls back to an in-memory object
- **Domain:** `getMenu()` (merges `rt_menu_overrides` over `RT_MENU`), `findCake`,
  `saveOverride`, `getOrders`/`saveOrder`, `getLocalReviews`/`saveLocalReview`,
  `allApprovedReviews` (seed + approved local), `makeRef` (order reference `RT-XXXX`)
- **Render:** `cakeCardHtml`, `reviewCardHtml`, `renderReviewsInto`
- **Forms:** `buildOrderMessage`, `setFieldError`
- **Chrome:** `initHeader` (sticky header state, mobile nav, theme toggle wiring)

### `ui.js` — presentation chrome
Theme engine (`dark` ⇄ `light` persisted to `rt_theme`), IntersectionObserver reveals with
stagger delays (`data-d`), scroll rails with arrow controls, side panel + lightbox (Esc /
backdrop close), reduced-motion detection, parallax-safe hero behaviour.

### `config.js` + `ai.js` — Ask Torte
```js
RT_CONFIG = { GROQ_KEY, GROQ_MODEL, proxyMode, proxyUrl, GOOGLE_CLIENT_ID, ADMIN_GOOGLE_EMAIL }
RTAI = { open, close, ask, get_menu, get_quote, get_hours_areas,
         build_order, describeCake, weekInReview, systemPrompt }
```
**Reply ladder:** Groq API → rule engine (`get_menu` / `get_quote` / `get_hours_areas` /
`build_order`) → canned fallback. Rate guards: 2 s minimum between calls, 40 per session.
The system prompt carries menu JSON + brand voice. No key → straight to rule engine.

### `engage.js` — engagement layer (v3)
Likes (`rt_likes`), product star ratings (`rt_ratings`, admin-approval queue), post-order
survey (`rt_feedback`), hero photo carousel, lightbox wiring for gallery pages.

### `admin.js` — dashboard
Auth gate → tab router (`data-tab`), dashboard stats/chart/orders pipeline with side sheet,
menu table with inline price editing + undo toast, review moderation, content editors and the
image manager (URL/file → preview → Apply/Cancel). Chart.js loads from CDN with a
canvas-drawn fallback when offline.

---

## 3. Data flow

```
RT_MENU (defaults, data.js)
   └── + rt_menu_overrides (localStorage) ──▶ RT.getMenu() ──▶ page renders
                    ▲
                    └── admin Menu tab price/live edits

RT_REVIEWS (seed) ─┐
                   ├──▶ allApprovedReviews() ──▶ reviews page, home carousel
rt_reviews (local) ┘      (only status === 'approved')

order form ──▶ buildOrderMessage() ──▶ wa.me deep link ──▶ customer's WhatsApp
           └──▶ saveOrder() ──▶ rt_orders ──▶ admin pipeline

post-order survey ──▶ rt_feedback ──▶ admin Dashboard feedback queue
like / rating    ──▶ rt_likes / rt_ratings ──▶ ratings queue ──▶ approved avg on cards
content edits    ──▶ rt_content ──▶ RT.getContent() merges over RT_ABOUT/RT_WHY/…
image manager   ──▶ rt_image_overrides ──▶ RT.imgFor(slug) overrides RT_PHOTO_MAP
```

---

## 4. Storage keys

| Key | Store | Contents |
|---|---|---|
| `rt_theme` | localStorage | `dark` \| `light` |
| `rt_menu_overrides` | localStorage | `{slug: {price, available, bestseller, img}}` |
| `rt_orders` | localStorage | Order records `{ref, items, total, status, ts, …}` |
| `rt_reviews` | localStorage | Submitted reviews `{id, name, quote, stars, status}` |
| `rt_newsletter` | localStorage | Subscriber emails |
| `rt_content` | localStorage | Edited `RT_ABOUT` / `RT_WHY` / `RT_HOW` / `RT_GALLERY` / `RT_SPACE` |
| `rt_likes` | localStorage | `{slug: count}` merged over defaults |
| `rt_ratings` | localStorage | `{slug: {sum, n, mine}}` + pending queue |
| `rt_feedback` | localStorage | Post-order survey responses |
| `rt_image_overrides` | localStorage | `{slugOrKey: pathOrDataURL}` |
| `rt_admin` | sessionStorage | `'1'` when logged in (cleared on tab close) |
| `rt_ai_greeted` | sessionStorage | Ask Torte greeting suppression |

Storage calls are always guarded — on origins that block storage (common on `file://`) the
site keeps working in-memory for the session.

---

## 5. Design system

Defined once in `css/styles.css`:

```
Tokens (:root)          dark theme:  --bg #0e0c0a, --surface #16120f, --text #f5ede4,
                                         --gold #c9a227, --amber #e8a317, --choc #5c2e12
[data-theme="light"]    light theme: --bg #fdf6e9, --text #3a2313, --accent-text #8f7016
--glass                 glassmorphism surface (backdrop-filter blur + saturate)
Typography              Fraunces (display) + Inter (UI) via Google Fonts, system fallbacks
Components              .btn (gold/outline, sm/md/lg, 4K sheen animation), .card, .chip,
                        .bento, .rail, .cake-card, .pill (status), .form-shell, .corner-ticks
Motion                  .reveal + IntersectionObserver; fully disabled under
                        prefers-reduced-motion
Accessibility           :focus-visible gold rings, aria labels on icon buttons, alt +
                        width + height on every img, one h1 per page
```

Tokens are the only place colours live — retinting the whole brand is a `:root` edit.

---

## 6. Validation suite

Located in the ops temp dir (jsdom installed alongside):

| File | Asserts |
|---|---|
| `rt-validate.js` | HTML parses, internal links/assets resolve, inline JS parses |
| `rt-smoke.js` | Data invariants (20 items, prices, refs, WA link shape, message build) |
| `rt-ids.js` | No duplicate `id`s within a page |
| `rt-quality.js` | No emoji, one `h1`/page, img attributes, nav + script stacks |
| `rt-css-classes.js` | Classes referenced in HTML exist in CSS (and vice-versa) |
| `rt-dom-test.js` | jsdom runtime: page boot, order/review/contact submits, admin login, price edit + undo, AI reply, likes, ratings, survey, content save/export/import, image preview→Apply |

---

## 7. Deployment model

- Deploy folder: **`static/`** (see `static/netlify.toml`).
- `robots.txt` + `sitemap.xml` + full Open Graph/Twitter meta on every page.
- HTTPS required for Google OAuth; PIN login is the local-file path.
- Supabase (future): swap `site.js` storage helpers for REST calls — the public API of
  `RT.*` stays identical, so pages don't change.
