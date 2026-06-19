import Phaser from "phaser";
import type { HidingSpot, SpotKind } from "../house/types";
import { SPOT_VISUAL } from "../config";
import { furnBaseKey, furnCoverKey } from "../assets/manifest";

/**
 * Visual + interactive representation of one hiding spot. Furniture is drawn
 * **grounded** — its base sits on the room's floor line (`spot.y`) and it grows
 * upward, at its natural aspect ratio. When illustrated art exists
 * (`furn-<kind>-base` / `-cover`) it draws sprites; otherwise it falls back to
 * vector furniture. Either way it exposes a `cover` layer that animates open when
 * checked, behind which the live BurhanActor hides.
 */
export class HidingSpotView {
  readonly spot: HidingSpot;
  readonly container: Phaser.GameObjects.Container;
  checked = false;

  private cover: Phaser.GameObjects.GameObject[] = [];

  /** Computed display footprint (set during draw), used by actors + pop-out. */
  displayW = 180;
  displayH = 220;

  /** Per-kind bounding box the furniture is scaled to fit (aspect preserved). */
  private static readonly BOX: Record<SpotKind, { w: number; h: number }> = {
    wardrobe: { w: 210, h: 330 },
    bed: { w: 255, h: 215 },
    curtain: { w: 220, h: 350 },
    toybox: { w: 220, h: 205 },
    plant: { w: 200, h: 285 },
    door: { w: 210, h: 350 },
    sofa: { w: 265, h: 205 },
    bookshelf: { w: 220, h: 345 },
  };

  constructor(scene: Phaser.Scene, spot: HidingSpot) {
    this.spot = spot;
    this.container = scene.add.container(spot.x, spot.y);
    this.draw(scene);
    // Hit area spans the furniture (which sits above the floor-line origin).
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-this.displayW / 2, -this.displayH, this.displayW, this.displayH),
      Phaser.Geom.Rectangle.Contains,
    );
    this.container.input!.cursor = "pointer";
  }

  private add(obj: Phaser.GameObjects.GameObject, isCover = false) {
    this.container.add(obj);
    if (isCover) this.cover.push(obj);
  }

  private draw(scene: Phaser.Scene) {
    if (scene.textures.exists(furnBaseKey(this.spot.kind))) {
      this.drawImages(scene);
    } else {
      this.drawVector(scene);
    }
  }

  /**
   * Illustrated path: an open/empty `base` body + an openable `cover`, both
   * scaled to fit the kind's box at their true aspect and bottom-anchored on the
   * floor line so they stand on the floor. A dark interior sits between them so
   * whatever is behind the cover (Burhan) reads as "inside".
   */
  private drawImages(scene: Phaser.Scene) {
    const box = HidingSpotView.BOX[this.spot.kind];
    const baseSrc = scene.textures.get(furnBaseKey(this.spot.kind)).getSourceImage();
    const s = Math.min(box.w / baseSrc.width, box.h / baseSrc.height);
    this.displayW = baseSrc.width * s;
    this.displayH = baseSrc.height * s;

    // Soft contact shadow so the piece reads as grounded on any background.
    this.add(scene.add.ellipse(0, 4, this.displayW * 0.78, 28, 0x000000, 0.18));

    // Dark "inside" revealed when the cover opens — bottom-anchored behind it.
    const inside = scene.add
      .rectangle(0, -2, this.displayW * 0.78, this.displayH * 0.86, 0x241a14)
      .setOrigin(0.5, 1);
    this.add(inside);

    const base = scene.add
      .image(0, 0, furnBaseKey(this.spot.kind))
      .setOrigin(0.5, 1)
      .setDisplaySize(this.displayW, this.displayH);
    this.add(base);

    const coverKey = furnCoverKey(this.spot.kind);
    if (scene.textures.exists(coverKey)) {
      const cSrc = scene.textures.get(coverKey).getSourceImage();
      // Scale the cover by the same factor so it matches the base's footprint.
      const cover = scene.add
        .image(0, 0, coverKey)
        .setOrigin(0.5, 1)
        .setDisplaySize(cSrc.width * s, cSrc.height * s);
      this.add(cover, true);
    }
  }

  /** Original procedural furniture (fallback while art is generated). */
  private drawVector(scene: Phaser.Scene) {
    const W = 180;
    const H = 220;
    this.displayW = W;
    this.displayH = H;
    const hw = W / 2;
    const hh = H / 2;
    // Bottom-anchor the vector drawing (authored around 0,0) onto the floor line.
    const oy = -hh;
    const r = (x: number, y: number, w: number, h: number, c: number) =>
      scene.add.rectangle(x, y + oy, w, h, c);

    this.add(scene.add.ellipse(0, 4, W * 0.78, 26, 0x000000, 0.18));
    const inside = scene.add.rectangle(0, 6 + oy, W * 0.82, H * 0.82, 0x241a14);
    this.add(inside);

    switch (this.spot.kind) {
      case "wardrobe": {
        this.add(r(0, 0, W, H, 0x8a5a32).setStrokeStyle(6, 0x5e3c20));
        const ld = r(-hw / 2, 0, hw - 8, H - 16, 0xa6703f).setStrokeStyle(4, 0x5e3c20);
        const rd = r(hw / 2, 0, hw - 8, H - 16, 0xa6703f).setStrokeStyle(4, 0x5e3c20);
        this.add(ld, true);
        this.add(rd, true);
        break;
      }
      case "bed": {
        this.add(r(0, hh * 0.5, W, H * 0.55, 0x9c5a3c));
        this.add(r(0, hh * 0.1, W * 0.95, H * 0.32, 0xfdf3e3));
        this.add(r(0, hh * 0.18, W * 0.95, H * 0.22, 0xff8fa3));
        this.add(r(0, hh * 0.78, W * 0.95, H * 0.4, 0xc77a55), true);
        break;
      }
      case "curtain": {
        this.add(r(0, -hh, W * 1.05, 12, 0x6b4a2a));
        this.add(r(0, 0, W * 0.8, H * 0.8, 0x8fd0ff));
        this.add(r(-hw * 0.55, 0, W * 0.45, H, 0x7a3b6b), true);
        this.add(r(hw * 0.55, 0, W * 0.45, H, 0x7a3b6b), true);
        break;
      }
      case "toybox": {
        this.add(r(0, hh * 0.3, W, H * 0.7, 0xf2b134).setStrokeStyle(6, 0xc4881f));
        this.add(r(0, -hh * 0.35, W * 1.04, H * 0.22, 0xffd36b).setStrokeStyle(6, 0xc4881f), true);
        break;
      }
      case "plant": {
        this.add(r(0, hh * 0.6, W * 0.6, H * 0.4, 0xcf6a3a));
        this.add(scene.add.ellipse(-hw * 0.3, -hh * 0.1 + oy, W * 0.7, H * 0.8, 0x3fa05a), true);
        this.add(scene.add.ellipse(hw * 0.3, -hh * 0.1 + oy, W * 0.7, H * 0.8, 0x4fb96a), true);
        break;
      }
      case "door": {
        this.add(r(0, 0, W * 0.92, H, 0x6b4a2a).setStrokeStyle(8, 0x4a3018));
        this.add(r(0, 0, W * 0.7, H * 0.9, 0xb07b46).setStrokeStyle(4, 0x6b4a2a), true);
        this.add(scene.add.circle(W * 0.24, 0 + oy, 8, 0xffd24a), true);
        break;
      }
      case "sofa": {
        this.add(r(0, -hh * 0.18, W, H * 0.5, 0x4a78c0));
        this.add(r(0, hh * 0.2, W, H * 0.5, 0x5a8bd6).setStrokeStyle(5, 0x3a5f9e));
        this.add(r(0, hh * 0.55, W * 0.98, H * 0.4, 0x6f9ce0), true);
        break;
      }
      case "bookshelf": {
        this.add(r(0, 0, W, H, 0x7a4f2a).setStrokeStyle(6, 0x533418));
        for (let i = -1; i <= 1; i++) this.add(r(0, i * (H * 0.3), W * 0.9, 8, 0x533418));
        this.add(r(0, 0, W * 0.84, H * 0.92, 0xcf6a3a).setStrokeStyle(4, 0x9c4a22), true);
        break;
      }
    }
  }

  /**
   * Play the open animation. Returns a promise that resolves once the reveal is
   * complete, so the caller can show Burhan / move on.
   */
  open(scene: Phaser.Scene): Promise<void> {
    this.checked = true;
    this.container.angle = 0;
    const v = SPOT_VISUAL[this.spot.kind];
    return new Promise((resolve) => {
      const targets = this.cover;
      if (targets.length === 0) {
        resolve();
        return;
      }
      let pending = targets.length;
      const done = () => {
        if (--pending === 0) resolve();
      };
      const twoCover = targets.length > 1;
      targets.forEach((t, i) => {
        const obj = t as Phaser.GameObjects.Components.Transform &
          Phaser.GameObjects.Components.Alpha &
          Phaser.GameObjects.GameObject;
        const goLeft = i === 0 && twoCover;
        const slideX = twoCover ? (goLeft ? -v.openSlide.x : v.openSlide.x) : v.openSlide.x;
        scene.tweens.add({
          targets: obj,
          x: (obj as any).x + slideX,
          y: (obj as any).y + v.openSlide.y,
          alpha: 0,
          duration: 300,
          ease: "Quad.out",
          onComplete: done,
        });
      });
    });
  }

  /** Upper-middle point of the furniture in scene coords — where Burhan pops out. */
  popOutPoint() {
    return { x: this.container.x, y: this.container.y - this.displayH * 0.6 };
  }
}
