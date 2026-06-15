// ---------------------------------------------------------------------------
// Game-wide tunables. Keep gameplay numbers here so they are easy to retune
// after playtesting with Burhan's family — no hunting through scene code.
// ---------------------------------------------------------------------------

/** Logical design resolution (portrait phone). Phaser scales this to fit. */
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

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
