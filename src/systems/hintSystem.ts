import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, CONFIG } from "../config";
import { type House, roomDistance } from "../house/types";
import type { HidingSpotView } from "../objects/HidingSpotView";
import { playGiggle } from "../audio/sfx";

/** Everything the hint system needs to read from the live search round. */
export interface HintContext {
  house: House;
  hideRoomId: string;
  hideSpotId: string;
  getCurrentRoomId: () => string;
  getTriesLeft: () => number;
  getSpotViews: () => HidingSpotView[];
}

/** Warm = close to Burhan, cool = far. A wordless "hot/cold" screen tint. */
function warmth(dist: number): { color: number; alpha: number } {
  if (dist === 0) return { color: 0xff5a2a, alpha: 0.2 };
  if (dist === 1) return { color: 0xff9a4a, alpha: 0.13 };
  if (dist === 2) return { color: 0x6f86b8, alpha: 0.08 };
  return { color: 0x4f74d6, alpha: 0.12 };
}

/**
 * All wordless hints in one place:
 *  - a screen warmth tint that gets warmer the closer the player is,
 *  - proximity giggles panned toward the door that leads to Burhan,
 *  - an occasional peek wiggle on the correct spot when in his room,
 *  - gentle escalation as tries run low so a young child always closes in.
 */
export class HintSystem {
  private timer?: Phaser.Time.TimerEvent;
  private overlay?: Phaser.GameObjects.Rectangle;

  constructor(
    private scene: Phaser.Scene,
    private ctx: HintContext,
  ) {}

  /** Create the (input-transparent) warmth overlay. Call once in create(). */
  create() {
    this.overlay = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0)
      .setDepth(5);
  }

  /** Refresh the warmth tint and (re)start the giggle/peek timer for a room. */
  enterRoom() {
    this.updateWarmth();
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({
      delay: CONFIG.hints.intervalMs,
      loop: true,
      callback: () => this.tick(),
    });
  }

  /** Stop hinting and fade the tint away (round over). */
  stop() {
    this.timer?.remove();
    this.timer = undefined;
    if (this.overlay) {
      this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 300 });
    }
  }

  /** Would moving into `toRoomId` get closer to Burhan? Used to glow a door. */
  leadsCloser(toRoomId: string): boolean {
    const cur = this.distance();
    return (
      Number.isFinite(cur) &&
      roomDistance(this.ctx.house, toRoomId, this.ctx.hideRoomId) < cur
    );
  }

  private distance(): number {
    return roomDistance(
      this.ctx.house,
      this.ctx.getCurrentRoomId(),
      this.ctx.hideRoomId,
    );
  }

  private escalation(): number {
    return (
      1 + (CONFIG.maxTries - this.ctx.getTriesLeft()) * CONFIG.hints.escalationPerTry
    );
  }

  private updateWarmth() {
    if (!this.overlay) return;
    const { color, alpha } = warmth(this.distance());
    this.overlay.setFillStyle(color, 1);
    this.scene.tweens.add({ targets: this.overlay, alpha, duration: 400 });
  }

  private tick() {
    const h = CONFIG.hints;
    const dist = this.distance();
    const esc = this.escalation();

    if (dist === 0) {
      playGiggle(Math.min(0.8, h.inRoomGiggleIntensity * esc), 0);
      if (Math.random() < h.inRoomPeekChance * esc) {
        const correct = this.ctx
          .getSpotViews()
          .find((v) => v.spot.id === this.ctx.hideSpotId);
        correct?.startPeek(this.scene);
      }
    } else if (Number.isFinite(dist)) {
      // Farther rooms giggle less often and more softly.
      if (Math.random() < Math.min(0.7, 0.7 / dist)) {
        const intensity = Math.min(0.6, (h.nearGiggleIntensity / dist) * esc);
        playGiggle(intensity, this.panTowardBurhan());
      }
    }
  }

  /** Stereo pan toward the door that leads closer to Burhan. */
  private panTowardBurhan(): number {
    const room = this.ctx.house.rooms.find(
      (r) => r.id === this.ctx.getCurrentRoomId(),
    );
    if (!room) return 0;
    let best = Number.POSITIVE_INFINITY;
    let bestSide: "left" | "right" = "left";
    for (const door of room.doors) {
      const d = roomDistance(this.ctx.house, door.toRoomId, this.ctx.hideRoomId);
      if (d < best) {
        best = d;
        bestSide = door.side;
      }
    }
    return bestSide === "left" ? -0.8 : 0.8;
  }
}
