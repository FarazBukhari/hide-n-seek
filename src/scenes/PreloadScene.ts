import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

/**
 * Loading scene. No real binary assets yet (M1 uses code-generated placeholder
 * art), so this builds the placeholder textures and shows a wordless spinner
 * briefly before handing off to the Title scene. When real sprites/audio land,
 * they get queued here with this.load.* and the spinner reflects real progress.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    // Wordless spinner (a rotating arc) centered on screen.
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const spinner = this.add.graphics({ x: cx, y: cy });
    const drawArc = (angle: number) => {
      spinner.clear();
      spinner.lineStyle(14, COLORS.play, 1);
      spinner.beginPath();
      spinner.arc(0, 0, 60, angle, angle + Math.PI * 1.4, false);
      spinner.strokePath();
    };
    drawArc(0);
    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 900,
      repeat: -1,
      onUpdate: (t) => drawArc(t.getValue() ?? 0),
    });

    this.buildPlaceholderArt();

    // No real files to load yet — hold the spinner briefly so the boot feels
    // intentional, then continue.
    this.load.once("complete", () => {});
    this.time.delayedCall(700, () => {
      spinner.destroy();
      this.scene.start("Title");
    });
  }

  /** Generate a placeholder cartoon "Burhan" texture from primitive shapes. */
  private buildPlaceholderArt() {
    const w = 220;
    const h = 300;
    const g = this.add.graphics();

    // Body / shirt
    g.fillStyle(COLORS.burhanShirt, 1);
    g.fillRoundedRect(w * 0.2, h * 0.45, w * 0.6, h * 0.5, 36);
    // Head
    g.fillStyle(COLORS.burhanSkin, 1);
    g.fillCircle(w / 2, h * 0.3, h * 0.22);
    // Hair
    g.fillStyle(0x3a2a1a, 1);
    g.fillEllipse(w / 2, h * 0.18, w * 0.5, h * 0.18);
    // Eyes
    g.fillStyle(0x222222, 1);
    g.fillCircle(w / 2 - 28, h * 0.3, 12);
    g.fillCircle(w / 2 + 28, h * 0.3, 12);
    // Smile
    g.lineStyle(8, 0x9c4a2a, 1);
    g.beginPath();
    g.arc(w / 2, h * 0.36, 36, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();

    g.generateTexture("burhan", w, h);
    g.destroy();
  }
}
