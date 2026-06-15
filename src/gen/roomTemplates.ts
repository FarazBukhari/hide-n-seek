import type { Room, SpotKind } from "../house/types";
import { GAME_WIDTH } from "../config";

// Modular room templates. Each room type has a couple of background tints and a
// catalog of candidate hiding-spot slots. The generator picks a subset of slots
// (one per "lane" so furniture never overlaps), giving lots of variety from a
// small amount of hand-authored data. Add more templates/slots here to expand
// variety without touching the generator.

/** Horizontal lanes keep furniture spaced; mapped to x positions below. */
export type Lane = "L" | "C" | "R";

export const LANE_X: Record<Lane, number> = {
  L: GAME_WIDTH * 0.22,
  C: GAME_WIDTH * 0.5,
  R: GAME_WIDTH * 0.78,
};

export interface SlotTemplate {
  kind: SpotKind;
  lane: Lane;
  y: number;
}

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
      { kind: "curtain", lane: "L", y: 740 },
      { kind: "curtain", lane: "R", y: 740 },
      { kind: "plant", lane: "L", y: 880 },
      { kind: "plant", lane: "R", y: 880 },
      { kind: "toybox", lane: "C", y: 950 },
      { kind: "toybox", lane: "R", y: 950 },
    ],
  },
  {
    type: "bedroom",
    bgColors: [0xbfe3f0, 0xc8e0ef, 0xd6d0f0],
    slots: [
      { kind: "bed", lane: "C", y: 900 },
      { kind: "bed", lane: "R", y: 900 },
      { kind: "wardrobe", lane: "L", y: 760 },
      { kind: "wardrobe", lane: "R", y: 760 },
      { kind: "curtain", lane: "C", y: 740 },
      { kind: "toybox", lane: "L", y: 950 },
    ],
  },
  {
    type: "kitchen",
    bgColors: [0xd8f0c0, 0xcdebc4, 0xe6efbf],
    slots: [
      { kind: "wardrobe", lane: "L", y: 780 },
      { kind: "wardrobe", lane: "C", y: 780 },
      { kind: "curtain", lane: "R", y: 740 },
      { kind: "toybox", lane: "R", y: 950 },
      { kind: "plant", lane: "L", y: 880 },
    ],
  },
  {
    type: "bathroom",
    bgColors: [0xc6eef0, 0xd2f0ec, 0xc0e8f5],
    slots: [
      { kind: "curtain", lane: "C", y: 740 },
      { kind: "curtain", lane: "R", y: 740 },
      { kind: "wardrobe", lane: "L", y: 780 },
      { kind: "plant", lane: "R", y: 880 },
    ],
  },
  {
    type: "hallway",
    bgColors: [0xeadbc8, 0xe3d2bb, 0xf0e2cf],
    slots: [
      { kind: "wardrobe", lane: "L", y: 760 },
      { kind: "wardrobe", lane: "R", y: 760 },
      { kind: "plant", lane: "C", y: 880 },
      { kind: "curtain", lane: "L", y: 740 },
      { kind: "toybox", lane: "R", y: 950 },
    ],
  },
];
