import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, TEXT } from "../config";
import { playFound, playGiggle } from "../audio/sfx";

interface ResultData {
  found: boolean;
}

/**
 * End-of-round screen. Joyful celebration when found, a warm "aww" when not —
 * never a harsh lose screen. A big ▶ button starts a fresh round. Wordless.
 */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super("Result");
  }

  create(data: ResultData) {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.fadeIn(250, 0, 0, 0);

    const burhan = this.add
      .image(cx, GAME_HEIGHT * 0.4, "burhan")
      .setScale(0.62);

    this.add
      .text(cx, GAME_HEIGHT * 0.12, data.found ? TEXT.found : TEXT.away, {
        fontFamily: "Arial, sans-serif",
        fontSize: "64px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#2a1c10",
        strokeThickness: 9,
      })
      .setOrigin(0.5);

    if (data.found) {
      playFound();
      this.confetti();
      // Happy bounce.
      this.tweens.add({
        targets: burhan,
        y: burhan.y - 50,
        duration: 320,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      this.tweens.add({
        targets: burhan,
        angle: { from: -6, to: 6 },
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    } else {
      // Gentle waving.
      playGiggle(0.4);
      this.tweens.add({
        targets: burhan,
        angle: { from: -5, to: 5 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    this.makePlayButton();
  }

  private confetti() {
    const colors = [0xff5d5d, 0xffd24a, 0x3fcf6b, 0x4aa3ff, 0xb45dff];
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
      const piece = this.add.rectangle(
        x,
        -20,
        Phaser.Math.Between(10, 20),
        Phaser.Math.Between(14, 26),
        Phaser.Utils.Array.GetRandom(colors),
      );
      piece.angle = Phaser.Math.Between(0, 360);
      this.tweens.add({
        targets: piece,
        y: GAME_HEIGHT + 40,
        angle: piece.angle + Phaser.Math.Between(180, 540),
        duration: Phaser.Math.Between(1600, 3200),
        delay: Phaser.Math.Between(0, 900),
        repeat: -1,
        ease: "Quad.in",
        onRepeat: () => {
          piece.y = -20;
          piece.x = Phaser.Math.Between(40, GAME_WIDTH - 40);
        },
      });
    }
  }

  private makePlayButton() {
    const cx = GAME_WIDTH / 2;
    const btnY = GAME_HEIGHT * 0.8;
    const radius = 88;
    const button = this.add.container(cx, btnY);
    const circle = this.add.graphics();
    circle.fillStyle(COLORS.playDark, 1);
    circle.fillCircle(0, 8, radius);
    circle.fillStyle(COLORS.play, 1);
    circle.fillCircle(0, 0, radius);
    // Centroid-centered play triangle on the same graphics.
    circle.fillStyle(COLORS.text, 1);
    circle.fillTriangle(-30, -44, -30, 44, 60, 0);
    button.add([circle]);
    button.setSize(radius * 2, radius * 2);
    button.setInteractive({ useHandCursor: true });
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
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("Countdown"),
      );
    });
  }
}
