// ---------------------------------------------------------------------------
// Game-wide tunables. Keep gameplay numbers here so they are easy to retune
// after playtesting with Burhan's family — no hunting through scene code.
// ---------------------------------------------------------------------------

import type { SpotKind } from "./house/types";

/** Logical design resolution (landscape phone). Phaser scales this to fit. */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Locked decisions (see PLAN.md). */
export const CONFIG = {
  /** Wrong checks allowed before the round ends. */
  maxTries: 5,
  /** "Close your eyes" countdown length, in seconds. */
  countdownSeconds: 10,
  /** Difficulty preset: gentle = obvious spots + strong escalating hints. */
  difficulty: "gentle" as "gentle" | "harder",

  /**
   * Wordless hint tuning. Kept deliberately subtle — a hint fires only every
   * few seconds and often only by chance, so it nudges rather than gives it
   * away. Turn these up for an easier game, down for harder.
   */
  hints: {
    /** Seconds between hint opportunities (each may or may not fire). */
    intervalMs: 4200,
    /** Giggle loudness (0..1) when the player is in Burhan's room. */
    inRoomGiggleIntensity: 0.4,
    /** Chance (0..1) the correct spot does a peek wiggle, per opportunity. */
    inRoomPeekChance: 0.3,
    /** Base giggle loudness (0..1) for adjacent rooms, divided by distance. */
    nearGiggleIntensity: 0.22,
    /** How much each lost try strengthens hints (gentle escalation). */
    escalationPerTry: 0.07,
  },

  /**
   * Relocation / "active sneaking": if the player dawdles, Burhan tip-toes to a
   * new spot (a translucent ghost run, leaving footprints). Kept gentle — only
   * while the child still has plenty of tries, and capped per round.
   */
  relocate: {
    enabled: true,
    /** Idle time (no find, no room change) before Burhan sneaks away. */
    afterMs: 18000,
    /** Hard cap on relocations per round. */
    maxRelocations: 2,
    /** Only relocate while the child is doing fine (tries still high). */
    minTriesToRelocate: 3,
    /** Opacity of the sneaking "ghost" Burhan as he runs to the new spot. */
    ghostAlpha: 0.42,
  },

  /** Peek-and-grab timing: Burhan periodically peeks out of his spot. */
  peek: {
    /** Time between peek opportunities while you are in his room. */
    intervalMs: 5000,
    /** How long he stays leaned out (tap him in this window for a bonus). */
    windowMs: 1400,
  },

  /** "Call Burhan!" (Marco-Polo) button. */
  call: {
    /** Min time between calls so a child can't spam it. */
    cooldownMs: 2500,
  },

  /** Decoy hiders (a sibling + a pet) tucked into other spots. */
  decoys: {
    /** How many decoys to place per round (clamped to available spots). */
    count: 2,
    /** Whether finding a decoy costs a try (false = gentle, just a giggle). */
    costsTry: false,
  },

  /** Clue trail dropped when Burhan sneaks to a new spot. */
  clues: {
    footprints: true,
    /** How long footprints / the lingering tell stay on screen. */
    lingerMs: 6000,
  },
} as const;

/**
 * Per-furniture-kind placement of the hidden Burhan. `hide` offsets him from the
 * spot centre (tucked behind the furniture); `peek` is the extra delta he slides
 * by when peeking out so an edge becomes visible. Tuned so each kind reads as a
 * believable hiding pose. `openSlide` tells `HidingSpotView.open()` which way the
 * cover moves to reveal him.
 */
export interface SpotVisual {
  /** Offset of the hidden Burhan from the spot's floor point (px). */
  hide: { dx: number; dy: number };
  /** Extra delta he slides by when peeking so an edge becomes visible (px). */
  peek: { dx: number; dy: number };
  /** Burhan's hidden height as a fraction of the furniture's display height. */
  scale: number;
  /** Direction the cover moves to reveal him. */
  openSlide: { x: number; y: number };
}

export const SPOT_VISUAL: Record<SpotKind, SpotVisual> = {
  wardrobe: { hide: { dx: 0, dy: 0 }, peek: { dx: -100, dy: 0 }, scale: 0.82, openSlide: { x: 130, y: 0 } },
  bed: { hide: { dx: 40, dy: 0 }, peek: { dx: 95, dy: 0 }, scale: 0.6, openSlide: { x: 0, y: 70 } },
  curtain: { hide: { dx: -55, dy: 0 }, peek: { dx: -100, dy: 0 }, scale: 0.8, openSlide: { x: 130, y: 0 } },
  toybox: { hide: { dx: 0, dy: 0 }, peek: { dx: 0, dy: -85 }, scale: 0.66, openSlide: { x: 0, y: -130 } },
  plant: { hide: { dx: 0, dy: 0 }, peek: { dx: -85, dy: 0 }, scale: 0.78, openSlide: { x: 0, y: 70 } },
  door: { hide: { dx: -55, dy: 0 }, peek: { dx: -100, dy: 0 }, scale: 0.85, openSlide: { x: 130, y: 0 } },
  sofa: { hide: { dx: 0, dy: 0 }, peek: { dx: 0, dy: -70 }, scale: 0.66, openSlide: { x: 0, y: 70 } },
  bookshelf: { hide: { dx: -55, dy: 0 }, peek: { dx: -95, dy: 0 }, scale: 0.82, openSlide: { x: 130, y: 0 } },
};

/** Minimal on-screen text (the game is no longer fully wordless). */
export const TEXT = {
  title: "Where's Burhan?",
  play: "PLAY",
  closeEyes: "Close your eyes!",
  find: "Find Burhan!",
  call: "Call!",
  found: "Found him!",
  away: "He got away!",
} as const;

/** Shared palette so placeholder art and real art stay visually consistent. */
export const COLORS = {
  bgDark: 0x1a1030,
  play: 0x3fcf6b,
  playDark: 0x2a9c50,
  burhanSkin: 0xf4c79a,
  burhanShirt: 0x4aa3ff,
  text: 0xffffff,
} as const;
