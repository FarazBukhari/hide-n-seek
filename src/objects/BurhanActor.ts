import Phaser from "phaser";
import { SPOT_VISUAL, CONFIG } from "../config";
import type { SpotKind } from "../house/types";
import type { HidingSpotView } from "./HidingSpotView";
import type { BurhanAnim } from "../assets/manifest";
import { playGiggle } from "../audio/sfx";

/**
 * The live, animated Burhan. Wraps a single sprite and drives all of his
 * in-game behaviour with tweens (so it works on the procedural placeholder)
 * while also playing atlas animations when the illustrated art is present.
 *
 * Used for: hiding behind furniture (realistic hiding), peeking out (the hint /
 * peek-and-grab), the surprised "found!" pop, and the translucent sneak run
 * when he relocates.
 */
export class BurhanActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private home = { x: 0, y: 0 };
  private kind: SpotKind = "wardrobe";
  private peeking = false;
  private peekTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.add.sprite(x, y, "burhan").setOrigin(0.5, 1);
    this.play("idle");
  }

  // --- plumbing -------------------------------------------------------------
  setDepth(d: number) {
    this.sprite.setDepth(d);
    return this;
  }

  setScale(s: number) {
    this.sprite.setScale(s);
    return this;
  }

  setPosition(x: number, y: number) {
    this.sprite.setPosition(x, y);
    return this;
  }

  /** Play an atlas animation if it exists; otherwise stay on the current frame. */
  play(anim: BurhanAnim) {
    const key = `burhan-${anim}`;
    if (this.scene.anims.exists(key)) this.sprite.play(key, true);
  }

  destroy() {
    this.peekTween?.stop();
    this.sprite.destroy();
  }

  // --- hiding ---------------------------------------------------------------
  /** Tuck Burhan behind a hiding spot, mostly occluded, in a believable pose. */
  hideAt(view: HidingSpotView, kind: SpotKind) {
    this.kind = kind;
    const v = SPOT_VISUAL[kind];
    // Stand on the furniture's floor line, nudged by the per-kind hide offset.
    const footY = view.spot.y + 110;
    this.home = { x: view.spot.x + v.hide.dx, y: footY + v.hide.dy };
    this.sprite.setPosition(this.home.x, this.home.y);
    this.sprite.setScale(v.scale);
    this.sprite.setAlpha(1);
    this.sprite.setFlipX(v.peek.dx > 0);
    this.play("crouch");
  }

  /** Re-home to a spot without animating (used after a relocation). */
  moveHomeTo(view: HidingSpotView, kind: SpotKind) {
    this.hideAt(view, kind);
  }

  // --- peeking (hint + peek-and-grab) --------------------------------------
  /**
   * Lean out so an edge of Burhan becomes visible, giggle, then duck back. The
   * actor is tappable throughout (peek-and-grab); catching him mid-peek is the
   * `windowMs` reward window. Returns immediately; safe to call repeatedly.
   */
  peekOut() {
    if (this.peeking) return;
    this.peeking = true;
    const v = SPOT_VISUAL[this.kind];
    this.play("peek");
    playGiggle(0.5);
    this.peekTween = this.scene.tweens.add({
      targets: this.sprite,
      x: this.home.x + v.peek.dx,
      y: this.home.y + v.peek.dy,
      duration: 240,
      ease: "Back.out",
      hold: CONFIG.peek.windowMs,
      yoyo: true,
      onComplete: () => {
        this.sprite.setPosition(this.home.x, this.home.y);
        this.peeking = false;
        this.peekTween = undefined;
        this.play("crouch");
      },
    });
  }

  /** True while leaned out — a tap during this window is a "gotcha" find. */
  get isPeeking() {
    return this.peeking;
  }

  // --- found ----------------------------------------------------------------
  /** Surprised pop-up + happy wobble when discovered. */
  popFound(): Promise<void> {
    this.peekTween?.stop();
    this.peeking = false;
    this.play("found");
    this.sprite.setDepth(50); // jump in front of the furniture
    this.sprite.setPosition(this.home.x, this.home.y);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.home.y - 70,
        duration: 320,
        ease: "Back.out",
        onComplete: () => {
          this.play("celebrate");
          this.scene.tweens.add({
            targets: this.sprite,
            angle: { from: -7, to: 7 },
            duration: 260,
            yoyo: true,
            repeat: -1,
            ease: "Sine.inOut",
          });
          resolve();
        },
      });
    });
  }

  // --- sneaking (relocation) ------------------------------------------------
  /** Translucent tip-toe run toward a point (a door), then resolve. */
  ghostRunTo(targetX: number, onArrive: () => void) {
    this.peekTween?.stop();
    this.peeking = false;
    this.sprite.setAlpha(CONFIG.relocate.ghostAlpha);
    this.sprite.setFlipX(targetX > this.sprite.x);
    this.play("sneak");
    const dist = Math.abs(targetX - this.sprite.x);
    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: this.sprite.y - 6,
      duration: Phaser.Math.Clamp(dist * 1.6, 600, 1400),
      ease: "Sine.inOut",
      onComplete: () => {
        this.sprite.setVisible(false);
        onArrive();
      },
    });
  }

  // --- input ----------------------------------------------------------------
  /** Make the (visible part of the) sprite tappable — routes to the find logic. */
  makeTappable(onTap: () => void) {
    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on("pointerdown", onTap);
  }
}
