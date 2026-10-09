# Admin Guide — Relish Torte Dashboard

Open **`static/admin.html`** in a browser. Everything below happens client-side; there is no
server to run.

---

## 1. Logging in

| Method | When it works |
|---|---|
| **PIN `2407`** | Anywhere, including `file://` — the default |
| **Google sign-in** | On the deployed HTTPS site with your allowlisted Gmail configured |

The session lasts until you close the tab (`sessionStorage`). Click **Log out** to end it early.

> **Set up Google login:** put your Gmail in `static/js/config.js` → `ADMIN_GOOGLE_EMAIL`, then
> add the Supabase/Google OAuth credentials when that phase goes live. Until then, use the PIN.

---

## 2. The four tabs

### Dashboard
- **Greeting** with today's date and a live status (open 24/7, always).
- **Stat cards** — orders this month, revenue, average order value — each with a trend arrow
  vs. the previous month.
- **30-day chart** — orders per day (Chart.js when online; hand-drawn canvas fallback offline).
- **Ask Torte week-in-review** — one-click AI summary of the week's activity.
- **Most ordered** — top items by quantity.
- **Order pipeline** — every order as a card with a status pill:
  `New → Confirmed → Baking → Done`. Click a card to open the side sheet:
  - full item breakdown + total + customer details
  - change status inline
  - **WhatsApp reply** button → opens a chat with a pre-written confirmation for that order
  - copy order reference (`RT-XXXX`)
- **Customer feedback** — post-order survey responses (stars, taste/packaging/delivery,
  comments) with an overall average.
- **Ratings queue** — product star ratings waiting for approval; approve to publish the
  average on the menu, hide to discard (undo toast).

### Menu
- Every item with photo, category, price and status.
- **Edit price** — click the price, type, Enter to save; an **Undo** toast appears for a few
  seconds.
- **Live / Bestseller** switches — take an item off the menu or feature it instantly.
- **Image** — open the image manager (see §3).
- Changes save to `rt_menu_overrides` and appear on the site immediately.

### Reviews
- Submitted reviews queue here first with status **Pending**.
- **Approve** publishes to `reviews.html` and the home carousel; **Reject** removes it;
  **Hide** takes a published one down. Every action has an **Undo** toast.

### Content
- **About** — story headline, paragraphs, founded line, brand promise (saves → `about.html`).
- **Why Us / How to Order** — edit the bullet lists that feed the home page strips.
- **Gallery (designs portfolio)** — add/edit/remove: title, caption, image, order.
- **Our Space (shop & décor photos)** — same CRUD; these fill the About page photo grid.
- **Hero slides** — add/reorder photo slides for the home hero carousel.
- **Export / Import** — download `relish-content-YYYY-MM-DD.json` or upload one to merge
  content into another browser (this is how edits travel between devices until Supabase sync).

---

## 3. Image manager (preview → Apply)

Used by Menu images, Gallery, Space and Hero slides.

1. Click **Change image** on any item.
2. Provide the image either way you like:
   - **Paste a URL** (stock photo, your CDN, anything HTTPS), or
   - **Upload a file** (it is resized to 1400 px and compressed to JPEG in the browser).
3. A **live preview** appears — the image exactly as the site will show it.
4. **Apply** to commit, **Cancel** to discard — nothing changes until you Apply.

> Uploaded images are stored in the browser (`rt_image_overrides`) and counted against the
> ~5 MB localStorage budget; the panel warns you before it gets full. For permanent,
> cross-device images, host the file and paste its URL instead.

---

## 4. What customers do (and what you'll see)

| Customer action | Lands in |
|---|---|
| Submits the order form | **Dashboard → Order pipeline** (New) *and* their WhatsApp |
| Sends a WhatsApp message | Your WhatsApp directly (24/7 number) |
| Submits a review | **Reviews tab** (Pending) |
| ★-rates a product | **Ratings queue** (Dashboard) |
| Completes post-order survey | **Customer feedback** (Dashboard) |
| ❤ likes a product | No action needed — likes show immediately |
| Edits prices/images/content | Not customer-reachable — admin only |
| Newsletter sign-up | `rt_newsletter` (export via Content → Export) |

---

## 5. Safety notes

- **Storage is per-browser.** Approving a review on your laptop won't show it on your phone.
  Use **Export / Import** to move data, or wait for Supabase sync (planned).
- **PIN login** means anyone with the file and the PIN can edit — keep the deployed admin URL
  private.
- All admin actions have **Undo toasts** — misclicks are recoverable.
- Back up with **Export** before bulk edits.

---

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Login rejected | PIN is `2407` (check `data.js` → `RT_ADMIN_PIN`) |
| Chart looks blank | Offline — the canvas fallback should draw; refresh |
| Uploaded image not saving | Browser storage full — delete old uploads or use URLs |
| Edits vanished | Storage cleared or private-browsing — Export regularly |
| Site looks broken after edit | Admin has Undo on every action; otherwise re-import backup |
