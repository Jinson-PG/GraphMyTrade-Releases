# GraphMyTrade Digital Store — prelaunch v1

## Status
The storefront is real and navigable at `/store/`. No PDFs or products are published. `store/catalog.json` has an empty product list. No payment, order fulfillment, email capture or download entitlement endpoints exist.

## Product catalog configuration
Products are NOT published by adding PDFs into public site assets. First implement a secure payments-and-delivery backend with server-side verification, private files and expiring download access. Only then add products to the catalog.

The catalog format is `{ "schemaVersion": 1, "products": [] }`. Future records may include `slug`, `title`, `category` (guides/workbooks/checklists/templates), `description`, `format` (PDF/XLSX/ZIP), `priceInr` (0–99.99; final price policy to confirm), `cover` (trusted local public image URL), `addedAt` (ISO date), and `status` (draft/published). The UI ignores draft items.

An item page template exists at `/store/item/?slug=...` but is explicitly `noindex` and never offers purchase until payment integration is completed. Do not use this skeleton as the final SEO canonical for paid product pages: generate unique crawlable static detail routes and Product schema once actual products are available.

## Security requirements before any live sales
- Private PDF objects (not accessible in `/assets/`); signed short-lived downloads
- Server-side Razorpay order creation, verification, webhook signature checks and idempotency
- Never trust price or payment status passed by client
- Publisher merchant KYC, tax/GST and digital-goods/refund policy compliance
- Clear support and refund procedures; accessibility and real purchase E2E QA

## Deployment
Upload the full ZIP to the existing Cloudflare Worker static assets deployment. Existing website styles/scripts unchanged. The homepage and secondary navigation simply link to `/store/`.