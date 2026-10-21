# GraphMyTrade v6 — Buyer Confidence Edition

Only additive changes to the existing immersive v6 page. Original sections, CSS theme, scroll-linked 3D JS, layout and navigation preserved.

## New sections
- `#proof`: real screenshot evidence, what is visibly available, and honest distinction between preview and live API demo.
- `#practical-value`: three realistic trading workflows; avoids performance/ROI guarantees.
- `#compatibility`: broker/data requirements matrix, local-first privacy context, transparent installer/pricing/trial availability.

## Code
- Added `assets/buyer-proof-v6.css`, loaded after existing CSS. No existing CSS/JS modified.
- Updated `index.html` via insertion; existing sections are byte-identical and in the same order.
- Added factual, indexable page section descriptions to `llms.txt` (not a guarantee of AI rankings).

## Release limitation
- No actual functional broker demo, live broker verification, signed installer, price, trial, or customer feedback is invented.
- Public website is not deployed by GitHub commit. Cloudflare Worker deployment is a separate manual task.