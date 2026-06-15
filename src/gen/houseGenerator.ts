import type { House, Room, HidingSpot, Door } from "../house/types";
import {
  ROOM_TEMPLATES,
  LANE_X,
  type Lane,
  type RoomTemplate,
  type SlotTemplate,
} from "./roomTemplates";
import { Rng, nextSeed } from "./rng";

// Procedurally builds a house each round: 4–6 rooms connected in a chain (each
// room has a left door to the previous room and a right door to the next), with
// randomized room types, backgrounds, and furniture. Produces the same `House`
// shape the rest of the game already consumes.

const MIN_ROOMS = 4;
const MAX_ROOMS = 6;
const ALL_LANES: Lane[] = ["L", "C", "R"];

/** Pick room types, avoiding the same type twice in a row so neighbours differ. */
function pickTypes(rng: Rng, count: number): RoomTemplate[] {
  const result: RoomTemplate[] = [];
  let prev: RoomTemplate | null = null;
  for (let i = 0; i < count; i++) {
    let t: RoomTemplate;
    do {
      t = rng.pick(ROOM_TEMPLATES);
    } while (prev && t.type === prev.type && ROOM_TEMPLATES.length > 1);
    result.push(t);
    prev = t;
  }
  return result;
}

/** Choose 2–3 hiding spots for a room, one per lane so they never overlap. */
function genSpots(rng: Rng, roomId: string, template: RoomTemplate): HidingSpot[] {
  // Group candidate slots by lane.
  const byLane = new Map<Lane, SlotTemplate[]>();
  for (const slot of template.slots) {
    const list = byLane.get(slot.lane) ?? [];
    list.push(slot);
    byLane.set(slot.lane, list);
  }

  const availableLanes = rng.shuffle(ALL_LANES.filter((l) => byLane.has(l)));
  const count = Math.min(availableLanes.length, rng.int(2, 3));

  const spots: HidingSpot[] = [];
  for (let i = 0; i < count; i++) {
    const lane = availableLanes[i];
    const slot = rng.pick(byLane.get(lane)!);
    spots.push({
      id: `${roomId}-${slot.kind}-${i}`,
      kind: slot.kind,
      x: LANE_X[lane],
      y: slot.y,
    });
  }
  return spots;
}

export function generateHouse(seed: number = nextSeed()): House {
  const rng = new Rng(seed);
  const count = rng.int(MIN_ROOMS, MAX_ROOMS);
  const templates = pickTypes(rng, count);

  const rooms: Room[] = templates.map((template, i) => {
    const id = `room${i}`;
    return {
      id,
      type: template.type,
      bgColor: rng.pick(template.bgColors),
      spots: genSpots(rng, id, template),
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
