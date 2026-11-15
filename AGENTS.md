# Agent instructions — TrapScholar

Read README.md, LOCAL_AGENT_HANDOFF.md and docs/ISOMETRIC_DESIGN.md first. Make the smallest working change that improves the real, playable game. Do not rebuild from scratch.

## Architecture rules

- `src/brain.js` and `src/engine.js` are pure simulation modules and **must remain deterministic**.
- `src/isometric.js` contains the canonical math for both rendering and pointer picking; never duplicate transform constants.
- `src/isometric-renderer.js` owns hand-authored visual rendering. Decorative art never changes the game's buildable coordinates.
- `src/game.js` glues UI, simulation and isometric graphics together.
- No cloud APIs, model downloads, secret keys or runtime build tools.
- Preserve save compatibility and both the regular and research gameplay paths.

## Validation

Run `npm run check`, optionally `python scripts/browser_smoke.py` if Chromium+Playwright exist, and verify campaign, save import, laboratory, mobile width. Update screenshots after real graphical changes. Keep promotional concept art clearly distinguished from gameplay captures. Add tests when touching logic.
