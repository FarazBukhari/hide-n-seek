import type { House, Room, HidingSpot, Door } from "../house/types";
import { ROOM_LAYOUTS, ROOM_TYPES, type RoomLayout } from "./roomTemplates";
import { Rng, nextSeed } from "./rng";

// Procedurally builds a house each round: 4–6 rooms connected in a chain (each
// room has a left door to the previous room and a right door to the next), with
// randomized room types. Each room's hiding spots are the furniture already
// painted into its illustrated background (see roomTemplates.ts), so the spots
// are fixed per room *type* but the room order, types, and where Burhan hides
// still vary every round. Produces the `House` shape the rest of the game
// already consumes.

const MIN_ROOMS = 4;
const MAX_ROOMS = 6;

/** Pick room types, avoiding the same type twice in a row so neighbours differ. */
function pickTypes(rng: Rng, count: number): RoomLayout[] {
  const layouts = ROOM_TYPES.map((t) => ROOM_LAYOUTS[t]);
  const result: RoomLayout[] = [];
  let prev: RoomLayout | null = null;
  for (let i = 0; i < count; i++) {
    let t: RoomLayout;
    do {
      t = rng.pick(layouts);
    } while (prev && t.type === prev.type && layouts.length > 1);
    result.push(t);
    prev = t;
  }
  return result;
}

/** A room's hiding spots are its background's painted furniture (fixed layout). */
function genSpots(roomId: string, layout: RoomLayout): HidingSpot[] {
  return layout.spots.map((s, i) => ({ ...s, id: `${roomId}-${s.kind}-${i}` }));
}

export function generateHouse(seed: number = nextSeed()): House {
  const rng = new Rng(seed);
  const count = rng.int(MIN_ROOMS, MAX_ROOMS);
  const layouts = pickTypes(rng, count);

  const rooms: Room[] = layouts.map((layout, i) => {
    const id = `room${i}`;
    return {
      id,
      type: layout.type,
      bgColor: rng.pick(layout.bgColors),
      spots: genSpots(id, layout),
      doors: [] as Door[],
    };
  });

  // Connect as a chain: left door -> previous room, right door -> next room.
  for (let i = 0; i < rooms.length; i++) {
    if (i > 0) rooms[i].doors.push({ side: "left", toRoomId: rooms[i - 1].id });
    if (i < rooms.length - 1)
      rooms[i].doors.push({ side: "right", toRoomId: rooms[i + 1].id });
  }

  return { rooms, startRoomId: rooms[0].id };
}
