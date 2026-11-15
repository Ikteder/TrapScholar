# Contributing to TrapScholar

Thanks for contributing! Keep the game fun and the AI understandable.

## Development workflow

1. Run `npm test` before and after changes. Node 20+ is sufficient; npm install is unnecessary.
2. Launch `python -m http.server 8080` and test in a real browser.
3. Prefer short, reviewable changes. Add a deterministic unit test for each new trap, hero resistance or route policy.
4. Record every new benchmark parameter: map, seed, horizon, sample count and ward-reset policy.
5. Regenerate sample data and figures (`npm run benchmark && node scripts/plot.mjs`) whenever experimental rules change.
6. Do not introduce trackers, keys, hosted models, unsigned executable dependencies, or copyrighted assets.

## Architecture boundaries

- `src/brain.js`: route policy; only observed outcomes; no omniscient map reads.
- `src/engine.js`: game rules shared across UI and research; deterministic for a seed.
- `src/research.js`: explicit experiments; document differences from campaign rules.
- `src/game.js`: browser UI, drawing and input; do not duplicate combat logic.

## Pull requests

Include motivation, changed game mechanic, test results, screenshots if the UI changed, and any expected balance impact. Never commit exported personal saves or secret tokens. All third-party artwork must include license and attribution and be redistributable under compatible terms.
