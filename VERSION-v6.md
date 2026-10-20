# GraphMyTrade Premium Sales Website — v6

**Design status:** v6 redesigned source, ready for visual acceptance and Cloudflare static-assets deployment.
**Scope:** Public-facing sales website only. Does not modify the desktop app or broker integrations.
**Upgrade from:** Approved v5 (`website-v5-locked`). V5 archive remains unchanged.

## Improvements
- Product-first redesign with significantly larger actual desktop interface in a clean framed hero and immersive product section.
- Premium precision-light palette, strong readable typography, polished dark plum sections, restrained ambient gradients and floating micro-details.
- Smooth optional scroll reveals, subtle cursor-responsive hero perspective, soft card/CTA hover and reading-progress cue. Respects OS reduced-motion preference; essential content visible without JavaScript.
- Full-size real app preview dialog with keyboard Escape, native focus handling and close controls.
- Clear feature descriptions for user-supplied compatible APIs, research, journal, analytics and supported history; explicit boundaries where API permissions differ.
- Mobile navigation and responsive styles for compact screens, tablets, large desktops and wide monitors.
- SEO title/description/structured FAQ/SoftwareApplication schema; preserves canonical, og and sitemap, robots, Hostinger mail DNS unaffected.
- No invented customer reviews, no fictional prices, no false claims about universal broker support or automatic kill-switch availability.
- No external fonts, libraries, tracking requests or stock photography in the homepage.

## Release gates
- Production Windows installer URL not configured (`assets/site-config.js`) — the release page must not imply an actual download exists.
- Pricing, checkout URL, review URL, and analytics remain unconfigured until verified.
- Image source is the original genuine 1910 × 983 app screenshot. Enlarged viewing improves visibility but **is not a newly captured native-4K app screenshot**. Replace the file when a verified native-resolution capture is available.
- Website **does not deploy itself**. To publish upload the site files to Cloudflare Worker `sweet-voice-3fdf` static assets or your Cloudflare project. Verify apex and www on Airtel and other networks. Domain DNS incident should be resolved separately.
- This archived v6 package includes existing v5 secondary pages and legal text unchanged.

## Quick smoke-test checklist
1. Check `/` at desktop (1440px), wide monitor (2560px), tablet (768px), mobile (390px/320px).
2. Click nav links, FAQ disclosures, both preview buttons, modal close/Escape and mobile menu.
3. Check `/download/`, `/privacy/`, `/terms/`, `/refund-policy/`, `/risk-disclosure/` and 404.
4. Verify reduced-motion OS setting, keyboard focus visibility, real image and no horizontal overflow.
5. Verify installer/price/checkout/review are not misrepresented as live.