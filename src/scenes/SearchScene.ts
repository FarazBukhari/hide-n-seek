import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, CONFIG } from "../config";
import {
  type House,
  type Room,
  roomById,
  roomDistance,
} from "../house/types";
import { HidingSpotView } from "../objects/HidingSpotView";
import { playGiggle, playNope, playFound } from "../audio/sfx";

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
  private hintTimer?: Phaser.Time.TimerEvent;

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

    this.scheduleHints();
  }

  private makeDoorArrow(side: "left" | "right", toRoomId: string) {
    const x = side === "left" ? 80 : GAME_WIDTH - 80;
    const y = GAME_HEIGHT * 0.45;
    const dir = side === "left" ? -1 : 1;
    const c = this.add.container(x, y);
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
    this.hintTimer?.remove();
    playFound();
    const p = view.popOutPoint();
    const burhan = this.add.image(p.x, p.y, "burhan").setScale(0);
    this.roomLayer.add(burhan);
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
    this.hintTimer?.remove();
    // Reveal where Burhan actually was: go to his room and open the spot.
    const showReveal = () => {
      this.enterRoom(this.hideRoomId);
      const view = this.spotViews.find((v) => v.spot.id === this.hideSpotId)!;
      void view.open(this).then(() => {
        const p = view.popOutPoint();
        const burhan = this.add.image(p.x, p.y, "burhan").setScale(0);
        this.roomLayer.add(burhan);
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

  // ---- hints (subtle; M4 expands) -------------------------------------------
  private scheduleHints() {
    this.hintTimer?.remove();
    // Don't re-arm once the round is over (e.g. the lose() reveal re-enters a
    // room).
    if (this.roundOver) return;
    this.hintTimer = this.time.addEvent({
      delay: CONFIG.hints.intervalMs,
      loop: true,
      callback: () => this.emitHint(),
    });
  }

  private emitHint() {
    if (this.roundOver) return;
    const h = CONFIG.hints;
    const room = roomById(this.house, this.currentRoomId);
    const dist = roomDistance(this.house, this.currentRoomId, this.hideRoomId);

    // Gentle escalation as tries run low so a young child still closes in.
    const escalation = 1 + (CONFIG.maxTries - this.triesLeft) * h.escalationPerTry;

    if (dist === 0) {
      playGiggle(Math.min(0.8, h.inRoomGiggleIntensity * escalation), 0);
      // Only sometimes show the peek, so it's a treat rather than a giveaway.
      if (Math.random() < h.inRoomPeekChance * escalation) {
        const correct = this.spotViews.find((v) => v.spot.id === this.hideSpotId);
        correct?.startPeek(this);
      }
    } else if (Number.isFinite(dist)) {
      // Farther rooms giggle less often and more softly.
      if (Math.random() < Math.min(0.7, 0.7 / dist)) {
        const intensity = Math.min(0.6, (h.nearGiggleIntensity / dist) * escalation);
        playGiggle(intensity, this.panTowardBurhan(room));
      }
    }
  }

  /** Stereo pan toward the door that leads closer to Burhan. */
  private panTowardBurhan(room: Room): number {
    let best = -1;
    let bestSide: "left" | "right" = "left";
    for (const door of room.doors) {
      const d = roomDistance(this.house, door.toRoomId, this.hideRoomId);
      if (best < 0 || d < best) {
        best = d;
        bestSide = door.side;
      }
    }
    return bestSide === "left" ? -0.8 : 0.8;
  }
}
