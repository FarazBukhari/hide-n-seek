import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";
import { unlock } from "../audio/sfx";

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
    const burhan = this.add.image(cx, GAME_HEIGHT * 0.34, "burhan").setScale(0.7);
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
    const btnY = GAME_HEIGHT * 0.76;
    const radius = 92;
    const button = this.add.container(cx, btnY);
    const circle = this.add.graphics();
    circle.fillStyle(COLORS.playDark, 1);
    circle.fillCircle(0, 8, radius);
    circle.fillStyle(COLORS.play, 1);
    circle.fillCircle(0, 0, radius);
    // Play triangle drawn on the same graphics; points chosen so the centroid
    // (and thus the optical centre) sits at 0,0 inside the circle.
    circle.fillStyle(COLORS.text, 1);
    circle.fillTriangle(-28, -42, -28, 42, 56, 0);
    button.add([circle]);
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
      unlock(); // first user gesture: enable Web Audio
      this.tweens.add({
        targets: burhan,
        y: burhan.y - 60,
        duration: 200,
        yoyo: true,
        ease: "Quad.out",
      });
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("Countdown"),
      );
    });
  }
}
