GraphMyTrade Premium Sales Website — v6 Immersive Scroll Edition
2026-10-21

WHAT CHANGED
- Original approved v5 design: same base style.css, sales-v4.css, sales-v5.css, colors and type.
- New large scroll-pinned product experience (#experience), cinematic 3D perspective and three readable selling chapters.
- New honest manual-first vs broker-API purchase explainer.
- Improved structured data, social meta tags, sitemap home lastmod and llms.txt.
- Reduced-motion support and a mobile/low-motion non-sticky fallback.
- Download/legal/support configuration remains unchanged; no fake ratings/prices/API claims.

DEPLOY
Cloudflare dashboard > Workers & Pages > existing sweet-voice-3fdf > Deployments > New deployment.
Upload THIS ZIP as static assets. Do not create a new Worker and do not change Cloudflare DNS, domain nameservers or Hostinger email records.
Test the workers.dev URL and your custom domain after deployment. The live site will NOT change until you deploy.

NOTE
The screenshot is an actual existing app preview (1910 x 983); the website supports a 4K browser layout but does not contain native-4K app-capture pixels.
Current installer, verified pricing/checkout and review URLs are intentionally blank in assets/site-config.js; publish only after real release details are verified.
Motion is CSS/vanilla JS; no CDN, paid service or browser permission is required.
SEO is structurally prepared; Google indexing and ranking require crawling after live deployment and are not guaranteed.

GITHUB
The website-only branch is website-v6-premium of Jinson-PG/GraphMyTrade-Releases.
The approved v5 snapshot remains in website-v5-locked. Desktop app code is unaffected.