# GraphMyTrade Digital Marketplace v2 — prelaunch

Full digital marketplace shell, not PDF-only. Formats: educational course PDFs, strategies, Notion templates, Excel tools, calculators, guides, checklists, ZIP bundles.

- Planned price: INR 99 per item **including bundles** (any change must be explicitly made and clearly shown).
- `store/catalog.json`: schemaVersion 2, currency INR, flatPriceInr 99, checkoutEnabled false, products [].
- Store: `/store/`; reserved paths: `/store/item/`, `/store/cart/`, `/store/checkout/`, `/store/library/`.
- Zero products and zero orders. No stock/ratings/testimonials fabricated.
- No customer login, checkout processing, payment confirmation, file delivery, license entitlement, order system or merchant KYC implemented. All transaction paths visibly disabled.
- All product detail, cart, checkout, download-library skeleton pages have robots noindex,follow.
- No payment credentials, bank/payment data, broker credentials, or customer details are requested.
- Website homepage, theme, 3D motion, download page and legal pages remain unchanged.

## Future sale activation (not built)
1. Merchant onboarding/KYC and approved digital-goods payment gateway; terms, tax and digital-content refunds.
2. Backend orders, server-generated price (never client-supplied), server-confirmed payment + webhook signature/idempotency.
3. Private R2 files, short-lived verified download links, buyer recovery/email, order invoices and limits.
4. Unique static crawlable product SEO pages, images, original helpful copy and Product/Offer JSON-LD only when purchasable.
5. E2E payments/refunds/failed payments and abuse/accessibility/security QA prior to checkoutEnabled.

**Do not flip checkoutEnabled by editing static catalog:** only backend purchase verification can enable sales.