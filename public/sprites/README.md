# Sprites (illustrated art) — asset spec

PNGs here are the game's illustrated art, produced by `scripts/gen-assets/`
(Gemini 2.5 Flash Image). Everything is **optional**: any missing file falls back
to procedural art, so the game always runs. A file "activates" the moment it
exists and its key is listed in `assets.json`.

`assets.json` — a JSON array of the asset **keys** present (the generator writes
it). `PreloadScene` loads it first and only fetches listed files, so there are no
404s while art is still being made. To hand-place a single asset, add its PNG
here and add its key to this list.

## Keys, files, sizes

| Key | File(s) | Size | Notes |
|---|---|---|---|
| `burhan` | `burhan.png` + `burhan.json` | atlas | frames: `idle, wave, walk-1, walk-2, look-left, look-right, crouch, peek, sneak, found, celebrate` (transparent) |
| `decoy-kid` | `decoy-kid.png` + `.json` | atlas | frames: `hide, peek, found` |
| `decoy-pet` | `decoy-pet.png` + `.json` | atlas | frames: `hide, peek, found` |
| `furn-<kind>-base` | `furn-<kind>-base.png` | ~256×320 | closed body, transparent. kinds: `wardrobe, bed, curtain, toybox, plant, door, sofa, bookshelf` |
| `furn-<kind>-cover` | `furn-<kind>-cover.png` | ~256×320 | the openable door/lid/curtain/skirt, transparent |
| `bg-<type>` | `bg-<type>.png` | 1280×720 | full-bleed room background. types: `living, bedroom, kitchen, bathroom, hallway` |
| `play-button` | `play-button.png` | ~220 | transparent UI |
| `door-arrow` | `door-arrow.png` | ~180 | arrow points right; the game flips it for left doors |
| `star` / `star-empty` | `star.png` / `star-empty.png` | ~96 | tries counter |
| `call-button` | `call-button.png` | ~200 | "Call Burhan!" button |
| `footprints` | `footprints.png` | ~80 | clue trail mark |
| `dropped-toy` | `dropped-toy.png` | ~120 | lingering relocation tell |

Frame names for `burhan` must match `BURHAN_ANIMS` in `src/assets/manifest.ts`.
All sprite art is transparent PNG (no shadow/border); backgrounds are opaque.
