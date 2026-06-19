// ---------------------------------------------------------------------------
// Procedural fallback art. When an illustrated PNG (see manifest.ts) is missing,
// these code-drawn textures keep the game fully playable and on-style. Furniture,
// room backgrounds and UI fall back inline in their own modules (vector draws);
// the *character* textures must always exist, so they live here and are ensured
// in PreloadScene before any scene runs.
// ---------------------------------------------------------------------------

import Phaser from "phaser";

/** Build a texture by `key` if it isn't already loaded (real art wins). */
export function ensurePlaceholder(scene: Phaser.Scene, key: string) {
  if (scene.textures.exists(key)) return;
  switch (key) {
    case "burhan":
      buildBurhan(scene);
      break;
    case "decoy-kid":
      buildDecoyKid(scene);
      break;
    case "decoy-pet":
      buildDecoyPet(scene);
      break;
  }
}

/** Ensure every character texture used by actors exists. Call once in Preload. */
export function ensureCharacterTextures(scene: Phaser.Scene) {
  ensurePlaceholder(scene, "burhan");
  ensurePlaceholder(scene, "decoy-kid");
  ensurePlaceholder(scene, "decoy-pet");
}

/**
 * Cartoon "Burhan" from primitive shapes: tan skin, dark wavy hair, big eyes, a
 * turquoise tee, one hand raised in a wave. (Moved from PreloadScene.) Replaced
 * by the photo-driven atlas the moment `sprites/burhan.png|json` exists.
 */
function buildBurhan(scene: Phaser.Scene) {
  const W = 260;
  const H = 360;
  const g = scene.add.graphics();

  const SKIN = 0xeab98f;
  const SKIN_SHADE = 0xd9a376;
  const HAIR = 0x2a1c10;
  const SHIRT = 0x2bbeb6;
  const SHIRT_SHADE = 0x1f9c95;
  const SHORTS = 0x3a4f78;
  const SHOE = 0xf4f4f4;
  const OUTLINE = 0x3a2a1e;
  const EYE_WHITE = 0xffffff;
  const IRIS = 0x5a3a1e;
  const MOUTH = 0x8a3b2a;
  const CHEEK = 0xff9a8a;

  const cx = 130;

  const limb = (x1: number, y1: number, x2: number, y2: number, width: number, color: number) => {
    g.lineStyle(width, color, 1);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
    g.fillStyle(color, 1);
    g.fillCircle(x1, y1, width / 2);
    g.fillCircle(x2, y2, width / 2);
  };

  g.fillStyle(SKIN, 1);
  g.fillRoundedRect(96, 318, 30, 34, 10);
  g.fillRoundedRect(134, 318, 30, 34, 10);
  g.fillStyle(SHOE, 1);
  g.fillEllipse(106, 350, 46, 22);
  g.fillEllipse(160, 350, 46, 22);
  g.lineStyle(3, OUTLINE, 0.5);
  g.strokeEllipse(106, 350, 46, 22);
  g.strokeEllipse(160, 350, 46, 22);

  g.fillStyle(SHORTS, 1);
  g.fillRoundedRect(60, 300, 140, 38, 14);

  g.fillStyle(SHIRT, 1);
  g.fillRoundedRect(44, 212, 172, 110, 40);
  g.fillStyle(SHIRT_SHADE, 1);
  g.fillRoundedRect(44, 286, 172, 36, 18);
  g.lineStyle(4, OUTLINE, 0.55);
  g.strokeRoundedRect(44, 212, 172, 110, 40);

  limb(70, 224, 62, 286, 30, SHIRT);
  limb(62, 286, 58, 314, 26, SKIN);
  g.fillStyle(SKIN, 1);
  g.fillCircle(58, 316, 16);
  limb(190, 222, 214, 184, 30, SHIRT);
  limb(214, 184, 232, 146, 26, SKIN);
  g.fillStyle(SKIN, 1);
  g.fillCircle(234, 142, 17);

  g.fillStyle(SKIN, 1);
  g.fillRoundedRect(cx - 13, 198, 26, 26, 8);
  g.fillCircle(56, 136, 17);
  g.fillCircle(204, 136, 17);
  g.fillStyle(SKIN, 1);
  g.fillEllipse(cx, 132, 150, 168);
  g.lineStyle(4, OUTLINE, 0.5);
  g.strokeEllipse(cx, 132, 150, 168);

  g.fillStyle(CHEEK, 0.45);
  g.fillCircle(86, 172, 14);
  g.fillCircle(174, 172, 14);

  g.fillStyle(HAIR, 1);
  g.fillPoints(
    [
      { x: 52, y: 124 },
      { x: 58, y: 70 },
      { x: 92, y: 38 },
      { x: cx, y: 30 },
      { x: 168, y: 38 },
      { x: 202, y: 70 },
      { x: 208, y: 124 },
      { x: 186, y: 112 },
      { x: 166, y: 130 },
      { x: 146, y: 110 },
      { x: cx, y: 132 },
      { x: 114, y: 110 },
      { x: 94, y: 130 },
      { x: 74, y: 112 },
    ],
    true,
    true,
  );
  g.fillCircle(58, 110, 16);
  g.fillCircle(202, 110, 16);

  g.fillStyle(HAIR, 1);
  g.fillRoundedRect(84, 126, 40, 9, 4);
  g.fillRoundedRect(136, 126, 40, 9, 4);

  const eye = (ex: number) => {
    g.fillStyle(EYE_WHITE, 1);
    g.fillEllipse(ex, 150, 40, 46);
    g.lineStyle(3, OUTLINE, 0.4);
    g.strokeEllipse(ex, 150, 40, 46);
    g.fillStyle(IRIS, 1);
    g.fillCircle(ex, 152, 15);
    g.fillStyle(0x000000, 1);
    g.fillCircle(ex, 152, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex - 4, 148, 4);
  };
  eye(104);
  eye(156);

  g.fillStyle(SKIN_SHADE, 1);
  g.fillEllipse(cx, 172, 16, 11);
  g.lineStyle(7, MOUTH, 1);
  g.beginPath();
  g.arc(cx, 188, 26, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();

  g.generateTexture("burhan", W, H);
  g.destroy();
}

/** A simple sibling decoy: pigtails + a pink dress, distinct from Burhan. */
function buildDecoyKid(scene: Phaser.Scene) {
  const W = 220;
  const H = 320;
  const g = scene.add.graphics();
  const cx = W / 2;
  const SKIN = 0xf0c69a;
  const HAIR = 0x3a2410;
  const DRESS = 0xff84b0;
  const DRESS_SHADE = 0xe06694;
  const SHOE = 0xffffff;
  const OUTLINE = 0x3a2a1e;

  // legs + shoes
  g.fillStyle(SKIN, 1);
  g.fillRoundedRect(cx - 34, 276, 26, 30, 9);
  g.fillRoundedRect(cx + 8, 276, 26, 30, 9);
  g.fillStyle(SHOE, 1);
  g.fillEllipse(cx - 22, 306, 40, 18);
  g.fillEllipse(cx + 22, 306, 40, 18);

  // dress (triangle-ish)
  g.fillStyle(DRESS, 1);
  g.fillTriangle(cx - 80, 286, cx + 80, 286, cx, 150);
  g.fillStyle(DRESS_SHADE, 1);
  g.fillTriangle(cx - 80, 286, cx + 80, 286, cx, 230);
  g.fillStyle(DRESS, 1);
  g.fillRoundedRect(cx - 40, 150, 80, 80, 26);

  // arms
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx - 64, 240, 14);
  g.fillCircle(cx + 64, 240, 14);

  // head
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, 110, 62);
  g.lineStyle(4, OUTLINE, 0.5);
  g.strokeCircle(cx, 110, 62);

  // pigtails
  g.fillStyle(HAIR, 1);
  g.fillCircle(cx - 60, 96, 26);
  g.fillCircle(cx + 60, 96, 26);
  g.fillEllipse(cx, 70, 130, 70);

  // eyes + smile
  g.fillStyle(0x000000, 1);
  g.fillCircle(cx - 20, 112, 8);
  g.fillCircle(cx + 20, 112, 8);
  g.lineStyle(6, 0x8a3b2a, 1);
  g.beginPath();
  g.arc(cx, 130, 20, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.strokePath();

  g.generateTexture("decoy-kid", W, H);
  g.destroy();
}

/** A simple orange cat decoy. */
function buildDecoyPet(scene: Phaser.Scene) {
  const W = 200;
  const H = 180;
  const g = scene.add.graphics();
  const cx = W / 2;
  const FUR = 0xf4a23c;
  const FUR_SHADE = 0xd9842a;
  const OUTLINE = 0x6b3f12;

  // body
  g.fillStyle(FUR, 1);
  g.fillEllipse(cx, 120, 150, 96);
  g.fillStyle(FUR_SHADE, 1);
  g.fillEllipse(cx, 150, 150, 50);

  // tail
  g.lineStyle(20, FUR, 1);
  g.beginPath();
  g.moveTo(cx + 64, 130);
  g.lineTo(cx + 96, 80);
  g.strokePath();

  // head
  g.fillStyle(FUR, 1);
  g.fillCircle(cx - 36, 78, 50);
  // ears
  g.fillTriangle(cx - 76, 50, cx - 56, 12, cx - 40, 46);
  g.fillTriangle(cx - 4, 46, cx + 12, 12, cx + 4, 50);
  g.lineStyle(3, OUTLINE, 0.5);
  g.strokeCircle(cx - 36, 78, 50);

  // eyes + nose
  g.fillStyle(0x2c5d34, 1);
  g.fillCircle(cx - 54, 72, 9);
  g.fillCircle(cx - 18, 72, 9);
  g.fillStyle(0xff7a7a, 1);
  g.fillTriangle(cx - 40, 90, cx - 32, 90, cx - 36, 98);

  g.generateTexture("decoy-pet", W, H);
  g.destroy();
}
