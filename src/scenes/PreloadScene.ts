import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

/**
 * Loading scene. No real binary assets yet (placeholder art is code-drawn), so
 * this builds the Burhan texture and shows a wordless spinner briefly before
 * the Title scene. When illustrated sprites arrive they get queued here with
 * this.load.* and the spinner reflects real progress.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
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

    this.buildBurhanTexture();

    this.time.delayedCall(700, () => {
      spinner.destroy();
      this.scene.start("Title");
    });
  }

  /**
   * Draw a cartoon "Burhan" likeness from primitive shapes: tan skin, dark wavy
   * hair with a fringe, big brown eyes, a turquoise tee, and one hand raised in
   * a wave. Rendered to the "burhan" texture used across all scenes. When real
   * illustrated art is supplied, replace this with this.load.atlas(...).
   */
  private buildBurhanTexture() {
    const W = 260;
    const H = 360;
    const g = this.add.graphics();

    const SKIN = 0xeab98f;
    const SKIN_SHADE = 0xd9a376;
    const HAIR = 0x2a1c10;
    const SHIRT = 0x2bbeb6;
    const SHIRT_SHADE = 0x1f9c95;
    const SHORTS = 0x3a4f78;
    const SHOE = 0xf4f4f4;
    const OUTLINE = 0x3a2a1e;
    const EYE_WHITE = 0xffffff;
    const IRIS = 0x5a3a1e;
    const MOUTH = 0x8a3b2a;
    const CHEEK = 0xff9a8a;

    const cx = 130;

    // Thick "limb" stroke with rounded joints.
    const limb = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      width: number,
      color: number,
    ) => {
      g.lineStyle(width, color, 1);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.strokePath();
      g.fillStyle(color, 1);
      g.fillCircle(x1, y1, width / 2);
      g.fillCircle(x2, y2, width / 2);
    };

    // --- legs / shoes (drawn first so the shirt overlaps) ---
    g.fillStyle(SKIN, 1);
    g.fillRoundedRect(96, 318, 30, 34, 10);
    g.fillRoundedRect(134, 318, 30, 34, 10);
    g.fillStyle(SHOE, 1);
    g.fillEllipse(106, 350, 46, 22);
    g.fillEllipse(160, 350, 46, 22);
    g.lineStyle(3, OUTLINE, 0.5);
    g.strokeEllipse(106, 350, 46, 22);
    g.strokeEllipse(160, 350, 46, 22);

    // --- shorts ---
    g.fillStyle(SHORTS, 1);
    g.fillRoundedRect(60, 300, 140, 38, 14);

    // --- shirt ---
    g.fillStyle(SHIRT, 1);
    g.fillRoundedRect(44, 212, 172, 110, 40);
    g.fillStyle(SHIRT_SHADE, 1);
    g.fillRoundedRect(44, 286, 172, 36, 18); // lower shade
    g.lineStyle(4, OUTLINE, 0.55);
    g.strokeRoundedRect(44, 212, 172, 110, 40);

    // --- arms: left hanging, right raised in a wave ---
    limb(70, 224, 62, 286, 30, SHIRT); // left sleeve
    limb(62, 286, 58, 314, 26, SKIN); // left forearm
    g.fillStyle(SKIN, 1);
    g.fillCircle(58, 316, 16); // left hand
    limb(190, 222, 214, 184, 30, SHIRT); // right sleeve (up)
    limb(214, 184, 232, 146, 26, SKIN); // right forearm (up)
    g.fillStyle(SKIN, 1);
    g.fillCircle(234, 142, 17); // right hand (waving)

    // --- neck + ears + face ---
    g.fillStyle(SKIN, 1);
    g.fillRoundedRect(cx - 13, 198, 26, 26, 8);
    g.fillCircle(56, 136, 17);
    g.fillCircle(204, 136, 17);
    g.fillStyle(SKIN, 1);
    g.fillEllipse(cx, 132, 150, 168);
    g.lineStyle(4, OUTLINE, 0.5);
    g.strokeEllipse(cx, 132, 150, 168);

    // --- cheeks ---
    g.fillStyle(CHEEK, 0.45);
    g.fillCircle(86, 172, 14);
    g.fillCircle(174, 172, 14);

    // --- hair: scalp + wavy fringe (one filled polygon) ---
    g.fillStyle(HAIR, 1);
    g.fillPoints(
      [
        { x: 52, y: 124 },
        { x: 58, y: 70 },
        { x: 92, y: 38 },
        { x: cx, y: 30 },
        { x: 168, y: 38 },
        { x: 202, y: 70 },
        { x: 208, y: 124 },
        // wavy fringe (right -> left)
        { x: 186, y: 112 },
        { x: 166, y: 130 },
        { x: 146, y: 110 },
        { x: cx, y: 132 },
        { x: 114, y: 110 },
        { x: 94, y: 130 },
        { x: 74, y: 112 },
      ],
      true,
      true,
    );
    // a couple of side sweeps for a tousled look
    g.fillCircle(58, 110, 16);
    g.fillCircle(202, 110, 16);

    // --- eyebrows ---
    g.fillStyle(HAIR, 1);
    g.fillRoundedRect(84, 126, 40, 9, 4);
    g.fillRoundedRect(136, 126, 40, 9, 4);

    // --- eyes ---
    const eye = (ex: number) => {
      g.fillStyle(EYE_WHITE, 1);
      g.fillEllipse(ex, 150, 40, 46);
      g.lineStyle(3, OUTLINE, 0.4);
      g.strokeEllipse(ex, 150, 40, 46);
      g.fillStyle(IRIS, 1);
      g.fillCircle(ex, 152, 15);
      g.fillStyle(0x000000, 1);
      g.fillCircle(ex, 152, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex - 4, 148, 4);
    };
    eye(104);
    eye(156);

    // --- nose + mouth ---
    g.fillStyle(SKIN_SHADE, 1);
    g.fillEllipse(cx, 172, 16, 11);
    g.lineStyle(7, MOUTH, 1);
    g.beginPath();
    g.arc(cx, 188, 26, 0.15 * Math.PI, 0.85 * Math.PI, false);
    g.strokePath();

    g.generateTexture("burhan", W, H);
    g.destroy();
  }
}
