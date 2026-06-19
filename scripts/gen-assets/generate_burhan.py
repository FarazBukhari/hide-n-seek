"""Photo-driven Burhan sprites.

Generates a pixel-art sprite for each pose/action, using the real photos in
assets-src/burhan-photos/ for a close likeness (face, hair, build) and the
supplied sprite sheet in assets-src/sprite-sheet/ as the style anchor. Frames are
packed into a Phaser atlas: public/sprites/burhan.png + burhan.json.
"""

from __future__ import annotations

import common

FRAME_W, FRAME_H = 320, 440

# Pose name -> description. The name MUST match the frames in
# src/assets/manifest.ts (BURHAN_ANIMS) so the animations resolve.
POSES = {
    "idle": "standing relaxed, facing forward, arms at sides, gentle smile",
    "wave": "standing, one arm raised waving happily, big smile",
    "walk-1": "mid-stride walking to the right, left leg forward",
    "walk-2": "mid-stride walking to the right, right leg forward",
    "look-left": "standing, head and eyes turned to his left, curious, hand shading eyes",
    "look-right": "standing, head and eyes turned to his right, curious",
    "crouch": "crouching down low, knees bent, hiding small, peeking ahead",
    "peek": "crouched and leaning sideways to peek around a corner, one eye showing, playful grin",
    "sneak": "tip-toeing sneakily, exaggerated stealth, finger to lips 'shh'",
    "found": "surprised happy expression, arms up, caught and delighted",
    "celebrate": "jumping for joy, both arms up, huge smile",
}


def run() -> list[str]:
    photos = common.burhan_photos()
    style = common.style_refs()
    if not photos:
        print("  ! no photos in assets-src/burhan-photos/ — skipping Burhan "
              "(game uses the placeholder Burhan).")
        return []
    refs = photos + style

    base = (
        "Create a single full-body pixel-art game character of THIS specific young "
        "boy (4-5 years old) shown in the reference photos — keep his real face, "
        "hair, and skin tone recognizable. Dress him in a plain solid-color "
        "t-shirt and shorts with NO text, letters, logos or brand names anywhere. "
        "Pose: {pose}. "
    )
    frames = {}
    for name, pose in POSES.items():
        print(f"  burhan/{name} ...")
        frames[name] = common.make_sprite(
            base.format(pose=pose), FRAME_W, FRAME_H, refs=refs
        )
    common.save_atlas(frames, "burhan", cols=4)
    return ["burhan"]


if __name__ == "__main__":
    run()
