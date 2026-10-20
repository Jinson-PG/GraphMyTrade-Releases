GRAPHMYTRADE PREMIUM SALES WEBSITE — V5 (2026-10-20)
=================================================

WEBSITE TYPE
Static public marketing website for the GraphMyTrade WINDOWS DESKTOP software.
It is NOT the desktop application and it does not accept broker API keys.

VISUAL CHANGES
- Above-fold split hero: short message left, REAL app screenshot right
- Smooth, subtle motion with reduced-motion support
- Responsive desktop / tablet / mobile first impression
- App screenshot-derived logo icon bundled locally (source is the supplied desktop UI screenshot)
- Content and native footer/legal/download/reviews pages preserved

HOW TO UPDATE THE EXISTING CLOUDFLARE WORKER
1) Sign in to https://dash.cloudflare.com
2) Workers & Pages -> sweet-voice-3fdf -> Deployments / New deployment
3) Upload the ZIP containing this site's files (index.html is at archive root)
4) Preview and deploy. Do not create a second project or change DNS as part of this upload.
5) Confirm routes and mobile navigation.

BLOCKERS BEFORE A PUBLIC SOFTWARE SALES LAUNCH
- Fill assets/site-config.js with VERIFIED installer URL and release version.
- Fill EXACT price / license term / checkout URL. Never collect payments before proper policies and working download.
- Provide a verified support email and customer review form.
- Set ga4MeasurementId only after creating a Google Analytics 4 property; users are prompted for consent.
- Connect graphmytrade.com as an actual custom domain, check redirects/SSL, and submit sitemap in Google Search Console.
- Verify all legal/policy copy with the business owner.
- Web pages may be indexed by crawlers; ranking and AI recommendation aren't guaranteed.
- API/broker features must be verified against actual supported connectors, data entitlements, and broker permissions.
- Actual installer binaries are separate from Cloudflare Workers static assets.

SEO FILES
robots.txt; sitemap.xml; llms.txt; OG image; JSON-LD Product/Organization/FAQ; canonicals.
Avoid publishing review/rating structured data before verified ratings exist.

QUALITY CHECK
Offline Chromium visual tests passed for 1440x900, 768x1024 and 390x844.
Verified no horizontal overflow, first-fold product screenshot loaded, logo loaded,
no JavaScript errors in tested viewports, and mobile navigation opens.
