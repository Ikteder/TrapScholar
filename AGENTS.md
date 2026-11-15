# Agent guidance for TrapScholar

You are continuing a functioning game, NOT starting a rewrite. First read README.md, LOCAL_AGENT_HANDOFF.md, src/engine.js, src/brain.js, and src/research.js.

- User runs Windows 11 and prefers lightweight, local tooling and minimal context usage.
- Preserve model-free play, MIT license, accessible UI and no runtime dependencies.
- All combat changes belong in src/engine.js so browser gameplay and research share rules. Unit test every combat bug fix.
- Never claim an algorithm is state of the art because the README has polished visuals. The AI is an inspectable risk-aware bandit heuristic.
- Run `npm test`, `npm run benchmark` and `node scripts/plot.mjs` after simulation changes.
- Screenshot using an actual browser after UI changes; don't invent screenshots.
- Do not publish to any GitHub repository, install large models, or remove user saves without permission.
- Keep secrets and large temporary artifacts out of commits. Follow the milestones in LOCAL_AGENT_HANDOFF.md.

## Pixel graphics (v1.1)

Keep the browser-only `src/pixel-art.js` rendering system separate from the pure AI engine. It must not introduce remote requests, installable libraries, or non-determinism in `src/brain.js`, `src/engine.js` or `src/research.js`. Promotional assets in `assets/key-art.webp` and `assets/logo.webp` are not gameplay sprites; the game remains top-down and uses cached 32x32 Canvas pixel sprites. `npm run check` must pass.
