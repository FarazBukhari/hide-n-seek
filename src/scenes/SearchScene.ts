import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, CONFIG } from "../config";
import { type House, roomById } from "../house/types";
import { HidingSpotView } from "../objects/HidingSpotView";
import { HintSystem } from "../systems/hintSystem";
import { playNope, playFound, playGiggle } from "../audio/sfx";

interface SearchData {
  house: House;
  hideRoomId: string;
  hideSpotId: string;
}

/**
 * Seek phase. Shows one room at a time; tap furniture to check it, tap door
 * arrows to move between rooms. A light hint layer (proximity giggles + a peek
 * wiggle on the correct spot) keeps a young child oriented; M4 expands this.
 */
export class SearchScene extends Phaser.Scene {
  private house!: House;
  private hideRoomId!: string;
  private hideSpotId!: string;

  private currentRoomId!: string;
  private triesLeft = CONFIG.maxTries;
  private roundOver = false;
  private transitioning = false;

  private roomLayer!: Phaser.GameObjects.Container;
  private spotViews: HidingSpotView[] = [];
  private stars: Phaser.GameObjects.Star[] = [];
  private hints!: HintSystem;

  constructor() {
    super("Search");
  }

  create(data: SearchData) {
    this.house = data.house;
    this.hideRoomId = data.hideRoomId;
    this.hideSpotId = data.hideSpotId;
    this.currentRoomId = this.house.startRoomId;
    this.triesLeft = CONFIG.maxTries;
    this.roundOver = false;
    this.transitioning = false;
    this.spotViews = [];
    this.stars = [];

    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.roomLayer = this.add.container(0, 0);
    this.hints = new HintSystem(this, {
      house: this.house,
      hideRoomId: this.hideRoomId,
      hideSpotId: this.hideSpotId,
      getCurrentRoomId: () => this.currentRoomId,
      getTriesLeft: () => this.triesLeft,
      getSpotViews: () => this.spotViews,
    });
    this.hints.create();
    this.drawTries();
    this.enterRoom(this.currentRoomId);
  }

  // ---- tries display (stars, no text) ---------------------------------------
  private drawTries() {
    const y = 64;
    const gap = 96;
    const startX = GAME_WIDTH / 2 - (gap * (CONFIG.maxTries - 1)) / 2;
    for (let i = 0; i < CONFIG.maxTries; i++) {
      const star = this.add.star(startX + i * gap, y, 5, 18, 38, 0xffd24a);
      star.setStrokeStyle(4, 0xc99a1f);
      star.setDepth(10); // above the warmth overlay (depth 5)
      this.stars.push(star);
    }
  }

  private updateTries() {
    this.stars.forEach((s, i) => {
      const used = i >= this.triesLeft;
      s.setFillStyle(used ? 0x3a3050 : 0xffd24a);
      s.setStrokeStyle(4, used ? 0x2a2440 : 0xc99a1f);
    });
  }

  // ---- room rendering -------------------------------------------------------
  private enterRoom(roomId: string) {
    this.currentRoomId = roomId;
    this.roomLayer.removeAll(true);
    this.spotViews = [];
    const room = roomById(this.house, roomId);

    // Background + floor.
    const bg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      room.bgColor,
    );
    const floor = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 150,
      GAME_WIDTH,
      300,
      Phaser.Display.Color.IntegerToColor(room.bgColor).darken(25).color,
    );
    this.roomLayer.add([bg, floor]);

    // Hiding spots.
    for (const spot of room.spots) {
      const view = new HidingSpotView(this, spot);
      view.container.on("pointerdown", () => this.checkSpot(view));
      this.roomLayer.add(view.container);
      this.spotViews.push(view);
    }

    // Door arrows.
    for (const door of room.doors) {
      this.roomLayer.add(this.makeDoorArrow(door.side, door.toRoomId));
    }

    this.hints.enterRoom();
  }

  private makeDoorArrow(side: "left" | "right", toRoomId: string) {
    const x = side === "left" ? 80 : GAME_WIDTH - 80;
    const y = GAME_HEIGHT * 0.45;
    const dir = side === "left" ? -1 : 1;
    const c = this.add.container(x, y);

    // Warm glow on the door that leads closer to Burhan (wordless direction).
    if (this.hints.leadsCloser(toRoomId)) {
      const glow = this.add.circle(0, 0, 78, 0xffd24a, 0.0);
      c.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.0, to: 0.55 },
        scale: { from: 0.9, to: 1.15 },
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.28);
    g.fillCircle(0, 0, 58);
    // Arrow drawn with fillTriangle so it sits centred in the circle; centroid
    // at 0,0 (tip = 2x the back offset on the opposite side).
    g.fillStyle(0xffffff, 1);
    if (side === "left") g.fillTriangle(-44, 0, 22, -36, 22, 36);
    else g.fillTriangle(44, 0, -22, -36, -22, 36);
    c.add([g]);
    c.setSize(132, 132);
    c.setInteractive({ useHandCursor: true });
    this.tweens.add({
      targets: c,
      x: x + dir * 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    c.on("pointerdown", () => {
      if (this.roundOver || this.transitioning) return;
      this.transitioning = true;
      this.cameras.main.fadeOut(180, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.cameras.main.fadeIn(180, 0, 0, 0);
        this.enterRoom(toRoomId);
        this.transitioning = false;
      });
    });
    return c;
  }

  // ---- checking a spot ------------------------------------------------------
  private checkSpot(view: HidingSpotView) {
    if (this.roundOver || this.transitioning || view.checked) return;
    const isCorrect =
      this.currentRoomId === this.hideRoomId && view.spot.id === this.hideSpotId;

    void view.open(this).then(() => {
      // The open animation takes a moment; another spot may have ended the
      // round in the meantime, so re-check before acting.
      if (this.roundOver) return;
      if (isCorrect) {
        this.win(view);
      } else {
        playNope();
        this.triesLeft--;
        this.updateTries();
        this.tweens.add({
          targets: view.container,
          y: view.container.y + 8,
          duration: 80,
          yoyo: true,
          repeat: 1,
        });
        if (this.triesLeft <= 0) this.lose();
      }
    });
  }

  private win(view: HidingSpotView) {
    this.roundOver = true;
    this.hints.stop();
    playFound();
    const p = view.popOutPoint();
    const burhan = this.add.image(p.x, p.y, "burhan").setScale(0).setDepth(20);
    this.tweens.add({
      targets: burhan,
      scale: 0.62,
      duration: 380,
      ease: "Back.out",
    });
    this.tweens.add({
      targets: burhan,
      angle: { from: -7, to: 7 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    this.time.delayedCall(1500, () =>
      this.scene.start("Result", { found: true }),
    );
  }

  private lose() {
    this.roundOver = true;
    this.hints.stop();
    // Reveal where Burhan actually was: go to his room and open the spot.
    const showReveal = () => {
      this.enterRoom(this.hideRoomId);
      this.hints.stop();
      const view = this.spotViews.find((v) => v.spot.id === this.hideSpotId)!;
      void view.open(this).then(() => {
        const p = view.popOutPoint();
        const burhan = this.add.image(p.x, p.y, "burhan").setScale(0).setDepth(20);
        this.tweens.add({
          targets: burhan,
          scale: 0.62,
          duration: 380,
          ease: "Back.out",
        });
        playGiggle(0.5);
        this.time.delayedCall(1600, () =>
          this.scene.start("Result", { found: false }),
        );
      });
    };
    if (this.currentRoomId === this.hideRoomId) {
      showReveal();
    } else {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        showReveal();
      });
    }
  }

}
