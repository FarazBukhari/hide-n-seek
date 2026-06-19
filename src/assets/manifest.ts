// ---------------------------------------------------------------------------
// Single source of truth for illustrated (AI-generated) art. Code references
// these *keys*, never file paths. The actual PNGs live in `public/sprites/` and
// are produced by `scripts/gen-assets/` (Gemini 2.5 Flash Image + the supplied
// sprite sheet). Until a file exists the game falls back to procedural art, so
// every key here is optional — see PreloadScene + placeholders.ts.
//
// The generator also writes `public/sprites/assets.json`: a list of the keys it
// produced. PreloadScene loads that first and only queues files that are
// actually present, so there are no 404s while art is still being made.
// ---------------------------------------------------------------------------

import type { SpotKind } from "../house/types";

export type ArtType = "image" | "atlas";

export interface ArtEntry {
  key: string;
  type: ArtType;
  /** Path relative to the site root (Vite serves `public/` there). */
  path: string;
  /** Atlas JSON path (for `type: "atlas"`). */
  atlasJson?: string;
}

const DIR = "sprites";

/** Furniture kinds that can have illustrated art (closed body + openable cover). */
export const FURNITURE_KINDS: SpotKind[] = [
  "wardrobe",
  "bed",
  "curtain",
  "toybox",
  "plant",
  "door",
  "sofa",
  "bookshelf",
];

export const ROOM_TYPES = [
  "living",
  "bedroom",
  "kitchen",
  "bathroom",
  "hallway",
] as const;

/** Texture key for a furniture kind's closed body / openable cover. */
export const furnBaseKey = (kind: SpotKind) => `furn-${kind}-base`;
export const furnCoverKey = (kind: SpotKind) => `furn-${kind}-cover`;
/** Texture key for a room-type background. */
export const bgKey = (type: string) => `bg-${type}`;

const img = (key: string, file: string): ArtEntry => ({
  key,
  type: "image",
  path: `${DIR}/${file}.png`,
});

const atlas = (key: string, file: string): ArtEntry => ({
  key,
  type: "atlas",
  path: `${DIR}/${file}.png`,
  atlasJson: `${DIR}/${file}.json`,
});

/** Every illustrated asset the game knows how to use. */
export const ART: ArtEntry[] = [
  // Characters (atlases of named pose frames).
  atlas("burhan", "burhan"),
  atlas("decoy-kid", "decoy-kid"),
  atlas("decoy-pet", "decoy-pet"),

  // Furniture: closed body + openable cover per kind.
  ...FURNITURE_KINDS.map((k) => img(furnBaseKey(k), `furn-${k}-base`)),
  ...FURNITURE_KINDS.map((k) => img(furnCoverKey(k), `furn-${k}-cover`)),

  // Room backgrounds.
  ...ROOM_TYPES.map((t) => img(bgKey(t), `bg-${t}`)),

  // UI + clue art.
  img("play-button", "play-button"),
  img("door-arrow", "door-arrow"),
  img("star", "star"),
  img("star-empty", "star-empty"),
  img("call-button", "call-button"),
  img("footprints", "footprints"),
  img("dropped-toy", "dropped-toy"),
];

/**
 * Burhan pose frames expected in the atlas, and the animations built from them.
 * `single` poses are static frames; `loop` poses cycle their frames. BurhanActor
 * plays these if they exist, otherwise it falls back to tween-only motion.
 */
export const BURHAN_ANIMS = {
  idle: { frames: ["idle"], frameRate: 1, repeat: 0 },
  wave: { frames: ["wave", "idle"], frameRate: 3, repeat: -1 },
  walk: { frames: ["walk-1", "walk-2"], frameRate: 6, repeat: -1 },
  look: { frames: ["look-left", "look-right"], frameRate: 2, repeat: 1 },
  crouch: { frames: ["crouch"], frameRate: 1, repeat: 0 },
  peek: { frames: ["peek"], frameRate: 1, repeat: 0 },
  sneak: { frames: ["sneak", "walk-1"], frameRate: 6, repeat: -1 },
  found: { frames: ["found"], frameRate: 1, repeat: 0 },
  celebrate: { frames: ["celebrate", "found"], frameRate: 4, repeat: -1 },
} as const;

export type BurhanAnim = keyof typeof BURHAN_ANIMS;
