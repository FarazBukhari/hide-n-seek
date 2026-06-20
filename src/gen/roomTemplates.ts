import type { Room, HidingSpot } from "../house/types";

// ---------------------------------------------------------------------------
// Hand-authored room layouts. Each room *type* maps to a single illustrated
// background whose furniture is already painted in. Rather than stamping extra
// furniture sprites on top (which never matched), we author one hiding spot per
// painted piece: where the hider stands (x,y = feet on the floor), the
// furniture-front rectangle to cut from the background and draw *over* them
// (`occluder`, in 1280x720 screen coords), which way they lean to peek, and how
// tall they read while concealed. The result is that the room's own furniture
// hides the children — so everything is one cohesive illustration.
//
// Coordinates are tuned against the 1280x720 backgrounds in public/sprites.
// ---------------------------------------------------------------------------

export type RoomType = Room["type"];

/** An authored hiding spot, minus the per-room unique id the generator adds. */
export type SpotLayout = Omit<HidingSpot, "id">;

export interface RoomLayout {
  type: RoomType;
  /** Fallback tints (used only if the illustrated background is missing). */
  bgColors: number[];
  spots: SpotLayout[];
}

export const ROOM_TYPES: RoomType[] = [
  "living",
  "bedroom",
  "kitchen",
  "bathroom",
  "hallway",
];

export const ROOM_LAYOUTS: Record<RoomType, RoomLayout> = {
  // Cozy sunset living room: brick fireplace (L), potted plant on a side table
  // (C), tall bookshelf (R), curtained window (C).
  living: {
    type: "living",
    bgColors: [0xf4d9a6, 0xf0cf99, 0xecd2b0],
    spots: [
      { kind: "bookshelf", x: 120, y: 612, occluder: { x: 20, y: 300, w: 205, h: 320 }, peek: { dx: 120, dy: 0 }, hideHeight: 285 },
      { kind: "plant", x: 425, y: 606, occluder: { x: 345, y: 360, w: 160, h: 250 }, peek: { dx: 0, dy: -78 }, hideHeight: 215 },
      { kind: "curtain", x: 650, y: 606, occluder: { x: 596, y: 36, w: 120, h: 575 }, peek: { dx: -92, dy: 0 }, hideHeight: 360 },
      { kind: "bookshelf", x: 1150, y: 612, occluder: { x: 1070, y: 28, w: 205, h: 590 }, peek: { dx: -104, dy: 0 }, hideHeight: 360 },
    ],
  },

  // Kids' bedroom: blue dresser (L), bed with headboard (R), window (C).
  bedroom: {
    type: "bedroom",
    bgColors: [0xbfe3f0, 0xc8e0ef, 0xd6d0f0],
    spots: [
      { kind: "wardrobe", x: 165, y: 612, occluder: { x: 22, y: 350, w: 296, h: 270 }, peek: { dx: 152, dy: 0 }, hideHeight: 232 },
      { kind: "bed", x: 810, y: 616, occluder: { x: 690, y: 392, w: 470, h: 232 }, peek: { dx: -70, dy: -86 }, hideHeight: 222 },
      { kind: "bed", x: 1170, y: 616, occluder: { x: 1110, y: 322, w: 168, h: 300 }, peek: { dx: 0, dy: -104 }, hideHeight: 248 },
    ],
  },

  // Kitchen: a continuous lower counter with cabinet doors across the bottom and
  // a sink + window at center. The children duck behind the counter and peek
  // over the top.
  kitchen: {
    type: "kitchen",
    bgColors: [0xd8f0c0, 0xcdebc4, 0xe6efbf],
    // Occluders tile the whole counter (slightly overlapping) so no hider can
    // poke through a seam between cabinets.
    spots: [
      { kind: "wardrobe", x: 170, y: 656, occluder: { x: 20, y: 236, w: 386, h: 430 }, peek: { dx: 0, dy: -226 }, hideHeight: 372 },
      { kind: "wardrobe", x: 470, y: 656, occluder: { x: 380, y: 236, w: 300, h: 430 }, peek: { dx: 0, dy: -226 }, hideHeight: 372 },
      { kind: "wardrobe", x: 762, y: 656, occluder: { x: 620, y: 236, w: 302, h: 430 }, peek: { dx: 0, dy: -226 }, hideHeight: 372 },
      { kind: "wardrobe", x: 1078, y: 656, occluder: { x: 900, y: 236, w: 360, h: 430 }, peek: { dx: 0, dy: -226 }, hideHeight: 372 },
    ],
  },

  // Bathroom: toilet (L) and a sink vanity (R).
  bathroom: {
    type: "bathroom",
    bgColors: [0xc6eef0, 0xd2f0ec, 0xc0e8f5],
    spots: [
      { kind: "toybox", x: 112, y: 612, occluder: { x: 32, y: 352, w: 150, h: 262 }, peek: { dx: 96, dy: 0 }, hideHeight: 232 },
      { kind: "wardrobe", x: 1040, y: 612, occluder: { x: 884, y: 372, w: 330, h: 244 }, peek: { dx: -150, dy: 0 }, hideHeight: 228 },
    ],
  },

  // Hallway: doors on the side walls and at the far end, plus two big potted
  // plants flanking a runner rug. The richest room — five spots.
  hallway: {
    type: "hallway",
    bgColors: [0xeadbc8, 0xe3d2bb, 0xf0e2cf],
    spots: [
      { kind: "door", x: 150, y: 616, occluder: { x: 36, y: 70, w: 226, h: 548 }, peek: { dx: 130, dy: 0 }, hideHeight: 360 },
      { kind: "plant", x: 505, y: 606, occluder: { x: 420, y: 360, w: 172, h: 250 }, peek: { dx: -90, dy: 0 }, hideHeight: 210 },
      { kind: "door", x: 640, y: 600, occluder: { x: 556, y: 120, w: 170, h: 488 }, peek: { dx: -110, dy: 0 }, hideHeight: 300 },
      { kind: "plant", x: 800, y: 606, occluder: { x: 716, y: 360, w: 172, h: 250 }, peek: { dx: 90, dy: 0 }, hideHeight: 210 },
      { kind: "door", x: 1130, y: 616, occluder: { x: 1020, y: 70, w: 226, h: 548 }, peek: { dx: -130, dy: 0 }, hideHeight: 360 },
    ],
  },
};
