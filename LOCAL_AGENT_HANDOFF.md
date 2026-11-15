# TrapScholar v3 — local AI handoff

**Project**: browser-native offline isometric strategy game with transparent online-learning enemies and seeded research comparisons. Preserve existing mechanics and v2 saves.

**New v3 work**: original 4x4 SVG atlas loaded by `src/art-assets.js`, screen-space ambient light/chasm/dust module `src/visual-effects.js`, deeper masonry and route geometry in `src/isometric-renderer.js`. README and legal notes clarify the two Hugging Face datasets.

**Windows first step**:
```powershell
git pull
npm run check
.\scripts\start.ps1
```

**Next tasks**:
1. Verify the live v3 atlas visually, click placement, save/import and frame pacing on Windows. Browser game has no GPU or LLM dependency.
2. If available, run the optional Pixel Art Atlas preview importer; inspect sprites and rights before `--install`, including Krea terms. Do not download all 1.4 million items.
3. Prefer a coherent, verifiably CC0 Kenney/KayKit dungeon kit for a proper 3D-to-sprite orthographic bake (Blender). Start with one wall/floor/torch/hero vertical slice before replacing existing art.
4. Don't fetch the ~490GB NVIDIA SimReady repo. If needed, explicitly select a tiny number of relevant USD files with attribution and test them offline.
5. Preserve core combat/AI and use real-game screenshots, not key art, in README. Run the full test suite on every milestone.
