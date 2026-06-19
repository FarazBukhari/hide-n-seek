import Phaser from "phaser";
import type { HidingSpot } from "../house/types";
import { SPOT_VISUAL } from "../config";
import { furnBaseKey, furnCoverKey } from "../assets/manifest";

/**
 * Visual + interactive representation of one hiding spot. When illustrated art
 * exists (`furn-<kind>-base` / `-cover`) it draws sprites; otherwise it falls
 * back to the original vector furniture. Either way it exposes a `cover` layer
 * that animates open when checked, behind which the live BurhanActor hides.
 */
export class HidingSpotView {
  readonly spot: HidingSpot;
  readonly container: Phaser.GameObjects.Container;
  checked = false;

  private cover: Phaser.GameObjects.GameObject[] = [];

  private static readonly W = 180;
  private static readonly H = 220;

  constructor(scene: Phaser.Scene, spot: HidingSpot) {
    this.spot = spot;
    this.container = scene.add.container(spot.x, spot.y);
    this.draw(scene);
    this.container.setSize(HidingSpotView.W, HidingSpotView.H);
    this.container.setInteractive({ useHandCursor: true });
  }

  private add(obj: Phaser.GameObjects.GameObject, isCover = false) {
    this.container.add(obj);
    if (isCover) this.cover.push(obj);
  }

  private draw(scene: Phaser.Scene) {
    const { W, H } = HidingSpotView;
    // Dark "inside" revealed when opened — sits behind the cover.
    const inside = scene.add.rectangle(0, 6, W * 0.82, H * 0.82, 0x241a14);
    this.add(inside);

    if (scene.textures.exists(furnBaseKey(this.spot.kind))) {
      this.drawImages(scene);
    } else {
      this.drawVector(scene);
    }
  }

  /** Illustrated path: closed body image + an openable cover image. */
  private drawImages(scene: Phaser.Scene) {
    const { W, H } = HidingSpotView;
    const base = scene.add.image(0, 0, furnBaseKey(this.spot.kind));
    base.setDisplaySize(W, H);
    this.add(base);
    const coverKey = furnCoverKey(this.spot.kind);
    if (scene.textures.exists(coverKey)) {
      const cover = scene.add.image(0, 0, coverKey);
      cover.setDisplaySize(W, H);
      this.add(cover, true);
    }
  }

  /** Original procedural furniture (fallback while art is generated). */
  private drawVector(scene: Phaser.Scene) {
    const { W, H } = HidingSpotView;
    const hw = W / 2;
    const hh = H / 2;

    switch (this.spot.kind) {
      case "wardrobe": {
        const body = scene.add.rectangle(0, 0, W, H, 0x8a5a32).setStrokeStyle(6, 0x5e3c20);
        this.add(body);
        const ld = scene.add.rectangle(-hw / 2, 0, hw - 8, H - 16, 0xa6703f);
        const rd = scene.add.rectangle(hw / 2, 0, hw - 8, H - 16, 0xa6703f);
        ld.setStrokeStyle(4, 0x5e3c20);
        rd.setStrokeStyle(4, 0x5e3c20);
        this.add(ld, true);
        this.add(rd, true);
        break;
      }
      case "bed": {
        const frame = scene.add.rectangle(0, hh * 0.5, W, H * 0.55, 0x9c5a3c);
        this.add(frame);
        const mattress = scene.add.rectangle(0, hh * 0.1, W * 0.95, H * 0.32, 0xfdf3e3);
        this.add(mattress);
        const blanket = scene.add.rectangle(0, hh * 0.18, W * 0.95, H * 0.22, 0xff8fa3);
        this.add(blanket);
        const skirt = scene.add.rectangle(0, hh * 0.78, W * 0.95, H * 0.4, 0xc77a55);
        this.add(skirt, true);
        break;
      }
      case "curtain": {
        const rod = scene.add.rectangle(0, -hh, W * 1.05, 12, 0x6b4a2a);
        this.add(rod);
        const window = scene.add.rectangle(0, 0, W * 0.8, H * 0.8, 0x8fd0ff);
        this.add(window);
        const lc = scene.add.rectangle(-hw * 0.55, 0, W * 0.45, H, 0x7a3b6b);
        const rc = scene.add.rectangle(hw * 0.55, 0, W * 0.45, H, 0x7a3b6b);
        this.add(lc, true);
        this.add(rc, true);
        break;
      }
      case "toybox": {
        const box = scene.add.rectangle(0, hh * 0.3, W, H * 0.7, 0xf2b134).setStrokeStyle(6, 0xc4881f);
        this.add(box);
        const lid = scene.add.rectangle(0, -hh * 0.35, W * 1.04, H * 0.22, 0xffd36b).setStrokeStyle(6, 0xc4881f);
        this.add(lid, true);
        break;
      }
      case "plant": {
        const pot = scene.add.rectangle(0, hh * 0.6, W * 0.6, H * 0.4, 0xcf6a3a);
        this.add(pot);
        const lleaf = scene.add.ellipse(-hw * 0.3, -hh * 0.1, W * 0.7, H * 0.8, 0x3fa05a);
        const rleaf = scene.add.ellipse(hw * 0.3, -hh * 0.1, W * 0.7, H * 0.8, 0x4fb96a);
        this.add(lleaf, true);
        this.add(rleaf, true);
        break;
      }
      case "door": {
        const frame = scene.add.rectangle(0, 0, W * 0.92, H, 0x6b4a2a).setStrokeStyle(8, 0x4a3018);
        this.add(frame);
        const panel = scene.add.rectangle(0, 0, W * 0.7, H * 0.9, 0xb07b46).setStrokeStyle(4, 0x6b4a2a);
        const knob = scene.add.circle(W * 0.24, 0, 8, 0xffd24a);
        this.add(panel, true);
        this.add(knob, true);
        break;
      }
      case "sofa": {
        const back = scene.add.rectangle(0, -hh * 0.18, W, H * 0.5, 0x4a78c0);
        this.add(back);
        const seat = scene.add.rectangle(0, hh * 0.2, W, H * 0.5, 0x5a8bd6).setStrokeStyle(5, 0x3a5f9e);
        this.add(seat);
        const cushion = scene.add.rectangle(0, hh * 0.55, W * 0.98, H * 0.4, 0x6f9ce0);
        this.add(cushion, true);
        break;
      }
      case "bookshelf": {
        const body = scene.add.rectangle(0, 0, W, H, 0x7a4f2a).setStrokeStyle(6, 0x533418);
        this.add(body);
        for (let i = -1; i <= 1; i++) {
          const shelf = scene.add.rectangle(0, i * (H * 0.3), W * 0.9, 8, 0x533418);
          this.add(shelf);
        }
        const books = scene.add.rectangle(0, 0, W * 0.84, H * 0.92, 0xcf6a3a).setStrokeStyle(4, 0x9c4a22);
        this.add(books, true);
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
        const slideY = v.openSlide.y;
        scene.tweens.add({
          targets: obj,
          x: (obj as any).x + slideX,
          y: (obj as any).y + slideY,
          alpha: this.spot.kind === "bed" ? 0.2 : 1,
          duration: 280,
          ease: "Quad.out",
          onComplete: done,
        });
      });
    });
  }

  /** Top-center point of the furniture in scene coordinates — where Burhan pops out. */
  popOutPoint() {
    return { x: this.container.x, y: this.container.y - HidingSpotView.H * 0.45 };
  }
}
