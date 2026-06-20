import Phaser from "phaser";
import type { HidingSpot } from "../house/types";
import { GAME_WIDTH, GAME_HEIGHT, SPOT_VISUAL } from "../config";

/** Draw occluder outlines + anchors for tuning. Flip on to calibrate layouts. */
const DEBUG_SPOTS = false;

/**
 * Visual + interactive representation of one hiding spot. The room's furniture
 * is part of the illustrated background, so this view draws **no furniture of
 * its own**. Instead it cuts the furniture's front out of the background
 * (`spot.occluder`) and lays that copy back down on top — pixel-identical to
 * what's underneath, so it's invisible against the room but occludes whatever is
 * behind it. The hider sits between the background and this occluder, reading as
 * tucked behind the real furniture. When art is missing it falls back to a plain
 * vector box so the game still runs.
 */
export class HidingSpotView {
  readonly spot: HidingSpot;
  readonly container: Phaser.GameObjects.Container;
  checked = false;

  /** Display footprint of the furniture, used by actors for scaling/peeking. */
  displayW = 180;
  displayH = 220;

  constructor(scene: Phaser.Scene, spot: HidingSpot, bgKey?: string) {
    this.spot = spot;
    this.container = scene.add.container(spot.x, spot.y);
    this.draw(scene, bgKey);

    // Hit area covers the furniture footprint (local coords = screen − origin).
    const occ = spot.occluder;
    const hit = occ
      ? new Phaser.Geom.Rectangle(occ.x - spot.x, occ.y - spot.y, occ.w, occ.h)
      : new Phaser.Geom.Rectangle(-this.displayW / 2, -this.displayH, this.displayW, this.displayH);
    this.container.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
    this.container.input!.cursor = "pointer";
  }

  private draw(scene: Phaser.Scene, bgKey?: string) {
    const occ = this.spot.occluder;
    if (occ && bgKey && scene.textures.exists(bgKey)) {
      this.displayW = occ.w;
      this.displayH = occ.h;
      // A full-screen copy of the room, cropped to just this furniture's front.
      // Positioned so its centre lands at screen (640,360) despite the
      // container's spot-relative origin, then cropped in texture space.
      const occluder = scene.add
        .image(GAME_WIDTH / 2 - this.spot.x, GAME_HEIGHT / 2 - this.spot.y, bgKey)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setCrop(occ.x, occ.y, occ.w, occ.h);
      this.container.add(occluder);

      if (DEBUG_SPOTS) {
        const box = scene.add
          .rectangle(occ.x - this.spot.x, occ.y - this.spot.y, occ.w, occ.h)
          .setOrigin(0, 0)
          .setStrokeStyle(3, 0xff00ff)
          .setFillStyle(0xff00ff, 0.12);
        const dot = scene.add.circle(0, 0, 7, 0x00ffff);
        this.container.add([box, dot]);
      }
    } else {
      this.drawVectorFallback(scene);
    }
  }

  /** Plain placeholder furniture for when the illustrated background is absent. */
  private drawVectorFallback(scene: Phaser.Scene) {
    const W = 180;
    const H = 220;
    this.displayW = W;
    this.displayH = H;
    const body = scene.add
      .rectangle(0, 0, W, H, 0x8a5a32)
      .setOrigin(0.5, 1)
      .setStrokeStyle(6, 0x5e3c20);
    this.container.add(body);
  }

  /**
   * Acknowledge a check. There is no door to swing open (the furniture is part
   * of the painted room), so we give the furniture a quick reassuring shake and
   * resolve — the caller then pops the hider out (or wobbles for a miss).
   */
  open(scene: Phaser.Scene): Promise<void> {
    this.checked = true;
    return new Promise((resolve) => {
      scene.tweens.add({
        targets: this.container,
        scaleY: 0.97,
        scaleX: 1.02,
        duration: 90,
        yoyo: true,
        ease: "Quad.out",
        onComplete: () => {
          this.container.setScale(1);
          resolve();
        },
      });
    });
  }

  /** Where the hider's peek lands him relative to the spot's floor point. */
  peekDelta() {
    return this.spot.peek ?? SPOT_VISUAL[this.spot.kind].peek;
  }

  /** The hider's concealed height in design px. */
  hideHeight() {
    return this.spot.hideHeight ?? this.displayH * SPOT_VISUAL[this.spot.kind].scale;
  }

  /** Upper-middle point of the furniture in scene coords — where the hider pops out. */
  popOutPoint() {
    const occ = this.spot.occluder;
    if (occ) return { x: occ.x + occ.w / 2, y: occ.y + 10 };
    return { x: this.container.x, y: this.container.y - this.displayH * 0.6 };
  }
}
