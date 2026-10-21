# GraphMyTrade 99 Shop — Google SEO and AI Search Readiness

Status: preview code only. No customer purchases until owner activates Instamojo and verifies real payment plus delivery. Owner must explicitly approve every individual product before publication. This file does NOT activate products or Google indexing.

## What is implemented

- Public catalog is a read-only Google Sheets CSV, limited to approved `published` rows. No private download file links or customer data.
- Each approved product receives `/store/p/{slug}/` with a real server-rendered HTML document (title, description, format, contents, compatibility, license, ₹ price and buyer information).
- Shop landing page also server-renders genuine approved product cards and internal HTML links, without requiring JavaScript. No example products are used.
- Individual product `Product` schema and `BreadcrumbList`; collection `ItemList` only when actual approved products exist. No invented star ratings, orders, testimonials, reviews or sales.
- Canonical URLs reference `https://graphmytrade.com`; sitemap includes approved product URLs; production robots policy permits crawling.
- Separate `workers.dev` preview is `noindex`, enforced by a response header. Do not make the staging site indexable.
- Checkout links are withheld until `PAYMENT_DELIVERY_VERIFIED="true"`. Keep false until owner verifies merchant KYC, a genuine test purchase and automatic buyer email/download.
- Mobile-friendly content, reduced-motion option, no extra paid SEO API, no paid font or image library.

## SEO metadata per product — human approval is mandatory

Review each field before changing `status` to `published`:

1. **Title**: exact digital deliverable and intended audience (avoid "best", "#1", "guaranteed" unless demonstrably true). Example for a hypothetical product: `Kerala Job Application Planner — Excel Sheet | GraphMyTrade`. This is a naming example, not a listing.
2. **SEO description**: natural summary (roughly 100–160 characters when practical) stating what the file does, contents and format. No repeated search phrases.
3. **Product description**: useful original explanation: who needs it, exactly what is included, device/app requirements, what is NOT included, any limitations.
4. **Product cover**: real preview image/cover, avoid fake screenshots or AI-invented interface claims. Alt text is derived from genuine title.
5. **Includes**: real files/features separated by `|`. **Compatibility** and **license**: complete and accurate.
6. **Keywords**: research terms customers genuinely use (English, Manglish, or Malayalam only where content supports that language); avoid mechanically repeating tags.
7. **Checkout URL/price**: link to the correct approved Instamojo Digital File product; displayed price must equal checkout, all charges clearly reviewed.
8. **Slug**: descriptive, lowercase and permanent once published (changing it changes the indexed URL).

Free AI-assisted editorial workflow: ask ChatGPT to propose 3 SEO title and meta-description options from the REAL product specification, then review and choose. **No text is automatically published.** This is content review, not a third-party paid AI SEO service.

Example prompt to use for EACH approved product:

> Using only the following verified product details, suggest 3 natural SEO titles (about 45–65 characters) and 3 meta descriptions (about 110–160 characters), plus a clear factual "who it is for", included files, compatibility and limitations. Do not invent features, testimonials, guaranteed outcomes, discounts, rating, reviews or sales. Product name: [actual name]. Features: [verified details]. File format: [verified]. Audience: [verified]. Price: [actual]. License: [actual]. Search intent: [genuine buyer need].

## Production launch validation — owner-approved only

1. Keep `sweet-voice-3fdf` unchanged until owner explicitly approves domain migration. Do not run production redeploy automatically.
2. Clear Instamojo sample clothing products, complete KYC, check fee/price rounding, verify one controlled purchase and automatic download/email, and review refund policy.
3. After owner approval, set a separate secure production configuration to `PAYMENT_DELIVERY_VERIFIED="true"`; do not change this staging flag merely to display draft products.
4. Inspect homepage, product pages, `robots.txt`, `sitemap.xml`, HTTP `X-Robots-Tag`, desktop/mobile layout, and all links on the ACTUAL production domain.
5. Set up/verify `graphmytrade.com` in **Google Search Console**, submit `https://graphmytrade.com/sitemap.xml`, inspect a real product URL, test with Rich Results Test and PageSpeed Insights. Search Console ownership, indexing and visibility cannot be confirmed by code commits.
6. Recheck indexed product content/price when items change; remove discontinued products from the public Sheet and sitemap. Plan redirects for renamed URLs where appropriate.
7. Track impressions, clicks, query relevance and conversions. Revise useful content where data and users justify it, not to spam.

## AI search / AEO facts

Google's own documentation states **no extra AI schema, AI text file or special optimization is required** for AI Overviews/AI Mode. Good SEO, indexability, original factual text and consistent product data are the foundation. No provider guarantees appearance, recommendation, first-page ranking or positive sentiment in AI responses. Do not publish deceptive content designed to manipulate ChatGPT, Gemini, Perplexity or Google.

References:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/appearance/structured-data/product
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
