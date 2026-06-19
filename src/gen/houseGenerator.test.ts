import { describe, it, expect } from "vitest";
import { generateHouse } from "./houseGenerator";
import { roomById, roomDistance } from "../house/types";

// Exercise the generator across many seeds so a regression in layout logic
// (unreachable rooms, overlapping furniture, bad doors) is caught.
const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7 + 1);

describe("generateHouse", () => {
  it("is deterministic for a given seed", () => {
    const a = generateHouse(2024);
    const b = generateHouse(2024);
    expect(a).toEqual(b);
  });

  it("produces 4-6 rooms starting at the first room", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      expect(h.rooms.length).toBeGreaterThanOrEqual(4);
      expect(h.rooms.length).toBeLessThanOrEqual(6);
      expect(h.startRoomId).toBe(h.rooms[0].id);
    }
  });

  it("gives each room 4-5 hiding spots that never share a lane (x)", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      for (const room of h.rooms) {
        expect(room.spots.length).toBeGreaterThanOrEqual(4);
        expect(room.spots.length).toBeLessThanOrEqual(5);
        const xs = room.spots.map((s) => s.x);
        expect(new Set(xs).size).toBe(xs.length); // no overlap
      }
    }
  });

  it("gives every spot a unique id", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      const ids = h.rooms.flatMap((r) => r.spots.map((s) => s.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("only has doors pointing at rooms that exist", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      const ids = new Set(h.rooms.map((r) => r.id));
      for (const room of h.rooms) {
        for (const door of room.doors) {
          expect(ids.has(door.toRoomId)).toBe(true);
        }
      }
    }
  });

  it("keeps every room reachable from the start (Burhan is always findable)", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      for (const room of h.rooms) {
        expect(
          Number.isFinite(roomDistance(h, h.startRoomId, room.id)),
        ).toBe(true);
      }
    }
  });

  it("never places two rooms of the same type next to each other", () => {
    for (const seed of SEEDS) {
      const h = generateHouse(seed);
      for (let i = 1; i < h.rooms.length; i++) {
        expect(h.rooms[i].type).not.toBe(h.rooms[i - 1].type);
      }
    }
  });

  it("connects rooms as a navigable chain (doors are bidirectional)", () => {
    const h = generateHouse(555);
    for (let i = 0; i < h.rooms.length; i++) {
      const room = h.rooms[i];
      if (i > 0) {
        expect(room.doors.some((d) => d.side === "left")).toBe(true);
      }
      if (i < h.rooms.length - 1) {
        expect(room.doors.some((d) => d.side === "right")).toBe(true);
      }
      // Each neighbour links back.
      for (const door of room.doors) {
        const neighbour = roomById(h, door.toRoomId);
        expect(neighbour.doors.some((d) => d.toRoomId === room.id)).toBe(true);
      }
    }
  });
});
