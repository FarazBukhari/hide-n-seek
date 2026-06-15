import Phaser from "phaser";
import type { HidingSpot } from "../house/types";

/**
 * Visual + interactive representation of one hiding spot. Each furniture kind
 * draws differently and has a "cover" (doors / curtains / lid / skirt / leaves)
 * that animates open when checked. A `peek` wiggle is used for the wordless
 * "micro-tell" hint (light in M2, expanded in M4).
 */
export class HidingSpotView {
  readonly spot: HidingSpot;
  readonly container: Phaser.GameObjects.Container;
  checked = false;

  private cover: Phaser.GameObjects.GameObject[] = [];
  private peekTween?: Phaser.Tweens.Tween;

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
    const hw = W / 2;
    const hh = H / 2;

    // Dark "inside" revealed when opened — sits behind the cover.
    const inside = scene.add.rectangle(0, 6, W * 0.82, H * 0.82, 0x241a14);
    this.add(inside);

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
        // Skirt covers the under-bed gap; lifts to reveal.
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
    }
  }

  /** Subtle wiggle hint that Burhan is in here. */
  startPeek(scene: Phaser.Scene) {
    if (this.peekTween || this.checked) return;
    this.peekTween = scene.tweens.add({
      targets: this.container,
      angle: { from: -2.5, to: 2.5 },
      duration: 140,
      yoyo: true,
      repeat: 3,
      ease: "Sine.inOut",
      onComplete: () => {
        this.container.angle = 0;
        this.peekTween = undefined;
      },
    });
  }

  /**
   * Play the open animation. Returns a promise that resolves once the reveal is
   * complete, so the caller can show Burhan / move on.
   */
  open(scene: Phaser.Scene): Promise<void> {
    this.checked = true;
    this.peekTween?.stop();
    this.container.angle = 0;
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
      targets.forEach((t, i) => {
        const obj = t as Phaser.GameObjects.Components.Transform &
          Phaser.GameObjects.Components.Alpha &
          Phaser.GameObjects.GameObject;
        const goLeft = i === 0 && targets.length > 1;
        const slideX =
          this.spot.kind === "wardrobe" || this.spot.kind === "curtain"
            ? (goLeft ? -120 : 120)
            : 0;
        const slideY =
          this.spot.kind === "toybox"
            ? -120
            : this.spot.kind === "bed" || this.spot.kind === "plant"
              ? 40
              : 0;
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
