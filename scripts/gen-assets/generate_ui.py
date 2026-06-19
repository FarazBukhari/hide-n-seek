"""UI + clue art: buttons, arrows, stars, footprints, dropped toy."""

from __future__ import annotations

import common

# key: (prompt, width, height)
UI = {
    "play-button": ("a round green play button with a white triangle, game UI icon", 220, 220),
    "door-arrow": ("a round translucent dark button with a bold white arrow pointing right, game UI", 180, 180),
    "star": ("a bright gold five-pointed star with a soft outline, game UI icon", 96, 96),
    "star-empty": ("an empty dim grey five-pointed star outline, game UI icon", 96, 96),
    "call-button": ("a round green button with a white speech-bubble / megaphone, game UI icon", 200, 200),
    "footprints": ("a small pair of cartoon footprints / paw prints on the floor, top-down, subtle", 80, 80),
    "dropped-toy": ("a single small dropped toy (a ball or block) lying on the floor", 120, 120),
}


def run() -> list[str]:
    style = common.style_refs()
    keys = []
    for key, (prompt, w, h) in UI.items():
        print(f"  ui/{key} ...")
        common.save(common.make_sprite(prompt, w, h, refs=style), key)
        keys.append(key)
    return keys


if __name__ == "__main__":
    run()
