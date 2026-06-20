"""Full-bleed room background sprites (1280x720), one per room type."""

from __future__ import annotations

import common

# Must match src/config.ts (logical design resolution).
GAME_WIDTH, GAME_HEIGHT = 1280, 720

# room: (wall colour / floor description, UPPER-WALL & CEILING decorations only)
ROOMS = {
    "living": (
        "warm beige walls and a wooden floor",
        "a ceiling fan hanging from the ceiling, a few framed family pictures and a "
        "round wall clock high on the walls, a bright window with daylight",
    ),
    "bedroom": (
        "soft blue walls and a wooden floor",
        "a paper-lantern ceiling light, framed pictures and colourful star wall "
        "stickers high on the walls, a window with the morning sky",
    ),
    "kitchen": (
        "pale green walls and a tiled floor",
        "a row of upper wall cabinets and open shelves with jars high on the walls, "
        "a hanging ceiling lamp, a window, a small wall clock",
    ),
    "bathroom": (
        "light teal tiled walls and a tiled floor",
        "a round mirror and a towel rail high on the wall, a ceiling light, a small "
        "frosted window",
    ),
    "hallway": (
        "warm cream walls and a wooden floor",
        "a row of framed pictures along the upper wall, a hanging ceiling lamp, a "
        "coat-hook rail high up, a window",
    ),
}


def run() -> list[str]:
    style = common.style_refs()
    keys = []
    for room, (walls, decor) in ROOMS.items():
        print(f"  room/{room} ...")
        full = (
            f"A natural, lived-in {room} interior as a flat side-on pixel-art game "
            f"background, with {walls}. Decorations: {decor}. "
            "IMPORTANT COMPOSITION: put ALL decorations on the UPPER TWO-THIRDS only "
            "(the walls and ceiling). The LOWER THIRD of the image is the floor and "
            "MUST be completely clear and empty — no furniture, no rugs, no objects "
            "standing on the floor — leaving open floor space for game characters. "
            "Include a clear horizontal line where the wall meets the floor about "
            "two-thirds of the way down."
        )
        img = common.make_background(full, GAME_WIDTH, GAME_HEIGHT, refs=style)
        common.save(img, f"bg-{room}")
        keys.append(f"bg-{room}")
    return keys


if __name__ == "__main__":
    run()
