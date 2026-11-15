# TrapScholar v3 — asset sources and safe integration

The shipping game uses original local Canvas graphics and the checked-in 16-sprite SVG atlas. **Neither Hugging Face dataset has been downloaded or incorporated into the released game.**

## Angais Pixel Art Atlas (optional)

Source: https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m

- 1,409,404 AI-generated transparent 16×16 sprites across roughly 6,194 subject labels.
- Useful for isolated item icons and decorative props, not a cohesive isometric dungeon tileset or walking animations.
- Source CC0 is only a dedication of rights held by Angais. Applicable Krea 2 Turbo/LoRA license terms and third-party rights remain. Captions are approximate, not guaranteed accurate.
- Use the optional preview importer only if you independently verify terms and imagery. It downloads a small validation split rather than the entire ~694MB Parquet corpus.

```powershell
python -m pip install datasets pillow
python scripts/import_pixel_atlas.py
# Review assets/world/atlas-candidate-preview.svg and the provenance JSON
python scripts/import_pixel_atlas.py --install
```

The importer backs up the original game atlas, and only applies selected sprite replacements after an explicit --install. The fallback is always available.

## NVIDIA SimReady (NOT integrated)

Source: https://huggingface.co/datasets/nvidia/simready-assets

The repository lists 2,677 OpenUSD 3D simulation assets totaling approximately 490GB. It lists CC BY 4.0: honor author attribution and check any file-specific notices. It is largely simulation/industrial content, not a convenient fantasy-dungeon asset pack. Do not clone it wholesale.

If a specific prop is useful, select only that USD filename and use an offline Blender/OpenUSD orthographic render-to-sprite step. This selective USD pipeline remains future work, not shipped code.

## Better fantasy sources and future 3D-to-pixel workflow

- [Kenney Isometric Dungeon Tiles](https://kenney-assets.itch.io/isometric-dungeon-tiles), CC0: coherent 2D isometric floors, walls and character examples.
- [KayKit Dungeon Pack](https://kaylousberg.itch.io/kaykit-dungeon-pack), CC0: hundreds of modular fantasy dungeon 3D objects.
- [Quaternius](https://quaternius.com), packs with different applicable terms; the current QAL restricts independent asset redistribution.

For a future v4 art pass: download a specific verified fantasy kit, lock an orthographic camera at yaw 45°, pitch ~35°, render consistent 64/128-pixel tile layers, produce directional character animation strips, bake compatible lights/shadows and pack a sprite atlas. Keep the current original renderer as a resource-efficient fallback. Check the exact license for every asset before committing it.
