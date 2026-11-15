# TrapScholar v2.0 verification

Verified in the authoring container:

- `npm run check`: 32 / 32 tests pass; all referenced production modules syntax checked.
- `npm run benchmark`: reproducible seeded experiments successfully generated JSON and CSV.
- `node scripts/plot.mjs`: chart generated from the JSON data fixture.
- `python scripts/browser_smoke.py`: passed with offline Chromium module execution, placed trap on isometric tile, launched a raid, verified pause/resume, produced research CSV, confirmed no horizontal scroll at 390px width, and observed zero browser JavaScript errors.
- Actual screenshots taken from that smoke test: `assets/isometric-build.webp` and `assets/isometric-raid.webp` (WebP compressed PNG source captures).

## Not verified here

- Windows-native PowerShell command execution on a Windows OS.
- Long-session performance on low-power mobile hardware.
- Deployment and browser compatibility on every supported operating system.
- Exact visual parity with the illustrated promotional key art; the playable game has a deliberately lighter procedural-art style.

## Model / runtime

No generative model, GPU-specific runtime or network service is needed to play. The research mode uses online statistical learning, not LLM inference.
