# Relish Torte — Website & Admin Dashboard

A complete, deployment-ready website for **Relish Torte** — a 24/7 bakery, cake studio and hot
kitchen on Temple Road, Jos, Plateau State, Nigeria. Cakes, cupcake boxes, party plates and
apprenticeship programs, with a built-in admin dashboard.

Built as **pure HTML + CSS + vanilla JavaScript** — no frameworks, no build step, no server.
Every page opens directly from disk.

---

## Quick start

Double-click `static/index.html`. That's it.

- **Admin dashboard:** open `static/access-control.html`, PIN **`2407`**
- **Ask Torte (AI concierge):** gold sparkle button, bottom-right of any page
- **Place an order:** `static/order.html` — builds a formatted WhatsApp message
- Live site: <https://relish-torte.netlify.app> *(if deployed)*

> Works fully offline. Google Fonts and the Ask Torte Groq call degrade gracefully without
> a connection (fonts fall back to system stacks; chat falls back to a built-in rule engine).

---

## Repository layout

```
relish-torte/
├── static/                  ← THE SITE (deploy this folder)
│   ├── index.html           Home — hero, signature bakes, kitchen, story, programs, reviews
│   ├── menu.html            Full menu — 20 items, filters, per-item photo/like/rating
│   ├── cake.html            Product detail (reads ?cake=slug)
│   ├── order.html           Order form + Cake Studio design builder + Mix-&-Match box builder
│   ├── about.html           Story, gallery, values, apprenticeships, contact tiles
│   ├── reviews.html         Review wall + star-picker submission (moderated)
│   ├── contact.html         Contact form (WhatsApp handoff), hours, visit card
│   ├── access-control.html   Access-control dashboard — PIN login, orders, menu, reviews, content
│   ├── css/styles.css       Design system — dark + light themes
│   ├── js/
│   │   ├── data.js          Menu, reviews, programs, gallery/about/why content blocks
│   │   ├── site.js          Shared helpers (RT.*) — storage, formatting, WhatsApp, renderers
│   │   ├── ui.js            Theme, reveals, rails, side panel, lightbox, motion
│   │   ├── config.js        RT_CONFIG — Groq key, proxy, Google-admin allowlist
│   │   ├── ai.js            Ask Torte — Groq chat + rule-engine fallback
│   │   ├── engage.js        Likes, star ratings, post-order survey, hero carousel
│   │   └── admin.js         Dashboard logic
│   ├── images/              Logo, SVG art (fallbacks), photos/ (real photography)
│   ├── robots.txt · sitemap.xml
│   └── netlify.toml
├── docs/
│   ├── ARCHITECTURE.md      How the code fits together
│   ├── ADMIN-GUIDE.md       How to run the dashboard
│   ├── STRATEGY.md          The full engagement/order/review/rating/survey strategy
│   └── BUILD-PROMPT.md      Reusable master prompt for building sites like this
├── checkpoints/             Point-in-time snapshots + CHECKPOINT.md
└── client/ · server/        ⚠️ Superseded legacy stack (kept for reference; see below)
```

**Deploy target = `static/` only.** Everything else (docs, checkpoints, legacy stack) stays out
of the deploy folder on purpose.

---

## Features

### Public site
- Cinematic dark-luxury theme **with a light theme** (toggle in the header, remembered)
- Hero photo carousel, asymmetric product bento, rails & carousels, scroll reveals
- **❤ Like** any menu item and **★ rate** it (ratings show averages after moderation)
- Cake Studio — describe a custom cake (sponge, filling, tiers, colours, inscription…) live
- Mix-&-Match box builder — drag slots for 6/12/24-count cupcake boxes
- Every order & enquiry lands in your **WhatsApp** (24/7 number) pre-formatted
- Post-order feedback survey (stars + taste/packaging/delivery + comment)
- Ask Torte — AI chat assistant with menu/quote/hours knowledge
- Reduced-motion, keyboard-focus and mobile-first accessible

### Admin dashboard (`static/access-control.html`)
- Login: **PIN `2407`** now; Google sign-in (allowlisted Gmail) activates once deployed
- Dashboard: order pipeline (New → Confirmed → Baking → Done), stats, 30-day chart,
  AI week-in-review, most-ordered, customer feedback & ratings queues
- Menu: edit prices, toggle live/bestseller, swap images (URL or file upload → preview → Apply)
- Reviews: approve / reject / hide with undo
- Content tab: edit About story, Why-Us, gallery, shop photos, hero slides
- **Export / Import content** as JSON to move edits between browsers

---

## Configuration

All knobs live in `static/js/config.js`:

```js
window.RT_CONFIG = {
  GROQ_KEY: '',            // Groq API key (optional — rule engine works without it)
  GROQ_MODEL: 'llama-3.1-8b-instant',
  proxyMode: false,        // route through a serverless proxy if key must stay secret
  proxyUrl: '',
  ADMIN_GOOGLE_EMAIL: '',  // Gmail allowed to sign in (Google login phase)
};
```

| What | Where |
|---|---|
| WhatsApp number, prices, menu items | `static/js/data.js` |
| Admin PIN | `data.js` → `RT_ADMIN_PIN` |
| Brand colours / fonts | `css/styles.css` → `:root` tokens |
| Groq / Google settings | `js/config.js` |

The legacy root `.env` (`PORT`, `JWT_SECRET`, admin credentials) belongs to the **retired
Express stack** — the static site never reads it.

---

## Deployment

**Netlify** — drag `static/` onto <https://app.netlify.com/drop>, or connect the repo:
`netlify.toml` is already in `static/`.

**GitHub Pages** — publish `static/` from the `main` branch.

**Any static host** — upload `static/`; it needs nothing else.

> Google Sign-in and OAuth require **HTTPS** — on `file://` the PIN login is used instead.

---

## Validation

Run from the ops directory (jsdom installed):

| Check | Covers |
|---|---|
| `node --check` ×7 | JS syntax |
| `rt-validate.js` | HTML validity, links, inline JS |
| `rt-smoke.js` | Data/logic invariants |
| `rt-ids.js` | Duplicate element IDs |
| `rt-quality.js` | No emoji, one h1, image attrs, script order |
| `rt-css-classes.js` | CSS/HTML class drift |
| `rt-dom-test.js` | ~60 runtime assertions in jsdom |

---

## Legacy stack notice

`client/` (React + Vite), `server/` (Express + SQLite) and `dist/` are the **original build**
that was abandoned when the owner's antivirus blocked the local Node server. The static site in
`static/` is the shipping product. Legacy folders are kept only for reference and are not
deployed.

---

## Roadmap (wire-in ready)

1. **Your Groq key** → Ask Torte starts answering from live menu data
2. **Supabase** → Google sign-in, cross-device content sync, persistent analytics
3. **Real photography** → drop into `static/images/photos/` (SVGs remain fallbacks)
4. **Confirmed prices** → `data.js`

Made with ❤ in Jos.
