"""Full-bleed room background sprites (1280x720), one per room type."""

from __future__ import annotations

import common

# Must match src/config.ts (logical design resolution).
GAME_WIDTH, GAME_HEIGHT = 1280, 720

ROOMS = {
    "living": "a cozy cartoon living room interior, warm tones, a rug and a window, empty floor in the middle",
    "bedroom": "a child's cartoon bedroom interior, soft blue tones, a window, empty floor in the middle",
    "kitchen": "a bright cartoon kitchen interior, green/yellow tones, counters along the back, empty floor",
    "bathroom": "a clean cartoon bathroom interior, light teal tones, tiles, empty floor in the middle",
    "hallway": "a warm cartoon hallway interior, several doors along the back, empty floor in the middle",
}


def run() -> list[str]:
    style = common.style_refs()
    keys = []
    for room, prompt in ROOMS.items():
        print(f"  room/{room} ...")
        full = (
            prompt
            + ". Side-on flat view suitable as a game background, leave the lower-"
            "center floor area clear so furniture can be placed on top."
        )
        img = common.make_background(full, GAME_WIDTH, GAME_HEIGHT, refs=style)
        common.save(img, f"bg-{room}")
        keys.append(f"bg-{room}")
    return keys


if __name__ == "__main__":
    run()
