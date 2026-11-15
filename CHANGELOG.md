# Changelog

## v1.1.0 — Pixel-art edition

- Replaced placeholder dungeon rectangles and hero blocks with reusable, authored 32×32 pixel sprites rendered in Canvas 2D.
- Added distinct hero class silhouettes and alternating walking sprites, glowing trap highlights, detailed dungeon masonry, torches, banners, improved gate and relic artwork.
- Added original promotional pixel artwork and logo to the game page and README, distinguished explicitly from real gameplay screenshots.
- Added runtime sprite-cache tests (28 passing in total), browser click/raid smoke checks and new verified gameplay screenshots.
- Kept the deterministic combat and research engine unchanged; example benchmark output is identical to v1.0.0.

# Changelog

## [1.0.0] — 2026-11-14

- 15-wave victory goal and optional endless continuation; rebalanced 18-soul opening.
- Shared deterministic game engine with xorshift32 and safe save validation.
- Four hero roles: raider, scout, guardian and arcanist.
- Four traps: spikes, frost DoT/slow, bolt, venom DoT; three permanent upgrades.
- Canvas hit particles, role-colored heroes, damage floaters, speed/pause and optional synthesized sound.
- Live history graph, research arena, uniform-route baseline, seeded experiments and CSV export.
- JSON save import/export, v0.1 browser-save migration, keyboard-only placement, mobile layout.
- 26 offline unit tests; browser interaction and narrow viewport checks in a harness.
- Original SVG cover/architecture and data-backed, reproducible SVG results chart.

## [0.1.0] — 2026-11-14

- Initial browser pixel dungeon with three lanes, three traps, online route learning, saves, JSON export and unit tests.
