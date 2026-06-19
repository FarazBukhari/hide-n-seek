"""Furniture sprites: a closed `base` body + an openable `cover` per kind.

The game layers them: a dark interior sits behind the cover, the cover slides
away on tap to reveal Burhan. So `base` is drawn open/empty and `cover` is the
door / lid / curtain / skirt that conceals it.
"""

from __future__ import annotations

import common

FW, FH = 256, 320

# kind: (base prompt, cover prompt)
FURNITURE = {
    "wardrobe": (
        "a tall wooden wardrobe with its doors open, showing an empty dark interior, front view",
        "a pair of closed wooden wardrobe doors only (the front panel), front view",
    ),
    "bed": (
        "a child's bed seen from the side, with a dark gap underneath",
        "a hanging bed valance / skirt that covers the gap under the bed, front view",
    ),
    "curtain": (
        "a bright window on a wall, daylight outside, front view",
        "a pair of closed fabric curtains only, front view",
    ),
    "toybox": (
        "an open wooden toy chest, lid up, showing a dark inside, front view",
        "the closed lid of a toy chest only, front view",
    ),
    "plant": (
        "a terracotta plant pot with a bare stem, front view",
        "big bushy green leaves of a houseplant only, front view",
    ),
    "door": (
        "an open doorway in a wall showing a dark room beyond, front view",
        "a single closed wooden door with a knob only, front view",
    ),
    "sofa": (
        "the back and seat of a couch seen from the front, a dark gap behind it",
        "a long couch seat cushion / front skirt only, front view",
    ),
    "bookshelf": (
        "a wooden bookshelf with mostly empty shelves and a dark gap, front view",
        "rows of colorful book spines filling a bookshelf front only, front view",
    ),
}


def run() -> list[str]:
    style = common.style_refs()
    keys = []
    for kind, (base_p, cover_p) in FURNITURE.items():
        print(f"  furniture/{kind} ...")
        common.save(common.make_sprite(base_p, FW, FH, refs=style), f"furn-{kind}-base")
        common.save(common.make_sprite(cover_p, FW, FH, refs=style), f"furn-{kind}-cover")
        keys += [f"furn-{kind}-base", f"furn-{kind}-cover"]
    return keys


if __name__ == "__main__":
    run()
