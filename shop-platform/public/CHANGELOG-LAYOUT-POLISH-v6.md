# GraphMyTrade v6 — Layout & Typography Polish

Date: 2026-10-21

## Scope

Visual corrections only. The user-approved original v5 plum/rose palette, cinematic three-step 3D experience, marketing copy, accessibility settings, legal pages, download messaging, and SEO content are intentionally unchanged.

- Removed the unnecessary fixed/minimum hero height that vertically centred the sales copy too low on laptop screens.
- Tightened first-fold vertical rhythm and balanced product preview against copy (1420 x 730: eyebrow moved from ~240px in the supplied screenshot to ~139px; product now starts near 152px).
- Gave the desktop navigation true centred alignment with independently aligned brand and download CTA.
- Improved headline font weight, line-height, letter spacing, and CTA optical alignment while preserving fonts and colors.
- Made CTAs fit on one row at common phone widths such as 390px.
- Made 741–1020px navigation use the already existing mobile menu instead of wrapping links into multiple lines.
- Reduced overly spacious section introductions without changing scroll-driven chapter spacing or animations.

## Files modified

- `index.html`: add one final stylesheet link.
- `assets/layout-polish-v6.css`: isolated additive responsive CSS rules.
- `CHANGELOG-LAYOUT-POLISH-v6.md`: this document.

All earlier CSS/JS, screen images, SEO markup and other site files are unchanged.

## QA

Offline Chromium tests using local inlined source assets (the sandbox disallows `localhost` navigation): viewport widths 320, 390, 820, 1024, 1420, 1440, 3840; horizontal overflow absent and JavaScript page errors absent.

Desktop/tablet three-chapter scroll state tested: 0 → 1 → 2. Mobile uses intentionally reduced/static scene. Existing mobile menus (390/820) and full-image viewer open/close passed. Real external Cloudflare production deployment not performed; final spot-check on production still required.