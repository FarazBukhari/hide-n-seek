import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

/**
 * Title screen: a waving Burhan and a big pulsing ▶ play button. Fully wordless.
 * In M2 the play button will start the "close your eyes" Countdown scene; for
 * now (M1 skeleton) it plays a happy jump so the deploy pipeline is verifiable
 * on a phone with real touch feedback.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    const cx = GAME_WIDTH / 2;

    // Waving Burhan.
    const burhan = this.add.image(cx, GAME_HEIGHT * 0.4, "burhan");
    burhan.setOrigin(0.5, 0.5);
    this.tweens.add({
      targets: burhan,
      angle: { from: -6, to: 6 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Play button: green circle + white triangle.
    const btnY = GAME_HEIGHT * 0.74;
    const radius = 110;
    const button = this.add.container(cx, btnY);
    const circle = this.add.graphics();
    circle.fillStyle(COLORS.playDark, 1);
    circle.fillCircle(0, 8, radius);
    circle.fillStyle(COLORS.play, 1);
    circle.fillCircle(0, 0, radius);
    const triangle = this.add.triangle(
      14,
      0,
      -40,
      -55,
      -40,
      55,
      55,
      0,
      COLORS.text,
    );
    button.add([circle, triangle]);
    button.setSize(radius * 2, radius * 2);
    button.setInteractive({ useHandCursor: true });

    // Gentle pulse so a child's eye is drawn to it.
    this.tweens.add({
      targets: button,
      scale: { from: 1, to: 1.08 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    button.on("pointerdown", () => {
      button.disableInteractive();
      this.tweens.add({
        targets: burhan,
        y: burhan.y - 60,
        duration: 220,
        yoyo: true,
        ease: "Quad.out",
        onComplete: () => button.setInteractive({ useHandCursor: true }),
      });
      // M2: this.scene.start("Countdown");
    });
  }
}
