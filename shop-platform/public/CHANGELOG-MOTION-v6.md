# GraphMyTrade — Original v5 theme + motion enhancement (corrected v6)

The user-approved **v5 website design is restored exactly**. No rebranding, no new palette, no page-section redesign. This is a surgical progressive enhancement.

- Preserved v5 `assets/style.css`, `assets/sales-v4.css`, `assets/sales-v5.css` **byte-for-byte**, as well as all v5 typography, wording, imagery, product layout, pricing/download promises, legal pages, and branding.
- Added `assets/motion-v6.css` and `assets/motion-v6.js`: subtle ambient glow breathing, responsive pointer micro-tilt of desktop screenshot, scroll-responsive 3D product perspective and layered floating cards, subtle 3D movement for decorative feature art, gentle feature spotlight hover, staggered reveals (powered by existing v4 intersection observer), unobtrusive top progress marker, small CTA-arrow movement.
- Added optional full screenshot modal; image still opens directly as a fallback with JS disabled.
- Honors `prefers-reduced-motion`; no new dependencies, trackers, or API calls.

## Scroll 3D

- Desktop hover-capable screens: product preview retains the original -4° / +1° pose at the top of the page, transitioning subtly toward an opposing perspective as the visitor scrolls. Floating info cards have opposing depth motion, and feature visual illustrations tilt as the cards pass through the viewport.
- Mobile and touch screens: original v5 layout, smooth lightweight reveals, no pointer-heavy 3D.
- No changes to screenshots (original source is 1910×983, not native 4K), no external JS or 3D libraries.
- All 3D effects are compositor transforms with passive, requestAnimationFrame-throttled events; reduced-motion setting turns them off.

## Deployment

Upload the **corrected** `GraphMyTrade-v6-Original-Theme-Motion.zip` to the **existing** Cloudflare Worker `sweet-voice-3fdf`. Do NOT use the earlier v6 ZIP. This repo branch does not automatically deploy the site.

## Verified scope

HTML is unchanged except 2 asset imports + the lightweight preview viewer/progress enhancements. Other v5 pages/assets are unchanged. The application release code and v5-locked branch are untouched.