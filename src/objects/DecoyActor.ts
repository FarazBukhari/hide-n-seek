import Phaser from "phaser";
import type { HidingSpotView } from "./HidingSpotView";
import { playGiggle } from "../audio/sfx";

export type DecoyKind = "kid" | "pet";

/**
 * A decoy hider — a sibling or the family pet tucked into a spot. Finding one is
 * a happy surprise (a giggle + a pop), never a harsh penalty, and it nudges the
 * player toward Burhan. Spawned lazily when its room is entered.
 */
export class DecoyActor {
  readonly sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private home = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, view: HidingSpotView, kind: DecoyKind) {
    this.scene = scene;
    const tex = kind === "kid" ? "decoy-kid" : "decoy-pet";
    const footY = view.spot.y + 110;
    this.home = { x: view.spot.x, y: footY + (kind === "pet" ? 18 : -4) };
    this.sprite = scene.add
      .sprite(this.home.x, this.home.y, tex)
      .setOrigin(0.5, 1)
      .setScale(kind === "pet" ? 0.5 : 0.42);
  }

  setDepth(d: number) {
    this.sprite.setDepth(d);
    return this;
  }

  /** Pop out with a giggle. Resolves once the reveal settles. */
  reveal(): Promise<void> {
    this.sprite.setDepth(50); // jump in front of the furniture
    playGiggle(0.45, 0);
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.home.y - 50,
        duration: 300,
        ease: "Back.out",
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.sprite,
            angle: { from: -8, to: 8 },
            duration: 240,
            yoyo: true,
            repeat: 2,
            ease: "Sine.inOut",
            onComplete: () => resolve(),
          });
        },
      });
    });
  }

  destroy() {
    this.sprite.destroy();
  }
}
