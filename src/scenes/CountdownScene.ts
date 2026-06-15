import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CONFIG } from "../config";
import { generateHouse } from "../gen/houseGenerator";
import { playTick, playShhh, playGiggle } from "../audio/sfx";

/**
 * "Close your eyes" phase. A numeral + shrinking ring count down from
 * CONFIG.countdownSeconds (numbers AND ring so a non-reader can track time).
 * Burhan walks on, looks around, and dashes off-screen to hide — he runs off
 * the edge, so the real hiding spot is never revealed. Meanwhile the game
 * secretly picks his room + spot.
 */
export class CountdownScene extends Phaser.Scene {
  constructor() {
    super("Countdown");
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const ringCy = GAME_HEIGHT * 0.32;

    this.cameras.main.setBackgroundColor(0x0a0612);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const total = CONFIG.countdownSeconds;
    let remaining = total;

    // --- timer ring + numeral ---
    const ringRadius = 140;
    const ring = this.add.graphics({ x: cx, y: ringCy });
    const numeral = this.add
      .text(cx, ringCy, String(remaining), {
        fontFamily: "Arial, sans-serif",
        fontSize: "120px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const drawRing = (frac: number) => {
      ring.clear();
      ring.lineStyle(18, 0x33264d, 1);
      ring.strokeCircle(0, 0, ringRadius);
      ring.lineStyle(18, COLORS.play, 1);
      ring.beginPath();
      ring.arc(
        0,
        0,
        ringRadius,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * frac,
        false,
      );
      ring.strokePath();
    };
    drawRing(1);
    this.tweens.addCounter({
      from: 1,
      to: 0,
      duration: total * 1000,
      onUpdate: (t) => drawRing(t.getValue() ?? 0),
    });

    playTick();
    this.time.addEvent({
      delay: 1000,
      repeat: total - 1,
      callback: () => {
        remaining--;
        numeral.setText(String(Math.max(remaining, 0)));
        this.tweens.add({
          targets: numeral,
          scale: { from: 1.2, to: 1 },
          duration: 250,
          ease: "Quad.out",
        });
        playTick();
      },
    });

    // --- Burhan: walk in, look around, run off to hide ---
    this.playBurhanHideSequence();

    // --- pick the hiding place while "eyes are closed" ---
    const house = generateHouse();
    const roomsWithSpots = house.rooms.filter((r) => r.spots.length > 0);
    const room = Phaser.Utils.Array.GetRandom(roomsWithSpots);
    const spot = Phaser.Utils.Array.GetRandom(room.spots);

    this.time.delayedCall(total * 1000 + 200, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Search", {
          house,
          hideRoomId: room.id,
          hideSpotId: spot.id,
        });
      });
    });
  }

  private playBurhanHideSequence() {
    const cx = GAME_WIDTH / 2;
    const floorY = GAME_HEIGHT * 0.72;

    const burhan = this.add.image(-160, floorY, "burhan").setScale(0.7);

    // Continuous little walk/run bob; sped up when he bolts, stopped when gone.
    const bob = this.tweens.add({
      targets: burhan,
      y: floorY - 18,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // 1) Walk in to centre.
    this.tweens.add({
      targets: burhan,
      x: cx,
      duration: 1600,
      ease: "Sine.inOut",
    });
    this.time.delayedCall(400, () => playGiggle(0.4));

    // 2) Look around (tilt left/right as if scoping out a spot).
    this.time.delayedCall(1700, () => {
      this.tweens.add({
        targets: burhan,
        angle: { from: -12, to: 12 },
        duration: 380,
        yoyo: true,
        repeat: 1,
        ease: "Sine.inOut",
        onComplete: () => {
          burhan.angle = 0;
        },
      });
    });

    // 3) Bolt off-screen to hide.
    this.time.delayedCall(3300, () => {
      playShhh();
      bob.timeScale = 2.4;
      burhan.setFlip(false, false);
      this.tweens.add({
        targets: burhan,
        angle: 16,
        duration: 150,
        ease: "Quad.out",
      });
      this.tweens.add({
        targets: burhan,
        x: GAME_WIDTH + 220,
        scale: 0.55,
        duration: 1100,
        ease: "Quad.in",
        onComplete: () => {
          bob.stop();
          burhan.setVisible(false);
          playGiggle(0.5); // a last giggle once he's hidden
        },
      });
    });
  }
}
