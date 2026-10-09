# Strategy — Relish Torte Growth Engine

How every piece of the site feeds the business. This is the operating playbook: what each
feature does, where the data goes, and what to do with it.

---

## The core loop

```
ATTRACT ──▶ BROWSE ──▶ ENGAGE ──▶ ORDER ──▶ DELIVER ──▶ FEEDBACK ──▶ SOCIAL PROOF ──▶ ATTRACT
 (SEO/OG)   (menu)   (likes/★/AI)  (WhatsApp)  (24/7)    (survey)     (reviews/ratings)
```

Every feature belongs to exactly one stage. Nothing exists that isn't feeding the loop.

---

## 1. Order funnel — "screen to celebration"

**Goal:** compress WhatsApp ordering to three taps.

1. **Browse** — `menu.html` (20 items, filters, photos, likes, ratings) or the home bento.
2. **Configure** — `cake.html` detail or the two builders on `order.html`:
   - *Cake Studio* — sponge, filling, tiers, colours, inscription → live summary + price
   - *Mix-&-Match* — 6/12/24 tray slots → live total
3. **Submit** — one form captures name, phone, date, address, notes.
4. **Handoff** — `buildOrderMessage()` formats everything into a WhatsApp deep link
   (`wa.me/2348166899379?text=…`) and opens it. The customer sends; you reply 24/7.
5. **Capture** — simultaneously the order is saved to `rt_orders` with a reference
   (`RT-XXXX`), so the **admin pipeline** shows it even if the customer never presses send.

**Design choices that matter:**
- WhatsApp is the real checkout (no payments to integrate, matches how Jos orders today).
- Form + pipeline double-capture means zero lost orders.
- `minOrderDate` blocks past dates; validation errors point at the exact field.
- The order confirmation screen triggers the **feedback survey** (see §4).

**KPIs:** form completion rate · orders/week · New → Confirmed time · repeat orders.

---

## 2. Likes — cheap engagement signals

**Goal:** give visitors a zero-friction way to interact, and surface crowd favourites.

- ❤ button on every product card; one click per browser per item (toggleable).
- Count is immediate and animated — social proof while browsing.
- Stored in `rt_likes`, merged over defaults.

**What to do with it:** items with rising likes but low orders are pricing/visibility
candidates for the Menu tab; the top-liked strip becomes a "Jos's favourites" merchandising
line on the home page.

---

## 3. Star ratings — trust before purchase

**Goal:** product-level social proof, not just page-level testimonials.

1. Visitor taps stars on a card → stored in `rt_ratings` with status **pending**.
2. Admin **Ratings queue** approves or hides (undo-able).
3. Approved ratings publish the **average + count** on the menu card and detail page.

**Why moderation:** prevents joke ratings; you approve in one tap.
**KPIs:** rating coverage per item · average per category · rate of pending → approved.

---

## 4. Post-order survey — close the loop

**Goal:** measure the three things that kill repeat orders.

Shown right after a successful order (confirmation screen, optional):

| Question | Why |
|---|---|
| Overall ⭐ (1–5) | Single headline satisfaction number |
| Taste | Product quality alarm bell |
| Packaging | Delivery/shrinkage issues |
| Delivery | Timeliness — the #1 complaint in food delivery |
| Comment | Free-form detail + future testimonial source |

Stored in `rt_feedback` → **Dashboard → Customer feedback** with running averages.

**Action rules:**
- Any category trending below 4★ for a week → fix that stage before scaling ads.
- 5★ comments → hand-pick into `reviews.html` testimonials (ask permission).
- Poor delivery scores → adjust radius/handlers, not the menu.

---

## 5. Reviews — moderated social proof

**Goal:** a wall of specific, believable testimonials.

- Public submission form on `reviews.html` (name, ⭐, quote, tags).
- Lands **Pending** → admin approves → appears on `reviews.html` + home carousel.
- Seed reviews (`RT_REVIEWS`) give the page life from day one; local ones stack on top.
- Every card shows stars + tags ("Catering", "Birthday cake") so visitors self-select.

**Amplification:** approved reviews become Instagram quote graphics (copy from the admin
queue) — the content loop repeats.

---

## 6. Ask Torte (AI concierge) — 24/7 salesperson

**Goal:** answer the four questions that stall orders: *what do you have, what does it cost,
when are you open, do you deliver?*

- Groq `llama-3.1-8b-instant` with a system prompt carrying the live menu + brand voice.
- **Ladder:** Groq → rule engine (`get_menu`, `get_quote`, `get_hours_areas`, `build_order`)
  → canned reply. Never dead-ends.
- Quick-reply chips for common asks; `build_order()` turns a described cake into a
  pre-filled order link; `describeCake()` renders the Cake Studio prompt; `weekInReview()`
  powers the admin's AI summary.
- Rate limits (2 s gap, 40/session) keep free-tier usage safe.

**KPI:** chats started → order links generated → completed orders.

---

## 7. Content that sells — About, Why, Gallery, Space

- **Story** (one oven → neighbourhood legend) builds emotional buy-in — bakery is a
  trust/heritage category.
- **Why Us** strip answers comparison shopping (24/7, scratch-made, custom designs, Jos-wide
  delivery).
- **How to Order** removes friction doubts (three steps, WhatsApp confirm "within minutes").
- **Designs gallery** = portfolio proof: *what we can make for you* — the custom-cake funnel.
- **Our Space** photos = physical trust: this is a real, hygienic, decorated shop you can
  visit on Temple Road.

All five are **admin-editable** (Content tab) — seasonal promos change without touching code.

---

## 8. Apprenticeship funnel — second revenue line

- Home "Learn with Us" strip + `about.html` programs (Taster ₦15k / Foundations ₦60k /
  Mastery ₦120k) + coming-soon kids camp waitlist.
- Alumni rail ("real students, real kitchens, real businesses") is proof-of-outcome.
- CTA is WhatsApp with the program name pre-filled → you know which surface converted.

---

## 9. Discovery & shareability

- SEO: unique title + description per page, one `h1`, semantic sections.
- **Open Graph/Twitter meta on every page** → shared links render a branded card with a real
  photo (not an SVG) → WhatsApp/Instagram previews look premium.
- `sitemap.xml` + `robots.txt` for crawlers.
- Newsletter capture in the footer (seasonal drops, class announcements).

---

## 10. Measurement plan (static-site edition)

| Signal | Source | Cadence |
|---|---|---|
| Orders/week, AOV | Dashboard stats | Weekly |
| Pipeline hygiene | New → Confirmed time | Daily glance |
| Product demand | Likes + ratings + most-ordered | Weekly |
| Satisfaction | Survey averages | Weekly (act below 4★) |
| Voice of customer | Review/survey comments | Monthly → content |
| Channel health | WhatsApp reply rate | Daily |

Export Content JSON regularly as the backup until Supabase gives cross-device analytics.

---

## 11. What comes next (wired, awaiting credentials)

1. **Groq key** → Ask Torte answers with live menu data instead of the rule engine.
2. **Supabase** → Google sign-in, cross-device sync of every store above, real analytics.
3. **Confirmed prices** → replace estimates in `data.js`.
4. **Real photography** → local photos + admin URL overrides (SVGs stay as fallback).
