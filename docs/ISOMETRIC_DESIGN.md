# TrapScholar v2 — Isometric renderer design

The fantasy cover is **promotional concept art**, not a runtime screenshot. The actual playable game is a browser-native Canvas 2D isometric projection with hand-authored procedural geometry and sprites; the 22×13 logical board, combat, AI and save data are preserved from v1.1.

## Coordinate transform

Logical cells are `(x,y)` and projected centers are:

```text
screenX = originX + (x-y) * halfW
screenY = originY + (x+y) * halfH
```

The screen-to-grid inverse is:

```text
dx = (screenX - originX) / halfW
dy = (screenY - originY) / halfH
x = (dx+dy)/2
y = (dy-dx)/2
```

Rounded candidates are accepted only when the click remains inside a tile's diamond. A second `canBuild` engine check restricts placement to **columns 2–19 on route rows 3, 6, 9**. Clicking on decorative stone or cliff faces cannot bypass the game engine.

Projection parameters live in `src/isometric.js` and are shared by the renderer and pointer handler. Changing them means changing the coordinates used by the offline test harness.

## Visual organization

The renderer adds non-interactive shoulder masonry adjacent to the original three thin paths. These shoulder platforms and ruins have no game behavior; the luminous diamond sockets always map to legitimate placement locations. A painter's sort by `x+y` draws the bridge tiles and raised cliff faces. Traps and sprites are drawn above the floor. Background, magic, torchlight and the shrine are hand-authored primitives and original sprites.

All animation uses a bounded timestep and approximately 30 Hz draw loop for modest CPU cost. `prefers-reduced-motion` disables nonessential flicker and particles. The pure JS learning/combat modules are unchanged. No 3D engine, model inference, GPU-specific package, network call, or runtime asset download is required.

## Asset provenance and honest labeling

- `assets/key-art.webp` and `assets/logo.webp`: original generated concept/promotional art; **not** in-game camera captures.
- `assets/isometric-build.webp` and `assets/isometric-raid.webp`: screenshots captured from running source modules in Chromium with an offline module-loading smoke harness.
- `src/isometric-renderer.js`, `src/pixel-art.js`: procedural runtime art and sprite cache.

The goal is gameplay **reminiscent of** the fantasy illustration, not the false claim that a 3D game was exported directly from that image.

## Future production-grade visual goals

1. Coherent 4- or 8-direction hero sprite sheets (idle, walk, damage, attack, death); use consistent pixel grid and palettes.
2. Truly modular isometric tileset with floor, walls, railing corners, stairs, balconies, ruin pieces, normal maps/light effects.
3. Multi-layer camera with zoom/pan, occlusion management, hero parties, route animations and additional dungeon maps.
4. Better compositing: emissive surfaces, pixel-correct particles, day/night/color grading, occlusion behind pillars.
5. A procedural and editorial asset pipeline; record source attribution/license for externally sourced art.

Do not add an AI model or other runtime service just for presentation; retain local and offline operation as a first-class feature.
