# Checkpoint — v1.0 Static Site Foundation

**Date:** 2026-10-07
**Status:** All validation green — 57 runtime DOM assertions passing.

## What this snapshot contains

Full copy of `static/` at the end of the v2 rebuild (Phases 1–10):

- 8 HTML pages: `index`, `menu`, `cake`, `order`, `about`, `reviews`, `contact`, `admin`
- `css/styles.css` — v2 cinematic dark-luxury design system (dark + light themes)
- `js/data.js` — 20 menu items, reviews, programs, alumni, admin PIN
- `js/site.js` — shared `RT` helpers (WA links, orders, reviews, exports)
- `js/ui.js` — theme toggle, reveals, rails, side panel, lightbox, motion
- `js/config.js` + `js/ai.js` — Groq config + Ask Torte concierge (rule-engine fallback active)
- `js/admin.js` — dashboard (login, orders pipeline, menu edits, reviews moderation)
- 33 SVG placeholders + logo mark
- No build step; opens directly via `file://`

## How to roll back

```powershell
Remove-Item -Recurse -Force C:\Users\Stylez\Downloads\relish-torte\static\*
Copy-Item -Recurse -Force C:\Users\Stylez\Downloads\relish-torte\checkpoints\v1.0-static-site\* `
          C:\Users\Stylez\Downloads\relish-torte\static\
```

## Validation suite (at this checkpoint)

Run from `C:\Users\Stylez\AppData\Local\Temp\opencode`:

| Check | Command | Result |
|---|---|---|
| Syntax | `node --check` on 6 JS files | PASS |
| HTML/refs | `node rt-validate.js` | PASS (8 pages) |
| Logic smoke | `node rt-smoke.js` | PASS (19 asserts) |
| Duplicate IDs | `node rt-ids.js` | PASS |
| Quality lint | `node rt-quality.js` | PASS (44 files) |
| Runtime DOM | `node rt-dom-test.js` | PASS (57 asserts) |

## Known state

- `RT_CONFIG.GROQ_KEY` is empty — rule engine handles all chat replies.
- Admin PIN `2407`; session key `rt_admin`.
- Prices: only cupcakes (₦8k/₦15k) confirmed by owner; others marked as estimates.
- Photos: SVG placeholders only — v3 replaces with local photos + admin URL overrides.
