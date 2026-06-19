import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, CONFIG, TEXT, COLORS } from "../config";
import { type House, roomById, roomDistance } from "../house/types";
import { HidingSpotView } from "../objects/HidingSpotView";
import { BurhanActor } from "../objects/BurhanActor";
import { DecoyActor, type DecoyKind } from "../objects/DecoyActor";
import { HintSystem } from "../systems/hintSystem";
import { pickRelocationSpot } from "../gen/relocation";
import { bgKey } from "../assets/manifest";
import { playNope, playFound, playGiggle } from "../audio/sfx";

interface SearchData {
  house: House;
  hideRoomId: string;
  hideSpotId: string;
}

/**
 * Seek phase. Shows one room at a time; tap furniture (or Burhan himself) to
 * check it, tap door arrows to move. Layered on top: realistic hiding (Burhan
 * peeks from behind furniture), peek-and-grab timing, a "Call Burhan!" button,
 * decoy hiders, and active relocation with a footprint clue trail.
 */
export class SearchScene extends Phaser.Scene {
  private house!: House;
  // Mutable — Burhan can relocate mid-round.
  private hideRoomId!: string;
  private hideSpotId!: string;

  private currentRoomId!: string;
  private triesLeft = CONFIG.maxTries;
  private roundOver = false;
  private transitioning = false;

  private roomLayer!: Phaser.GameObjects.Container;
  private spotViews: HidingSpotView[] = [];
  private stars: Phaser.GameObjects.GameObject[] = [];
  private hints!: HintSystem;

  private burhan?: BurhanActor;
  private decoys = new Map<string, DecoyKind>(); // spotId -> decoy kind
  private relocations = 0;
  private idleTimer?: Phaser.Time.TimerEvent;
  private peekTimer?: Phaser.Time.TimerEvent;
  private callReadyAt = 0;

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
    this.burhan = undefined;
    this.relocations = 0;
    this.callReadyAt = 0;

    this.assignDecoys();

    this.cameras.main.fadeIn(250, 0, 0, 0);
    this.roomLayer = this.add.container(0, 0);
    this.hints = new HintSystem(this, {
      house: this.house,
      getHideRoomId: () => this.hideRoomId,
      getCurrentRoomId: () => this.currentRoomId,
      getTriesLeft: () => this.triesLeft,
      getBurhan: () => this.burhan,
    });
    this.hints.create();
    this.drawTries();
    this.makeCallButton();
    this.enterRoom(this.currentRoomId);
    this.showPrompt(TEXT.find);
  }

  // ---- decoys ---------------------------------------------------------------
  private assignDecoys() {
    this.decoys.clear();
    const pool = this.house.rooms.flatMap((r) =>
      r.spots.filter((s) => s.id !== this.hideSpotId).map((s) => s.id),
    );
    Phaser.Utils.Array.Shuffle(pool);
    const kinds: DecoyKind[] = ["kid", "pet"];
    const n = Math.min(CONFIG.decoys.count, pool.length, kinds.length);
    for (let i = 0; i < n; i++) this.decoys.set(pool[i], kinds[i]);
  }

  // ---- tries display (stars) ------------------------------------------------
  private useStarImages() {
    return this.textures.exists("star") && this.textures.exists("star-empty");
  }

  private drawTries() {
    const y = 64;
    const gap = 96;
    const startX = GAME_WIDTH / 2 - (gap * (CONFIG.maxTries - 1)) / 2;
    for (let i = 0; i < CONFIG.maxTries; i++) {
      const x = startX + i * gap;
      let obj: Phaser.GameObjects.Image | Phaser.GameObjects.Star;
      if (this.useStarImages()) {
        obj = this.add.image(x, y, "star").setDisplaySize(56, 56);
      } else {
        obj = this.add.star(x, y, 5, 18, 38, 0xffd24a);
        obj.setStrokeStyle(4, 0xc99a1f);
      }
      obj.setDepth(10);
      this.stars.push(obj);
    }
  }

  private updateTries() {
    this.stars.forEach((s, i) => {
      const used = i >= this.triesLeft;
      if (this.useStarImages()) {
        (s as Phaser.GameObjects.Image).setTexture(used ? "star-empty" : "star");
      } else {
        const star = s as Phaser.GameObjects.Star;
        star.setFillStyle(used ? 0x3a3050 : 0xffd24a);
        star.setStrokeStyle(4, used ? 0x2a2440 : 0xc99a1f);
      }
    });
  }

  // ---- room rendering -------------------------------------------------------
  private enterRoom(roomId: string) {
    this.currentRoomId = roomId;
    this.roomLayer.removeAll(true);
    this.spotViews = [];
    this.burhan = undefined;
    this.peekTimer?.remove();
    this.peekTimer = undefined;
    const room = roomById(this.house, roomId);

    // Background (illustrated if present, else tinted rectangle + floor).
    if (this.textures.exists(bgKey(room.type))) {
      const bg = this.add
        .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey(room.type))
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(0);
      this.roomLayer.add(bg);
    } else {
      const bg = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, room.bgColor)
        .setDepth(0);
      const floor = this.add
        .rectangle(
          GAME_WIDTH / 2,
          GAME_HEIGHT - 150,
          GAME_WIDTH,
          300,
          Phaser.Display.Color.IntegerToColor(room.bgColor).darken(25).color,
        )
        .setDepth(1);
      this.roomLayer.add([bg, floor]);
    }

    // Hiding spots (furniture occludes the actors behind it).
    for (const spot of room.spots) {
      const view = new HidingSpotView(this, spot);
      view.container.setDepth(5);
      view.container.on("pointerdown", () => this.checkSpot(view));
      this.roomLayer.add(view.container);
      this.spotViews.push(view);
    }

    this.spawnActorsForRoom();

    // Door arrows.
    for (const door of room.doors) {
      this.roomLayer.add(this.makeDoorArrow(door.side, door.toRoomId));
    }

    this.hints.enterRoom();
    this.resetIdleTimer();
  }

  /** Spawn Burhan (if this is his room) + any decoys hiding in this room. */
  private spawnActorsForRoom() {
    for (const view of this.spotViews) {
      if (view.spot.id === this.hideSpotId && this.currentRoomId === this.hideRoomId) {
        this.spawnBurhanAt(view);
      } else if (this.decoys.has(view.spot.id)) {
        const decoy = new DecoyActor(this, view, this.decoys.get(view.spot.id)!);
        decoy.setDepth(3);
        this.roomLayer.add(decoy.sprite);
        view.container.setData("decoy", decoy);
      }
    }
  }

  private spawnBurhanAt(view: HidingSpotView) {
    const b = new BurhanActor(this, view.spot.x, view.spot.y);
    b.setDepth(3);
    b.hideAt(view, view.spot.kind);
    b.makeTappable(() => this.grabBurhan(view));
    this.roomLayer.add(b.sprite);
    this.burhan = b;
    this.startPeekTimer();
  }

  /** After a same-room relocation, re-hide Burhan at his new spot (no decoy dup). */
  private spawnBurhanHere() {
    if (this.currentRoomId !== this.hideRoomId || this.burhan) return;
    const view = this.spotViews.find((v) => v.spot.id === this.hideSpotId);
    if (view) this.spawnBurhanAt(view);
  }

  private startPeekTimer() {
    this.peekTimer?.remove();
    this.peekTimer = this.time.addEvent({
      delay: CONFIG.peek.intervalMs,
      loop: true,
      callback: () => {
        if (!this.roundOver) this.burhan?.peekOut();
      },
    });
  }

  private makeDoorArrow(side: "left" | "right", toRoomId: string) {
    const x = side === "left" ? 80 : GAME_WIDTH - 80;
    const y = GAME_HEIGHT * 0.45;
    const dir = side === "left" ? -1 : 1;
    const c = this.add.container(x, y).setDepth(7);

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

    if (this.textures.exists("door-arrow")) {
      const img = this.add.image(0, 0, "door-arrow").setFlipX(side === "left");
      img.setDisplaySize(116, 116);
      c.add(img);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.28);
      g.fillCircle(0, 0, 58);
      g.fillStyle(0xffffff, 1);
      if (side === "left") g.fillTriangle(-44, 0, 22, -36, 22, 36);
      else g.fillTriangle(44, 0, -22, -36, -22, 36);
      c.add(g);
    }
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

  // ---- "Call Burhan!" (Marco Polo) -----------------------------------------
  private makeCallButton() {
    const x = GAME_WIDTH - 110;
    const y = GAME_HEIGHT - 86;
    const c = this.add.container(x, y).setDepth(11);
    if (this.textures.exists("call-button")) {
      c.add(this.add.image(0, 0, "call-button").setDisplaySize(120, 120));
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x2a9c50, 1);
      g.fillCircle(0, 6, 54);
      g.fillStyle(COLORS.play, 1);
      g.fillCircle(0, 0, 54);
      c.add(g);
      c.add(
        this.add
          .text(0, 0, TEXT.call, {
            fontFamily: "Arial, sans-serif",
            fontSize: "26px",
            color: "#ffffff",
            fontStyle: "bold",
          })
          .setOrigin(0.5),
      );
    }
    c.setSize(120, 120);
    c.setInteractive({ useHandCursor: true });
    this.tweens.add({
      targets: c,
      scale: { from: 1, to: 1.06 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    c.on("pointerdown", () => this.callBurhan(c));
  }

  private callBurhan(button: Phaser.GameObjects.Container) {
    if (this.roundOver) return;
    if (this.time.now < this.callReadyAt) return;
    this.callReadyAt = this.time.now + CONFIG.call.cooldownMs;
    // Giggle back from his direction; if he's in this room, make him peek.
    playGiggle(0.6, this.hints.panTowardBurhan());
    this.burhan?.peekOut();
    this.tweens.add({
      targets: button,
      scale: { from: 1.2, to: 1 },
      duration: 220,
      ease: "Quad.out",
    });
  }

  // ---- checking a spot ------------------------------------------------------
  private checkSpot(view: HidingSpotView) {
    if (this.roundOver || this.transitioning || view.checked) return;

    // Decoy hider: a happy surprise + a nudge toward Burhan, no penalty.
    if (this.decoys.has(view.spot.id)) {
      void view.open(this).then(() => {
        const decoy = view.container.getData("decoy") as DecoyActor | undefined;
        void decoy?.reveal();
        playGiggle(0.5, this.hints.panTowardBurhan());
        if (CONFIG.decoys.costsTry) {
          this.triesLeft--;
          this.updateTries();
          if (this.triesLeft <= 0) this.lose();
        }
      });
      this.resetIdleTimer();
      return;
    }

    const isCorrect =
      this.currentRoomId === this.hideRoomId && view.spot.id === this.hideSpotId;
    void view.open(this).then(() => {
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
        else this.resetIdleTimer();
      }
    });
  }

  /** Tapping Burhan himself (peek-and-grab) — always a find. */
  private grabBurhan(view: HidingSpotView) {
    if (this.roundOver || this.transitioning) return;
    void view.open(this);
    this.win(view);
  }

  private win(view: HidingSpotView) {
    this.roundOver = true;
    this.stopTimers();
    this.hints.stop();
    playFound();
    const finish = () =>
      this.time.delayedCall(1500, () => this.scene.start("Result", { found: true }));
    if (this.burhan) {
      void this.burhan.popFound().then(finish);
    } else {
      const p = view.popOutPoint();
      const b = this.add.image(p.x, p.y, "burhan").setScale(0).setDepth(50);
      this.tweens.add({ targets: b, scale: 0.5, duration: 380, ease: "Back.out" });
      finish();
    }
  }

  private lose() {
    this.roundOver = true;
    this.stopTimers();
    this.hints.stop();
    // Reveal where Burhan actually ended up: go to his room and open the spot.
    const showReveal = () => {
      this.enterRoom(this.hideRoomId);
      this.stopTimers();
      this.hints.stop();
      const view = this.spotViews.find((v) => v.spot.id === this.hideSpotId)!;
      void view.open(this).then(() => {
        if (this.burhan) {
          void this.burhan.popFound();
        } else {
          const p = view.popOutPoint();
          this.add.image(p.x, p.y, "burhan").setScale(0.5).setDepth(50);
        }
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

  // ---- relocation + clues ---------------------------------------------------
  private resetIdleTimer() {
    if (!CONFIG.relocate.enabled) return;
    this.idleTimer?.remove();
    this.idleTimer = this.time.delayedCall(CONFIG.relocate.afterMs, () =>
      this.relocate(),
    );
  }

  private stopTimers() {
    this.idleTimer?.remove();
    this.idleTimer = undefined;
    this.peekTimer?.remove();
    this.peekTimer = undefined;
  }

  private relocate() {
    if (this.roundOver || this.transitioning) return;
    if (this.relocations >= CONFIG.relocate.maxRelocations) return;
    if (this.triesLeft < CONFIG.relocate.minTriesToRelocate) return;
    const next = pickRelocationSpot(this.house, this.hideRoomId, this.hideSpotId);
    if (!next) return;
    this.relocations++;

    const fromRoom = this.hideRoomId;
    const exitX = this.doorXToward(next.roomId);
    const apply = () => {
      this.hideRoomId = next.roomId;
      this.hideSpotId = next.spotId;
      this.hints.enterRoom(); // refresh warmth tint for the new location
      // If he relocated into the room we're standing in, re-hide him here.
      this.spawnBurhanHere();
      this.resetIdleTimer();
    };

    this.dropFootprints(exitX);
    if (this.currentRoomId === fromRoom && this.burhan) {
      const b = this.burhan;
      this.burhan = undefined;
      this.peekTimer?.remove();
      b.ghostRunTo(exitX, () => {
        b.destroy();
        apply();
      });
    } else {
      apply();
    }
  }

  /** X of the door in the current room that leads closest to `targetRoomId`. */
  private doorXToward(targetRoomId: string): number {
    const room = roomById(this.house, this.currentRoomId);
    let best = Number.POSITIVE_INFINITY;
    let x = GAME_WIDTH / 2;
    for (const door of room.doors) {
      const d = roomDistance(this.house, door.toRoomId, targetRoomId);
      if (d < best) {
        best = d;
        x = door.side === "left" ? 80 : GAME_WIDTH - 80;
      }
    }
    return x;
  }

  /** A short footprint trail from centre toward `towardX`, fading after a while. */
  private dropFootprints(towardX: number) {
    if (!CONFIG.clues.footprints) return;
    const startX = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 120;
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      const fx = Phaser.Math.Linear(startX, towardX, (i + 1) / steps);
      const fy = y + (i % 2 === 0 ? -10 : 10);
      let mark: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
      if (this.textures.exists("footprints")) {
        mark = this.add.image(fx, fy, "footprints").setDisplaySize(40, 40).setDepth(2);
      } else {
        mark = this.add.ellipse(fx, fy, 26, 16, 0x4a3526, 0.5).setDepth(2);
      }
      mark.setAlpha(0);
      this.roomLayer.add(mark);
      this.tweens.add({
        targets: mark,
        alpha: { from: 0, to: 0.85 },
        delay: i * 120,
        duration: 200,
      });
      this.tweens.add({
        targets: mark,
        alpha: 0,
        delay: CONFIG.clues.lingerMs,
        duration: 600,
        onComplete: () => mark.destroy(),
      });
    }
  }

  // ---- light text -----------------------------------------------------------
  private showPrompt(text: string) {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.16, text, {
        fontFamily: "Arial, sans-serif",
        fontSize: "44px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#2a2440",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 24,
      delay: 1600,
      duration: 600,
      onComplete: () => t.destroy(),
    });
  }
}
