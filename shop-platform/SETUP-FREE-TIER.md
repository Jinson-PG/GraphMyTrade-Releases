# GraphMyTrade — secure Cloudflare Store Manager (preview package)

## What is implemented
- A real **D1-backed** product catalog. Prices default to ₹99 and can be edited to ₹1–₹99.
- A Cloudflare Access-verified seller dashboard at `/store/admin/`.
- Product title, description, any owner-created category, format, URL slug, compatibility, usage-license, inclusions, SEO title/description/keyword suggestions. Default categories include jobs, education, small businesses, budgets, planners and design assets as well as trading and software tools.
- Cover upload/replace (PNG/JPEG/WebP, max 3 MB) and private R2 product upload/replace (supported PDF, ZIP, XLSX etc., max 24 MB).
- Draft -> Submit for Review -> Approve -> Publish; reject/unpublish; editing live products requires explicit unpublish.
- Server-rendered crawlable `/store/p/<slug>/` pages, canonical/meta/OG/structured data and dynamic sitemap.
- Full original GraphMyTrade website assets are bundled. Homepage/theme and scroll animations unchanged.
- Empty catalog: no fake products, purchases, order records, ratings or reviews. **No payment or paid download route exists**.

## SECURITY: read before deploying
1. **Do not upload this entire development ZIP using Cloudflare's static 'New deployment / Upload assets' UI.** That would upload source/admin files publicly, with no dynamic security. Use Wrangler for the Worker (see below).
2. Deploy a **new preview Worker** first (`graphmytrade-shop-preview`), not your live `sweet-voice-3fdf`. Your current website must remain untouched.
3. Cloudflare Access owner protection is mandatory. Until Access is correctly configured, all `/store/admin/*` requests fail closed with 403.
4. Protect `/store/admin/*` with a Cloudflare Zero Trust Access Self-hosted application, allowing only your owner email. Copy team domain + audience (AUD) into `cloud/wrangler.toml`. The Worker also verifies RS256 JWT signature, issuer, audience and exact owner email. The HTML + CSS + JS all go through the check.
5. D1 and R2 must be created in your own Cloudflare account; they are **not** created or connected by this ZIP. R2 should remain PRIVATE (no public bucket domain / r2.dev exposure).
6. Do not switch production domains, DNS or Worker bindings until preview login, uploads, approvals, SEO pages and private file access have all been tested.

## Windows PowerShell setup (after Cloudflare Zero Trust and R2 activation)
From the unzipped folder:

```powershell
cd .\cloud
npm install
npx wrangler login
npx wrangler d1 create graphmytrade-store
npx wrangler r2 bucket create graphmytrade-store-private
Copy-Item .\wrangler.toml.example .\wrangler.toml
```

Open `wrangler.toml`, replace D1 database ID with the ID printed above; enter Access team domain, Access AUD, **owner-only** verified email. Do NOT put broker tokens or passwords in this file. Then:

```powershell
npx wrangler d1 execute graphmytrade-store --remote --file=./schema.sql
npm test
npm run deploy:preview
```

The preview will have a fresh empty D1 database. Publishing is disabled until you explicitly create/approve products. Cloudflare Access app/policy must protect owner admin requests and be attached to the correct protected hostname/path; preview `.workers.dev` alone might not support the chosen Access hostname/policy, so use an Access-supported dedicated **staging custom domain** and verify it first. Do not change your existing apex/www bindings until ready.

## What is NOT completed
- Cannot claim the Worker is deployed or linked to your Cloudflare account from this ZIP; that needs account setup, binding IDs and Access config.
- **Payment gateway, verified orders, downloads after payment, customer order history and email receipts are not implemented.** A public listing is an approved preview, not a purchasable product. Never turn checkout on without server-side payment verification and private entitlements.
- The Admin SEO button uses optional Cloudflare Workers AI with 10,000 free neurons per day, when the AI binding is enabled. If unavailable or the free quota is exceeded, suggestions fall back to transparent rule-based text; check mode on the screen. AI only sees product title, description, category and format, never customer trades, secret keys or uploaded PDF contents.
- Browser + unit tests here are not equivalent to Cloudflare staging/integration QA.
- Large video/EXE files above 24 MB need a multipart uploader workflow; version 1 uses 24 MB for safer Workers Free operation.
- Free allowances have limits; Zero Trust Free can require a payment method at setup; R2 billing activation may be required; actual payment processing incurs gateway fees.

## Product safety
- Use only files you own or have permission to sell. Telegram bots/extensions require respective platforms' rules, software license terms and support instructions.
- Admin files are protected by JWT; never distribute Cloudflare Access config secrets or merchant API keys. R2 asset binding needs no public R2 API secret.
- Uploaded files are never served to the public until a secure paid-download entitlement system is separately implemented.

## Branch and safe rollout
The only repository to update is **Jinson-PG/GraphMyTrade-Releases**, website branch **website-v6-premium**. Desktop source repository and release `main` are NOT touched. Development site sources are kept under `shop-platform/` in GitHub. Do NOT publish or serve any project root containing the `cloud` source directly as static assets.

The store is a general-purpose digital shop, not only a trading store. Admin can create categories (English URL slug auto-generated from category name), set each price from ₹1 to ₹99, upload a 3 MB cover, upload a 24 MB digital file, edit SEO, submit for review, explicitly approve and publish. The first real product requires the owner's separate approval. Current catalog is empty.

**Current limitations:** Digital services and external access-based products need a fulfilled order workflow; for now each approved listing needs a private file (for example, an authorized setup/instruction package). There are no paid orders or customer downloads yet. R2 Free may require billing activation. Cloudflare Access should be tested on an Access-supported staging hostname before switching the domain.