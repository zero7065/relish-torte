# Build Prompt — Reusable Master Prompt for Business Websites

A distilled, copy-paste-ready prompt for commissioning a site of this nature (local service
business + admin dashboard + WhatsApp funnel). Relish Torte was built with this shape of
prompt; swap the bracketed intake for any client.

---

## How to use it

1. Fill the **intake** for your business.
2. Paste everything below (intake + prompt) into a capable coding agent.
3. Iterate in phases; demand the validation table stay green at every checkpoint.

---

## THE PROMPT

```
# Build a complete, deployment-ready website for [BUSINESS NAME]

## Intake
- Business:      [name] — [one-line description]
- Address:       [street, city, state]
- Phone/WhatsApp:[international format, e.g. 2348166899379]
- Instagram:     [@handle]
- Hours:         [e.g. Open 24/7, or a schedule]
- Tagline:       [e.g. "…love at first bite"]
- Offerings:     [list with categories — up to ~20 items, with prices where known]
- Programs/sub-offers: [courses, packages, events — optional]
- Brand marks:   [logo description, primary/secondary colour if known]
- Admin login:   [PIN fallback + allowlisted Google email]

## Hard constraints
1. Pure HTML + CSS + vanilla JS. NO frameworks, NO build step, NO server.
   Every page must open directly from file:// by double-clicking.
2. Responsive, mobile-first. Works offline (Google Fonts fall back to system stacks).
3. Design: ONE shared stylesheet with CSS custom properties for every colour/space/radius;
   supports light AND dark themes with a header toggle (persisted).
4. No emoji — inline SVG icons only. No lorem ipsum; write real copy from the intake.
5. Accessibility: one h1 per page, alt + width + height on every image, aria-labels on icon
   buttons, visible :focus-visible rings, prefers-reduced-motion disables all animation.
6. WhatsApp is the checkout: forms must build a pre-formatted wa.me deep link AND locally
   record the submission for the admin dashboard.
7. Admin dashboard as a normal page with PIN login: stats, item management (edit price,
   toggle live/bestseller), content editing, submission moderation with undo toasts.
8. AI assistant optional: one config file holding the API key/endpoint, with a
   deterministic rule-engine fallback so the site never dead-ends without a key.
9. Everything user-editable persists in localStorage, with Export/Import JSON buttons so
   data can move between devices (true sync deferred to a backend).
10. Deployment-ready: robots.txt, sitemap.xml, Open Graph/Twitter meta on EVERY page,
    netlify.toml, favicon.

## Build phases (run each phase fully, then validate before moving on)
Phase 1  Design system — tokens, typography scale, buttons, cards, nav/footer, themes.
Phase 2  Data layer — all content in one data file; helpers for formatting, storage,
         WhatsApp links, rendering.
Phase 3  Home page — hero, offerings grid, how-it-works, story, social proof, CTA.
Phase 4  Inner pages — full catalog with filters, product detail (deep-linkable), order
         form with builders/validators, about, reviews with moderated submission, contact.
Phase 5  AI concierge — config + chat panel + rule-engine knowledge (menu/quote/hours/order).
Phase 6  Admin — login, dashboard, pipelines, editors, moderation, export/import.
Phase 7  Engagement — likes, star ratings with admin approval, post-order survey,
         carousels/lightbox, scroll reveals.
Phase 8  Polish — compact/denser layout, animated premium buttons, glass surfaces, hover
         effects, dead-code pass, OG images.
Phase 9  Docs + checkpoint — README, architecture, admin guide, strategy doc, build prompt,
         point-in-time snapshot outside the deploy folder.

## Validation (all must pass before you say "done")
- node --check on every JS file
- HTML validator: internal links, assets, inline scripts parse
- Logic smoke tests on the data layer
- No duplicate element IDs per page
- Quality lint: no emoji, one h1, image attributes, consistent nav/script stacks
- CSS/HTML class drift check
- jsdom runtime tests: each page boots without errors; form submissions, admin login,
  edits + undo, AI reply, and engagement interactions all execute

## Deliverables
Working site folder ready to deploy, plus README / architecture / admin guide / strategy /
this prompt, plus a rollback checkpoint. Report each phase's validation results honestly —
list anything NOT done rather than claiming success.
```

---

## Notes for the operator

- **Never claim what isn't verified.** Run the validation suite after every phase; report
  real results (this build reported 57/57 jsdom assertions, not "should pass").
- **Keep the deploy folder pure.** `static/` ships alone; docs, checkpoints and legacy code
  stay outside it.
- **Secrets** live in one config file — API key, OAuth client, allowlisted admin email —
  so enabling features later is a one-line change.
- **Superseded code** from earlier attempts should be kept (for reference) but explicitly
  marked in the README so nobody deploys it by accident.
- **Backend migration path:** all persistence goes through a small set of helpers
  (`load/save/getMenu/getOrders/…`). Swapping localStorage for Supabase later touches one
  file — design that seam from day one.
