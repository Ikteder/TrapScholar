# TrapScholar v3.0 verification

## Authoring environment

- Base v2.1 had 39 passing tests. Two atlas tests and one atmosphere test were added, bringing the **published suite to 42 tests**.
- The v3 development source passed 42/42 Node tests and a Chromium offline smoke test: build a trap, spend resources, start a raid, pause/resume, export research CSV, fit a 390px mobile viewport, with zero page script exceptions.
- Combat rules, AI adaptation, save compatibility and research formulas were not changed. The v3 additions are primarily rendering, documentation and optional asset workflow.

## Limitations

- The two Hugging Face datasets were **not downloaded** in the authoring environment. The importer is an optional, unverified network-dependent tool; it requires human review of selected sprite images and their rights.
- NVIDIA OpenUSD assets and Blender render-to-sprite automation have **not** been integrated.
- Windows native browser gameplay, long-session performance, the new GitHub commit's CI, and exact visual parity with promotional art are not verified by this record.
- Screenshots already on GitHub capture the v2.1 baseline. See the local v3 source archive for the new gameplay capture; don't label old captures as v3.

## Test

```powershell
npm run check
.\scripts\start.ps1
```
