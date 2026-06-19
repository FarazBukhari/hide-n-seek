# Asset generator

Generates the game's illustrated 8-bit art with **Gemini 2.5 Flash Image**
("nano-banana") and writes it to `public/sprites/`. Run once (re-run to iterate);
outputs are committed. The game falls back to procedural art for anything not
generated, so partial runs are safe.

## Setup

```bash
pip install -r scripts/gen-assets/requirements.txt
export GEMINI_API_KEY=YOUR_KEY
# inputs (see their READMEs):
#   assets-src/burhan-photos/   <- real photos of Burhan (for likeness)
#   assets-src/sprite-sheet/    <- supplied pose sheet (style anchor)
```

## Run

```bash
python scripts/gen-assets/generate_all.py            # everything
python scripts/gen-assets/generate_all.py burhan ui  # only some groups
```

Groups: `burhan`, `decoys`, `furniture`, `rooms`, `ui`. The script runs a tiny
connectivity test first, generates each group, post-processes with Pillow
(background alpha-key, trim, fit), and updates `public/sprites/assets.json`.

Override the model with `GEMINI_IMAGE_MODEL` if needed.

## After running

1. Eyeball every PNG in `public/sprites/` (likeness + style). Re-run a group to
   regenerate; prompts live in each `generate_*.py`.
2. `npm run dev` — illustrated assets replace the placeholders automatically.
3. Commit `public/sprites/`.

See `public/sprites/README.md` for the full key/size spec.
