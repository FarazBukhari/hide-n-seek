import { describe, it, expect } from "vitest";
import { generateHouse } from "./houseGenerator";
import { pickRelocationSpot } from "./relocation";

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 13 + 3);

describe("pickRelocationSpot", () => {
  it("never returns the spot Burhan is leaving", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      const room = h.rooms[0];
      const spot = room.spots[0];
      // Sweep the random source across the whole [0,1) range.
      for (let r = 0; r < 1; r += 0.05) {
        const next = pickRelocationSpot(h, room.id, spot.id, () => r);
        expect(next).not.toBeNull();
        expect(next!.spotId).not.toBe(spot.id);
      }
    }
  });

  it("prefers a different room when one is available", () => {
    const h = generateHouse(2024);
    const room = h.rooms[0];
    const spot = room.spots[0];
    for (let r = 0; r < 1; r += 0.05) {
      const next = pickRelocationSpot(h, room.id, spot.id, () => r);
      expect(next!.roomId).not.toBe(room.id);
    }
  });

  it("always points at a spot that actually exists", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      const room = h.rooms[1] ?? h.rooms[0];
      const spot = room.spots[0];
      const next = pickRelocationSpot(h, room.id, spot.id, () => 0.5);
      const target = h.rooms
        .find((r) => r.id === next!.roomId)
        ?.spots.find((s) => s.id === next!.spotId);
      expect(target).toBeDefined();
    }
  });

  it("returns null only when there is genuinely nowhere else", () => {
    const tiny = {
      startRoomId: "r0",
      rooms: [
        {
          id: "r0",
          type: "living" as const,
          bgColor: 0,
          spots: [{ id: "only", kind: "sofa" as const, x: 0, y: 0 }],
          doors: [],
        },
      ],
    };
    expect(pickRelocationSpot(tiny, "r0", "only")).toBeNull();
  });
});
