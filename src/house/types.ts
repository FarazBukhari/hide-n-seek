// ---------------------------------------------------------------------------
// House data model. M2 ships one hand-built house (sampleHouse.ts). M3 swaps in
// a procedural generator that produces this exact shape, so SearchScene needs
// no changes.
// ---------------------------------------------------------------------------

/**
 * Kinds of furniture that can conceal Burhan. Each renders differently.
 * The first five are the original spots; `door` / `sofa` / `bookshelf` are the
 * new indoor spots added in the pixel-art reskin (no outdoor spots).
 */
export type SpotKind =
  | "wardrobe"
  | "bed"
  | "curtain"
  | "toybox"
  | "plant"
  | "door"
  | "sofa"
  | "bookshelf";

export interface HidingSpot {
  id: string;
  kind: SpotKind;
  /** Position within the room, in design pixels (GAME_WIDTH x play area). */
  x: number;
  y: number;
}

export type Side = "left" | "right";

export interface Door {
  side: Side;
  toRoomId: string;
}

export interface Room {
  id: string;
  /** Room type drives the background tint. */
  type: "living" | "bedroom" | "kitchen" | "bathroom" | "hallway";
  bgColor: number;
  spots: HidingSpot[];
  doors: Door[];
}

export interface House {
  rooms: Room[];
  startRoomId: string;
}

export function roomById(house: House, id: string): Room {
  const r = house.rooms.find((x) => x.id === id);
  if (!r) throw new Error(`room not found: ${id}`);
  return r;
}

/**
 * Breadth-first room distance between two rooms (used by the proximity-giggle
 * hint). Returns number of doors to traverse; 0 if same room.
 */
export function roomDistance(house: House, fromId: string, toId: string): number {
  if (fromId === toId) return 0;
  const seen = new Set<string>([fromId]);
  let frontier = [fromId];
  let dist = 0;
  while (frontier.length) {
    dist++;
    const next: string[] = [];
    for (const id of frontier) {
      for (const door of roomById(house, id).doors) {
        if (door.toRoomId === toId) return dist;
        if (!seen.has(door.toRoomId)) {
          seen.add(door.toRoomId);
          next.push(door.toRoomId);
        }
      }
    }
    frontier = next;
  }
  return Number.POSITIVE_INFINITY;
}
