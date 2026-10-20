# Buyer-confidence addon QA — 2026-10-21

This edition starts from the approved GraphMyTrade immersive v6 source and adds evidence-first buyer sections only. The original theme and existing 3D scroll scripts/CSS are not modified.

## Automated Chromium checks
- 320×740, 390×844, 820×1080, 1440×900, 3840×2160: no horizontal page overflow and no page JavaScript errors.
- Existing animated 3D scene remains sequentially active across the original three chapters on desktop.
- Reduced-motion environment disables the original 3D scene transform.
- Actual app screenshot loaded with a native source width of 1910px. This is not a native 4K screenshot.
- Links/assets resolve within the exported archive; 5 JSON-LD entity types parse as JSON.
- All existing section contents are preserved. The only original files altered are `index.html` (additions), `README-UPDATE.txt` (documentation), and `llms.txt` (textual facts).
- Existing pricing panel had a 320px intrinsic width overflow; one tiny-width CSS containment fix was added in the new stylesheet, without altering the original stylesheet.

## Scope and limitations
- Broker compatibility is not independently verified for specific brands or plans.
- Actual trading demo with populated results, signed installer, checkout price, trial, and testimonials have not been created or verified. Website does not imply otherwise.
- Structured data and llms.txt are groundwork for crawlable website content, not proof of indexing or AI search inclusion.
- Commit and ZIP do not update Cloudflare production. Deploy only after reviewing the complete site and confirming release data.