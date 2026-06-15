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
