"""Generate every illustrated asset and write the present-list manifest.

Usage:
    pip install -r scripts/gen-assets/requirements.txt
    export GEMINI_API_KEY=...                 # your key
    # put real photos in assets-src/burhan-photos/
    # put the supplied pose sprite sheet in assets-src/sprite-sheet/
    python scripts/gen-assets/generate_all.py            # everything
    python scripts/gen-assets/generate_all.py burhan ui  # only some groups

It first does a tiny connectivity test, then runs each group. Each group is
independent and tolerant: a group that fails or is skipped just isn't added to
public/sprites/assets.json, and the game falls back to procedural art for it.
"""

from __future__ import annotations

import sys

import common
import generate_burhan
import generate_decoys
import generate_furniture
import generate_rooms
import generate_ui

GROUPS = {
    "burhan": generate_burhan.run,
    "decoys": generate_decoys.run,
    "furniture": generate_furniture.run,
    "rooms": generate_rooms.run,
    "ui": generate_ui.run,
}


def connectivity_test() -> None:
    print("Testing Gemini access (one throwaway image)...")
    img = common.generate("a single small red dot on a white background, simple")
    print(f"  ok — model responded with a {img.width}x{img.height} image.\n")


def main(argv: list[str]) -> int:
    wanted = [a for a in argv[1:] if a in GROUPS] or list(GROUPS)
    try:
        connectivity_test()
    except SystemExit as e:
        print(e)
        return 1
    except Exception as e:  # noqa: BLE001
        print(f"  ! connectivity test failed: {e}")
        return 1

    produced: list[str] = []
    for name in wanted:
        print(f"=== {name} ===")
        try:
            produced += GROUPS[name]()
        except Exception as e:  # noqa: BLE001 — keep going; partial sets are safe
            print(f"  ! {name} failed: {e}")

    # Merge with any keys already present so re-running one group doesn't drop others.
    existing = []
    manifest = common.SPRITES_DIR / "assets.json"
    if manifest.exists():
        import json
        existing = json.loads(manifest.read_text())
    common.write_assets_manifest(existing + produced)
    print("\nDone. Review public/sprites/, then commit. `npm run dev` to see them.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
