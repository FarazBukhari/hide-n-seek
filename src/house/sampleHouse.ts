import type { House } from "./types";
import { GAME_WIDTH } from "../config";

// A single hand-built 3-room house for M2: living room <-> bedroom <-> kitchen,
// connected in a line. M3 replaces this with a procedural generator.
const W = GAME_WIDTH;

export function buildHouse(): House {
  return {
    startRoomId: "living",
    rooms: [
      {
        id: "living",
        type: "living",
        bgColor: 0xf4d9a6,
        doors: [{ side: "right", toRoomId: "bedroom" }],
        spots: [
          { id: "living-curtain", kind: "curtain", x: W * 0.22, y: 760 },
          { id: "living-plant", kind: "plant", x: W * 0.78, y: 880 },
          { id: "living-toybox", kind: "toybox", x: W * 0.5, y: 960 },
        ],
      },
      {
        id: "bedroom",
        type: "bedroom",
        bgColor: 0xbfe3f0,
        doors: [
          { side: "left", toRoomId: "living" },
          { side: "right", toRoomId: "kitchen" },
        ],
        spots: [
          { id: "bedroom-bed", kind: "bed", x: W * 0.5, y: 900 },
          { id: "bedroom-wardrobe", kind: "wardrobe", x: W * 0.22, y: 760 },
          { id: "bedroom-curtain", kind: "curtain", x: W * 0.8, y: 760 },
        ],
      },
      {
        id: "kitchen",
        type: "kitchen",
        bgColor: 0xd8f0c0,
        doors: [{ side: "left", toRoomId: "bedroom" }],
        spots: [
          { id: "kitchen-wardrobe", kind: "wardrobe", x: W * 0.28, y: 780 },
          { id: "kitchen-toybox", kind: "toybox", x: W * 0.72, y: 900 },
        ],
      },
    ],
  };
}
