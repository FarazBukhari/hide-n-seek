import { describe, it, expect } from "vitest";
import { roomDistance, type House } from "./types";

// A small fixed house: A <-> B <-> C, plus an isolated room D.
const house: House = {
  startRoomId: "A",
  rooms: [
    {
      id: "A",
      type: "living",
      bgColor: 0,
      spots: [],
      doors: [{ side: "right", toRoomId: "B" }],
    },
    {
      id: "B",
      type: "bedroom",
      bgColor: 0,
      spots: [],
      doors: [
        { side: "left", toRoomId: "A" },
        { side: "right", toRoomId: "C" },
      ],
    },
    {
      id: "C",
      type: "kitchen",
      bgColor: 0,
      spots: [],
      doors: [{ side: "left", toRoomId: "B" }],
    },
    { id: "D", type: "hallway", bgColor: 0, spots: [], doors: [] },
  ],
};

describe("roomDistance", () => {
  it("is 0 to the same room", () => {
    expect(roomDistance(house, "B", "B")).toBe(0);
  });

  it("counts doors between rooms", () => {
    expect(roomDistance(house, "A", "B")).toBe(1);
    expect(roomDistance(house, "A", "C")).toBe(2);
    expect(roomDistance(house, "C", "A")).toBe(2);
  });

  it("is symmetric across bidirectional doors", () => {
    expect(roomDistance(house, "A", "C")).toBe(roomDistance(house, "C", "A"));
  });

  it("is Infinity for an unreachable room", () => {
    expect(roomDistance(house, "A", "D")).toBe(Number.POSITIVE_INFINITY);
  });
});
