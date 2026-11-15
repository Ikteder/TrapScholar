# Release verification — TrapScholar 1.0.0

## Automated verification (November 14–15, 2026)

| Verification | Evidence | Result |
|---|---|---|
| Node 22 suite | `npm test` | **26 passed** |
| JavaScript parse check | `npm run check` | Passed |
| Reproducible research data | `npm run benchmark` | 40 seed pairs / 12 waves regenerated |
| Reproducible SVG | `node scripts/plot.mjs` | SVG generated from JSON |
| SVG asset validity | XML parser validated all `.svg` assets | Passed |
| Desktop Chromium harness | Place traps, spend, pause, complete wave, update plot, lab, export CSV, import JSON, reset | Passed |
| Victory + endless Chromium harness | Imported a seeded wave-15 defense, completed all five heroes, achieved victory, clicked **Continue Endless** | Passed, no page errors |
| Mobile Chromium harness | 390px layout, no horizontal overflow, control visibility | Passed |
| Page script errors in harness | Chromium `pageerror` listener | None observed |
| Campaign difficulty smoke check | Simple fixed bolt-defense strategy, 100 seeded trials | 77/100 reached beyond wave 15; **not** universal difficulty estimate |
| Direct Windows/Edge play | Needs user machine | **Not yet tested** |

## How browser testing worked

The isolated environment blocked direct localhost page navigation, so a Playwright/Chromium harness inlined the local modules and stylesheet into an HTML document, then exercised the UI. This verifies layout and interactions but is not a substitute for opening the actual static file server on the user's Windows PC. No remote AI model, network service or third-party code was used.

## Sample data provenance

`data/example-experiment.json` and `.csv` were generated from the included Node.js program with `seed=2026`, `seeds=40`, `rounds=12`; the figure `assets/results-chart.svg` is generated directly from the JSON using `scripts/plot.mjs`. Conditions: static asymmetric map, uniform baseline vs three-arm bandit heuristic, restored ward per experimental hero, 42 attempts per 12-wave run. This should not be interpreted as scientific proof of superiority.

## Remaining limitations

- Game balance is subject to real user testing. The simulated 100-run strategy is not an optimal human strategy or a fully representative benchmark.
- Mobile simulated touch layout fits 390px, but complex touch interactions on a physical phone have not been verified.
- Direct localStorage persistence was not exercised through a real host origin in the current browser harness; static-host validation remains.
- Browser screen-reader accessibility audit and user experience testing are future work.

## v1.1 graphics upgrade verification

- `npm run check`: 28/28 tests pass, including two new sprite cache tests.
- In this environment browser navigation is blocked by the browser administrator; instead Chromium was exercised with the exact original HTML/CSS and the concatenated local ES module sources loaded via `page.set_content`. This tested DOM interaction and Canvas drawing; it is **not** a claim of direct URL-based navigation or GitHub Pages verification.
- Verified no browser-script errors, placed a trap, started a raid and generated actual live Canvas screenshots. Screenshots are in `assets/gameplay-pixel-v1.1.png`, `assets/raid-pixel-v1.1.png`, and `assets/dashboard-pixel-v1.1.webp`.
- The five core experimental metrics and deterministic combat logic are unchanged.
- Windows and GitHub Pages rendering still require separate verification by a user or CI browser.
