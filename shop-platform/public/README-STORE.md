# GraphMyTrade Digital Shop v3 — prelaunch

## Purpose
Real shopping UX rather than marketing landing page. Main app homepage/theme unchanged.
The store is a static shopping shell. Products are intentionally absent until supplied by the owner. Checkout and secured purchase delivery are NOT live.

Routes: `/store/`, `/store/item/?slug=...`, `/store/cart/`, `/store/checkout/`, `/store/library/`.
New assets: `assets/store-v3.css`, `assets/store-v3.js`.

## Catalog
`store/catalog.json`: schemaVersion 3, currency INR, flatPriceInr 99, checkoutEnabled false, products [].
Supported categories: courses, strategies, notion, excel, calculators, guides, checklists, bundles, bots, extensions, software, scripts, indicators.
Supported format identifiers: PDF, XLSX, ZIP, NOTION, HTML, JS, EXE, LINK, COURSE, PINE.
Future validated product object: slug, title, description, category, format, status=published, priceInr=99, optional cover (/assets/...), addedAt, compatibility, includes, license. Do not embed paid source files in public assets.
Cart stores ONLY product slugs in browser localStorage; it is not an order or payment receipt. Client pricing is display-only and must never be trusted for charge calculation. No customer details collected.

## Before activating real sales
1. Create approved merchant payment account and fulfill local legal/tax requirements.
2. Implement Cloudflare Worker service for authoritative product catalog/orders and payment verification (server-side webhook signature, replay protection, idempotency).
3. Use private storage, expiring download tokens, receipts/buyer recovery.
4. Product pages should have crawlable per-slug URLs and true Product structured data ONLY once real purchasable inventory exists.
5. E2E test payment success/fail/refund, entitlement lifecycle, download permissions, mobile and accessibility.

Do not flip checkoutEnabled true in catalog without the secure backend.