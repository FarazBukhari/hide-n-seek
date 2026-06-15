import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CONFIG } from "../config";
import { buildHouse } from "../house/sampleHouse";
import { playTick, playShhh, playGiggle } from "../audio/sfx";

/**
 * "Close your eyes" phase. Dark screen, a big numeral and a shrinking ring count
 * down from CONFIG.countdownSeconds. Meanwhile Burhan picks a random room + spot.
 * Numbers AND the ring are shown so a non-reader can still track the time.
 */
export class CountdownScene extends Phaser.Scene {
  constructor() {
    super("Countdown");
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor(0x0a0612);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    playShhh();
    this.time.delayedCall(350, () => playGiggle(0.7));

    const total = CONFIG.countdownSeconds;
    let remaining = total;

    const ringRadius = 220;
    const ring = this.add.graphics({ x: cx, y: cy });
    const numeral = this.add
      .text(cx, cy, String(remaining), {
        fontFamily: "Arial, sans-serif",
        fontSize: "200px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const drawRing = (frac: number) => {
      ring.clear();
      ring.lineStyle(20, 0x33264d, 1);
      ring.strokeCircle(0, 0, ringRadius);
      ring.lineStyle(20, COLORS.play, 1);
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

    // Smoothly shrink the ring over the whole countdown.
    this.tweens.addCounter({
      from: 1,
      to: 0,
      duration: total * 1000,
      onUpdate: (t) => drawRing(t.getValue() ?? 0),
    });

    // Tick + numeral once per second.
    playTick();
    this.time.addEvent({
      delay: 1000,
      repeat: total - 1,
      callback: () => {
        remaining--;
        numeral.setText(String(Math.max(remaining, 0)));
        this.tweens.add({
          targets: numeral,
          scale: { from: 1.25, to: 1 },
          duration: 250,
          ease: "Quad.out",
        });
        playTick();
      },
    });

    // Pick Burhan's hiding place while eyes are closed.
    const house = buildHouse();
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
}
