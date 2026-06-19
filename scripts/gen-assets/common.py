"""Shared helpers for the Where's Burhan asset generator.

Wraps Gemini 2.5 Flash Image ("nano-banana") generation + Pillow post-processing
(background alpha-keying, trim, resize) and Phaser texture-atlas assembly. All
generators import from here. Nothing in this repo is shipped at runtime — outputs
land in public/sprites/ and are committed; the game falls back to procedural art
for anything missing, so a partial run is always safe.

Requires:
  - GEMINI_API_KEY in the environment
  - `pip install -r requirements.txt`
"""

from __future__ import annotations

import io
import json
import os
import pathlib
from typing import Iterable

from PIL import Image

# Repo paths.
ROOT = pathlib.Path(__file__).resolve().parents[2]
SPRITES_DIR = ROOT / "public" / "sprites"
PHOTOS_DIR = ROOT / "assets-src" / "burhan-photos"
STYLE_DIR = ROOT / "assets-src" / "sprite-sheet"

MODEL = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")

# Reused style anchor so every asset reads as one cohesive 8-bit game.
STYLE = (
    "8-bit / 16-bit pixel-art video-game style, crisp clean outlines, flat cel "
    "shading with a limited warm palette, friendly and cute, consistent with the "
    "supplied reference sprite sheet. Subject centered and fully in frame."
)
TRANSPARENT = (
    " Transparent background (PNG alpha), no ground, no shadow, no border, no text, "
    "no watermark."
)

_client = None


def client():
    """Lazily build the Gemini client (clear error if the key is missing)."""
    global _client
    if _client is None:
        try:
            from google import genai
        except ImportError as e:  # pragma: no cover
            raise SystemExit(
                "google-genai not installed. Run: pip install -r "
                "scripts/gen-assets/requirements.txt"
            ) from e
        key = os.environ.get("GEMINI_API_KEY")
        if not key:
            raise SystemExit("GEMINI_API_KEY is not set in the environment.")
        _client = genai.Client(api_key=key)
    return _client


def _load_images(folder: pathlib.Path, limit: int | None = None) -> list[Image.Image]:
    if not folder.exists():
        return []
    exts = {".png", ".jpg", ".jpeg", ".webp"}
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in exts)
    if limit:
        files = files[:limit]
    return [Image.open(p).convert("RGBA") for p in files]


def style_refs() -> list[Image.Image]:
    """The supplied pose sprite sheet(s), used as a style anchor everywhere."""
    return _load_images(STYLE_DIR)


def burhan_photos(limit: int = 4) -> list[Image.Image]:
    """Real photos of Burhan (for close likeness). Empty list if none provided."""
    return _load_images(PHOTOS_DIR, limit=limit)


def generate(prompt: str, refs: Iterable[Image.Image] = ()) -> Image.Image:
    """Generate one image. `refs` are sent alongside the prompt for style/likeness."""
    from google.genai import types

    contents: list = [prompt, *refs]
    resp = client().models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )
    for cand in resp.candidates or []:
        for part in (cand.content.parts if cand.content else []) or []:
            data = getattr(part, "inline_data", None)
            if data and data.data:
                return Image.open(io.BytesIO(data.data)).convert("RGBA")
    raise RuntimeError("Gemini returned no image. Prompt:\n" + prompt[:200])


# ---------------------------------------------------------------------------
# Pillow post-processing
# ---------------------------------------------------------------------------

def key_out_background(img: Image.Image, tol: int = 28) -> Image.Image:
    """Make a near-uniform background transparent by sampling the four corners."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    # Average the corner color as the background reference.
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))

    def close(a, b):
        return all(abs(a[i] - b[i]) <= tol for i in range(3))

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and close((r, g, b), bg):
                px[x, y] = (r, g, b, 0)
    return img


def trim(img: Image.Image) -> Image.Image:
    """Crop to the non-transparent bounding box."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit_canvas(img: Image.Image, w: int, h: int, pad: float = 0.04) -> Image.Image:
    """Scale `img` to fit a w*h canvas (preserving aspect) and center it."""
    img = trim(img)
    avail_w, avail_h = int(w * (1 - pad)), int(h * (1 - pad))
    scale = min(avail_w / img.width, avail_h / img.height)
    new = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))),
                     Image.NEAREST)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.alpha_composite(new, ((w - new.width) // 2, (h - new.height) // 2))
    return canvas


def make_sprite(prompt: str, w: int, h: int, refs=(), transparent=True) -> Image.Image:
    """Generate + post-process a single transparent sprite at exactly w*h."""
    full = prompt + STYLE + (TRANSPARENT if transparent else "")
    img = generate(full, refs)
    if transparent:
        img = key_out_background(img)
    return fit_canvas(img, w, h)


def make_background(prompt: str, w: int, h: int, refs=()) -> Image.Image:
    """Generate a full-bleed (opaque) background scaled to fill w*h."""
    img = generate(prompt + STYLE, refs).convert("RGBA")
    # Cover-fit (crop overflow) so it fills the frame.
    scale = max(w / img.width, h / img.height)
    img = img.resize((int(img.width * scale), int(img.height * scale)), Image.NEAREST)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def save(img: Image.Image, name: str) -> str:
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)
    out = SPRITES_DIR / f"{name}.png"
    img.save(out)
    print(f"  wrote {out.relative_to(ROOT)}")
    return name


def save_atlas(frames: dict[str, Image.Image], name: str, cols: int = 4) -> str:
    """Pack named frames into a grid sheet + Phaser JSON-hash atlas (name.png/.json)."""
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)
    fw = max(f.width for f in frames.values())
    fh = max(f.height for f in frames.values())
    n = len(frames)
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * fw, rows * fh), (0, 0, 0, 0))
    meta_frames = {}
    for i, (frame_name, img) in enumerate(frames.items()):
        cx, cy = (i % cols) * fw, (i // cols) * fh
        ox, oy = cx + (fw - img.width) // 2, cy + (fh - img.height) // 2
        sheet.alpha_composite(img, (ox, oy))
        meta_frames[frame_name] = {
            "frame": {"x": cx, "y": cy, "w": fw, "h": fh},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": fw, "h": fh},
            "sourceSize": {"w": fw, "h": fh},
        }
    sheet.save(SPRITES_DIR / f"{name}.png")
    atlas = {
        "frames": meta_frames,
        "meta": {"image": f"{name}.png", "size": {"w": sheet.width, "h": sheet.height}, "scale": "1"},
    }
    (SPRITES_DIR / f"{name}.json").write_text(json.dumps(atlas, indent=2))
    print(f"  wrote {name}.png + {name}.json ({n} frames)")
    return name


def write_assets_manifest(keys: list[str]) -> None:
    """List of generated keys → public/sprites/assets.json (PreloadScene reads it)."""
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)
    out = SPRITES_DIR / "assets.json"
    out.write_text(json.dumps(sorted(set(keys)), indent=2))
    print(f"\nwrote {out.relative_to(ROOT)} with {len(set(keys))} keys")
