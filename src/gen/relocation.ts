import type { House } from "../house/types";

export interface HidePlace {
  roomId: string;
  spotId: string;
}

/**
 * Pick a new hiding place for Burhan when he sneaks away. Prefers a *different*
 * room (so the player has to travel and the chase feels real), falling back to a
 * different spot in the same room, and returns null only if there is nowhere
 * else to go. `rand` is injectable so the choice is testable.
 */
export function pickRelocationSpot(
  house: House,
  curRoomId: string,
  curSpotId: string,
  rand: () => number = Math.random,
): HidePlace | null {
  const all: { place: HidePlace; sameRoom: boolean }[] = [];
  for (const room of house.rooms) {
    for (const spot of room.spots) {
      if (spot.id === curSpotId) continue;
      all.push({
        place: { roomId: room.id, spotId: spot.id },
        sameRoom: room.id === curRoomId,
      });
    }
  }
  if (all.length === 0) return null;

  const otherRoom = all.filter((c) => !c.sameRoom);
  const pool = otherRoom.length > 0 ? otherRoom : all;
  const idx = Math.min(pool.length - 1, Math.floor(rand() * pool.length));
  return pool[idx].place;
}
