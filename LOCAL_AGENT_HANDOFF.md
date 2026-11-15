# TrapScholar v1.0 — continuation handoff for your local coding LLM

## Current state

A complete, working, model-free, browser-playable pixel game with source at `index.html`, `style.css`, and `src/*.js`. It contains: 15-wave victory with endless continuation, 4 traps, 4 hero classes, 3 upgrades, adaptive route learner, Web Audio opt-in, battle particles, responsive UI, per-wave graph, save/import, and reproducible policy comparison. Existing code is not a scaffold.

## Verified in the creation environment

- `npm test`: 26 passing unit tests (Node 22).
- `npm run benchmark` followed by `node scripts/plot.mjs`: generated valid CSV/JSON and SVG sample results.
- Chromium inline-module harness: trap placement, spending, pause/resume, wave completion, probability-chart update, seeded lab run, CSV download, JSON import, reset — **no page errors**.
- 390 px simulated mobile viewport: no horizontal overflow.
- The environment blocked direct localhost navigation by admin policy. Native Windows 11 / Edge static-server verification is not yet complete.

## IMPORTANT: Do not redo finished work

Read the README, then inspect these files in this order: `src/brain.js`, `src/engine.js`, `src/research.js`, `tests/`, `src/game.js`. Start by running tests, not by rewriting. Existing icons, cover, screenshots and experiment chart are already committed in source files. No GPU or inference server is needed.

## Your first milestone — native Windows verification

1. On Windows 11, extract the archive to a chosen project directory (for example `F:\AI\trapscholar`).
2. In modern PowerShell: `npm test`, `npm run benchmark`, `node scripts/plot.mjs`.
3. Start `./scripts/start.ps1` and open `http://127.0.0.1:8080` in Microsoft Edge or Chrome.
4. Test placement on all three paths, sound on/off, pause/resume, three waves, reset, keyboard-only placement, save export/import and mobile responsive mode.
5. Confirm screenshot visuals match real gameplay and review the browser Console for errors. Fix only verified defects. **Do not delete user files.**

## Future milestones, in order

A. **v1.1 polish:** Add animated victory screen, additional role-specific animations, tutorial overlay, better in-game tooltips and localized accessibility announcements. Preserve low resource requirements.

B. **v1.2 tactical expansion:** Introduce one new tactical choice that visibly responds to player traps (e.g., one-use scout signal or counter-trap potion). Keep the route learner non-omniscient. Expose this in the UI and test it.

C. **v1.3 reproducibility:** Expand fixed scenario into a seeded layout suite with parameter sweep, multi-seed stats and uncertainty, matched exogenous randomness and written interpretation. Don't overstate significance.

D. **Optional local AI dialogue:** Connect localhost OpenAI-compatible endpoint only for optional safe flavor dialogue, not combat. Feature must be OFF by default, cached and cancellable. Never inject untrusted model text via innerHTML.

E. **Publish only with approval:** If user requests, upload to a new GitHub repo; enable GitHub Pages; add release notes and screenshots. Never push without user's request.

## Constraints and conventions

- Maintain plain HTML/CSS/JavaScript with **no runtime dependencies**, offline static serving and MIT licensing.
- Keep the campaign live stepper and experiment arena using the same `src/engine.js` combat rules; any intentionally different experiment condition (currently ward restoration) must be documented and unit-tested.
- Keep user-visible conclusions based on real data. `data/example-experiment.json` contains real deterministic synthetic game outcomes, **not** real-world AI performance.
- Preserve save version 2 and migrate it explicitly if schema changes; old browser saves should remain untouched.
- No copied sprites or unlicensed commercial assets. Avoid long context dumps and large downloads.

## v1.1 continuation note

The v1.1 pixel-art overhaul adds `src/pixel-art.js` (self-contained Canvas 2D art generation), replaces core canvas rendering and adds `tests/pixel-art.test.mjs`. The browser header now references `assets/key-art.webp` and the README references `assets/logo.webp`. These are promotional images, NOT game sprites. The actual sprites are 32×32 procedural cached canvases with zero runtime image fetches. Do not replace them with isometric cover art unless you deliberately rework the game's board geometry and hit testing. Preserve `src/brain.js`, `src/engine.js`, and `src/research.js` invariants. Run `npm run check` before every commit.
