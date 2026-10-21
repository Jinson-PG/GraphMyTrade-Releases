# GraphMyTrade Store — FREE-TIER D1-FIRST STAGING (NO R2)

Status: source+tests ready, NOT deployed. No product purchases, no paid downloads, no R2 subscription, no customer orders, no live products.

## Already completed by owner in Cloudflare UI
- D1 database: `graphmytrade-store` (ID shown in Cloudflare `e760f55a-3fd3-4669-a815-8cfe9c571feb`).
- `products`, `shop_categories`, `admin_audit` tables created manually.
- 20 default category rows inserted.

## Next step: add missing indexes (D1 Console, run each as its own command)
```sql
CREATE INDEX IF NOT EXISTS idx_products_status_published ON products(status,published_at);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category,status);
CREATE INDEX IF NOT EXISTS idx_shop_categories_sort ON shop_categories(active,sort_order,name);
```
You can also safely apply `cloud/schema.sql` later using Wrangler because its CREATE TABLE, CREATE INDEX and category seed commands use IF NOT EXISTS / INSERT OR IGNORE. Do not paste the entire SQL script into the D1 Console: it can lose line breaks and treat the rest as a comment. Prefer Wrangler or individual commands.

## Admin access safety — mandatory BEFORE preview deployment
1. Set up Cloudflare Zero Trust Access with an owner-only Self-hosted application for a supported *staging custom hostname*, e.g. `shop-preview.graphmytrade.com`. Do not bind production apex or www yet. Apply the same owner-only Access policy to `/store/admin/*`.
2. Obtain Access team domain (https://YOUR-TEAM.cloudflareaccess.com) and **application AUD** value. Use only your verified owner email in `ADMIN_EMAIL`. No passwords or broker API keys in config.
3. Run the Windows PowerShell steps below on the extracted ZIP in the `cloud` directory. `wrangler.toml` must stay private if it includes personal info; IDs/team URL/AUD are configuration, not bearer secrets. Do not commit it.
4. Check Access support for a custom preview hostname before attempting any deployment. On accounts requiring paid activation, STOP; do not add payment methods without consent.

## PowerShell — after Access setup
```powershell
cd "PATH-TO-UNZIPPED-FOLDER\cloud"
npm install
npx wrangler login
Copy-Item wrangler.toml.example wrangler.toml
# Edit wrangler.toml, verify D1 ID, set ACCESS_TEAM_DOMAIN, ACCESS_AUD and ADMIN_EMAIL.
npm test
npm run deploy:preview
```
`graphmytrade-shop-preview` is a NEW Worker, separate from `sweet-voice-3fdf`. Do not upload the ZIP as static assets. Do not change DNS or apex/www Worker bindings.

## Features you can exercise without R2
- Authenticated owner-only Admin dashboard, D1-backed product/category creation, title and description, ₹1–₹99 pricing, compatibility, inclusion lists, license and SEO snippet suggestions.
- Review/approve drafts without making them public, dynamic category listings and empty public shop.
- No cover uploads, private file uploads, public publishing, buyer checkout or delivery. These actions are safely disabled (or rejected server-side) until R2/private storage and payment infrastructure are available.

## When sales infrastructure is affordable
R2 is billed when the free allowance is exceeded; ensure you explicitly accept billing risk first. Configure R2 private bucket + binding, checkout provider with signature verification, purchase receipts and entitlements, rate limiting, abuse protection and end-to-end purchase tests. Then enable product publishing and purchase/downloads through a separate reviewed release.

**No sales can be collected safely in this D1-only preview.** Storage is not the only missing step: payments and verified entitlements are also unimplemented.