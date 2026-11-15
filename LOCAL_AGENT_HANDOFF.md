# TrapScholar v2 — local coding-agent handoff

## State of the project

Playable v2.0 isometric pixel edition is implemented. Start from THIS source, not a blank Godot / Unity project. The game renders a raised three-route stone dungeon in Canvas 2D; trap placement, hero raids, campaign, save/import, AI learning and seeded laboratory remain operational. Do not confuse concept illustrations with actual runtime graphics.

## Starting on Windows

```powershell
cd F:\AI\TrapScholar
.\scripts\start.ps1
# Browser http://127.0.0.1:8080
# Another PowerShell terminal:
npm test
```

Node >=20 and Python >=3 are enough. If the repository has been cloned previously, update it with git pull or extract the latest release archive before starting. Save import/export format remains compatible with v1.x.

## Things already finished

- `src/isometric.js`: mathematically invertible projection and collision-safe diamond selection.
- `src/isometric-renderer.js`: environment, stone cliffs, torches, banners, original sprites, traps, relic, visual hit effects.
- `src/game.js`: wired all old gameplay and screen effects to the isometric world.
- `tests/isometric.test.mjs`: projection, view picking and engine rules.
- `scripts/browser_smoke.py`: optional browser interaction smoke testing (needs Playwright + Chromium).
- Original pixel assets and README art; promotional cover distinct from gameplay screenshot.
- Existing `brain.js`, `engine.js`, `research.js`, data fixtures and GitHub CI remain the source of truth.

## Required continuation order

1. **Verify local Windows functionality before editing.** Run scripts/start.ps1, place a trap on a purple socket, launch a wave, confirm UI, research lab, save, pause and audio. Run `npm run check`.
2. **Improve visual consistency without changing combat rules.** Create coherent isometric tile/sprite sheets with original licensed art. Implement 4-direction hero sprites, damage/death animation, richer trap animation. Keep readability at mobile scale and use offscreen sprite caches.
3. **Polish controls and scene readability.** Hover tooltips, tile affordance, focus navigation, attack effects, camera zoom option; do not let decorative platforms become clickable build slots.
4. **Extend gameplay only after tests pass.** Boss encounters, more maps, varied wave behavior and 2.5D dungeon editor are reasonable next steps.
5. **Benchmark changes.** Preserve 32 existing tests and deterministic experiment fixtures; add tests for any gameplay change. Never present illustrative chart numbers as measured ML results.

## Constraints

- Offline-first; no cloud LLM or paid APIs required. The user's desktop can run a local LLM, but it should not be mandatory for this game.
- Make small commits; avoid rewriting the working simulation. Prefer Python/Node tooling already available.
- Validate Windows PowerShell, not only Linux shells. Avoid removing user save data or changing save key semantics.
- Track original artwork provenance in `docs/ISOMETRIC_DESIGN.md` and maintain an honest README showing actual gameplay, not just promotional artwork.
- Main goal: approach the polished isometric pixel illustration in visual style while keeping a genuinely playable strategy game.

## Next review checkpoint

Deliver a screenshot and a short test report after improving one hero spritesheet and one complete tile family; compare the screenshot against `assets/isometric-raid.webp`. Do not claim an image-generation output is playable until it is connected to controls and interactions.

## v2.1 continuation state

- New `src/metrics.js` provides pure read-only campaign telemetry; do not change saved-state schema for it.
- `RISK OVERLAY` is optional and visualizes risk estimates from the online learner.
- Research comparison now includes `difference` with a descriptive seed-level interval. It is **not** a paired causal estimate because random streams diverge across policies.
- Keep README image sections one-column; always label concept artwork separately from real game captures.
- Do not claim web/Windows/GitHub verification before actually testing those environments.