import type { Room, SpotKind } from "../house/types";
import { GAME_WIDTH } from "../config";

// Modular room templates. Each room type has a couple of background tints and a
// catalog of candidate hiding-spot slots. The generator picks a subset of slots
// (one per "lane" so furniture never overlaps), giving lots of variety from a
// small amount of hand-authored data. Landscape gives us 5 lanes, so rooms feel
// full. Add more templates/slots here to expand variety without touching the
// generator.

/** Horizontal lanes keep furniture spaced; mapped to x positions below. */
export type Lane = "L" | "ML" | "C" | "MR" | "R";

export const ALL_LANES: Lane[] = ["L", "ML", "C", "MR", "R"];

export const LANE_X: Record<Lane, number> = {
  L: GAME_WIDTH * 0.12,
  ML: GAME_WIDTH * 0.31,
  C: GAME_WIDTH * 0.5,
  MR: GAME_WIDTH * 0.69,
  R: GAME_WIDTH * 0.88,
};

/** Per-kind vertical placement so furniture sits grounded on the floor line. */
const Y: Record<SpotKind, number> = {
  wardrobe: 458,
  curtain: 430,
  bed: 498,
  toybox: 508,
  plant: 480,
};

export interface SlotTemplate {
  kind: SpotKind;
  lane: Lane;
  y: number;
}

const slot = (kind: SpotKind, lane: Lane): SlotTemplate => ({
  kind,
  lane,
  y: Y[kind],
});

export interface RoomTemplate {
  type: Room["type"];
  bgColors: number[];
  slots: SlotTemplate[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    type: "living",
    bgColors: [0xf4d9a6, 0xf0cf99, 0xecd2b0],
    slots: [
      slot("curtain", "L"),
      slot("curtain", "ML"),
      slot("plant", "L"),
      slot("plant", "R"),
      slot("toybox", "C"),
      slot("toybox", "MR"),
      slot("toybox", "R"),
    ],
  },
  {
    type: "bedroom",
    bgColors: [0xbfe3f0, 0xc8e0ef, 0xd6d0f0],
    slots: [
      slot("bed", "C"),
      slot("bed", "MR"),
      slot("wardrobe", "L"),
      slot("wardrobe", "R"),
      slot("curtain", "ML"),
      slot("toybox", "R"),
      slot("plant", "L"),
    ],
  },
  {
    type: "kitchen",
    bgColors: [0xd8f0c0, 0xcdebc4, 0xe6efbf],
    slots: [
      slot("wardrobe", "L"),
      slot("wardrobe", "ML"),
      slot("wardrobe", "C"),
      slot("curtain", "R"),
      slot("toybox", "MR"),
      slot("toybox", "R"),
      slot("plant", "L"),
    ],
  },
  {
    type: "bathroom",
    bgColors: [0xc6eef0, 0xd2f0ec, 0xc0e8f5],
    slots: [
      slot("curtain", "C"),
      slot("curtain", "MR"),
      slot("wardrobe", "L"),
      slot("wardrobe", "ML"),
      slot("plant", "R"),
      slot("toybox", "R"),
    ],
  },
  {
    type: "hallway",
    bgColors: [0xeadbc8, 0xe3d2bb, 0xf0e2cf],
    slots: [
      slot("wardrobe", "L"),
      slot("wardrobe", "R"),
      slot("plant", "C"),
      slot("plant", "MR"),
      slot("curtain", "L"),
      slot("curtain", "ML"),
      slot("toybox", "R"),
    ],
  },
];
