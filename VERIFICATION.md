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

## v2.1 verification notes

- Regression check: `npm run check` validates syntax and runs the test suite.
- Metric tests validate pre-combat missing values, entropy endpoints, exact damage accounting, and route concentration response.
- Research tests validate the descriptive policy difference and explicit unavailability of an interval for one seed.
- README images are displayed one per section at explicit widths, with separate text captions. Avoid side-by-side image tables or markdown image/text combinations.
- The risk overlay displays the learner's estimated damage values and is not ground-truth trap detection.
- Browser and Windows-native testing should be recorded with an environment and date; do not mark those complete solely on the basis of Node tests.