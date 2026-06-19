"""Full-bleed room background sprites (1280x720), one per room type."""

from __future__ import annotations

import common

# Must match src/config.ts (logical design resolution).
GAME_WIDTH, GAME_HEIGHT = 1280, 720

ROOMS = {
    "living": "an empty living room, warm beige walls, a wooden floor",
    "bedroom": "an empty child's bedroom, soft blue walls, a wooden floor",
    "kitchen": "an empty kitchen, pale green walls, a tiled floor",
    "bathroom": "an empty bathroom, light teal tiled walls, a tiled floor",
    "hallway": "an empty hallway, warm cream walls, a wooden floor",
}


def run() -> list[str]:
    style = common.style_refs()
    keys = []
    for room, prompt in ROOMS.items():
        print(f"  room/{room} ...")
        full = (
            "A COMPLETELY EMPTY room background for a 2D game: " + prompt + ". "
            "Flat side-on view, simple flat-color pixel-art walls and floor with a "
            "clear horizontal line where the wall meets the floor about two-thirds "
            "down. ABSOLUTELY NO furniture, no objects, no rugs, no pictures, no "
            "plants, no shelves, no appliances, no decorations of any kind — just "
            "bare empty walls and an empty floor. Nothing in the room."
        )
        img = common.make_background(full, GAME_WIDTH, GAME_HEIGHT, refs=style)
        common.save(img, f"bg-{room}")
        keys.append(f"bg-{room}")
    return keys


if __name__ == "__main__":
    run()
