"""Decoy hiders: a sibling kid and the family pet, in the same pixel-art style."""

from __future__ import annotations

import common

FRAME_W, FRAME_H = 300, 420
PET_W, PET_H = 300, 280

KID_POSES = {
    "hide": "young child crouching to hide, peeking, playful",
    "peek": "young child leaning out to peek, grinning",
    "found": "young child surprised and giggling, arms up",
}
PET_POSES = {
    "hide": "cute house cat crouched and hiding, only head peeking",
    "peek": "cute house cat peeking around, curious",
    "found": "cute house cat surprised, sitting up, happy",
}


def run() -> list[str]:
    style = common.style_refs()
    keys = []

    kid_prompt = "A different young child (a sibling, clearly NOT the same boy), full body. Pose: {p}. "
    kid_frames = {n: common.make_sprite(kid_prompt.format(p=p), FRAME_W, FRAME_H, refs=style)
                  for n, p in KID_POSES.items()}
    common.save_atlas(kid_frames, "decoy-kid", cols=3)
    keys.append("decoy-kid")

    pet_prompt = "A friendly family pet. {p}. "
    pet_frames = {n: common.make_sprite(pet_prompt.format(p=p), PET_W, PET_H, refs=style)
                  for n, p in PET_POSES.items()}
    common.save_atlas(pet_frames, "decoy-pet", cols=3)
    keys.append("decoy-pet")

    return keys


if __name__ == "__main__":
    run()
