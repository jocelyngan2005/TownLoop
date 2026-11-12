import { TILE, type PlacementLayer } from "@/lib/decor-data";
import { containsTile, type RoomDef } from "@/lib/house-plan";

/**
 * The subset of an item this module needs — keeps it testable in isolation.
 *
 * Size comes from the *variant*, not the entry: turning an armchair from front
 * to side changes it from 28x30 to 23x32, which changes where it may sit.
 */
export type Placeable = { w: number; h: number; layer: PlacementLayer };

export type TileRange = { minTx: number; maxTx: number; minTy: number; maxTy: number };

/**
 * The tile positions an item may legally occupy *within one room*.
 *
 * Constraints are resolved in *tile* space, not pixels. Sprites are not all
 * multiples of the tile size (a window is 18px tall, a sofa 30px), so
 * clamping a pixel edge and then snapping — or snapping and then clamping —
 * leaves the item fractionally off-grid. Picking the tile index directly is
 * the only formulation where "on the grid" and "inside the room" can both
 * hold.
 *
 * Floor items are bounded by their *bottom* edge, so a tall bookshelf may
 * overlap the wall behind it while its feet stay on the floor. Wall items
 * must hang entirely within the wall band. Where an item is too big for its
 * band the range collapses to a single position rather than becoming empty.
 */
export function tileRange(item: Placeable, room: RoomDef): TileRange {
  const roomW = room.cols * TILE;
  const roomH = room.rows * TILE;
  const wallH = room.wallRows * TILE;

  const maxTx = room.tx + Math.max(0, Math.floor((roomW - item.w) / TILE));

  const bandBottom = item.layer === "wall" ? wallH : roomH;
  const maxTy = room.ty + Math.max(0, Math.floor((bandBottom - item.h) / TILE));
  const wantedMinTy =
    room.ty + (item.layer === "wall" ? 0 : Math.max(0, Math.ceil((wallH - item.h) / TILE)));

  return {
    minTx: room.tx,
    maxTx,
    minTy: Math.min(wantedMinTy, maxTy),
    maxTy,
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Round to whole tiles and clamp into the item's legal range in `room`. */
export function clampTile(item: Placeable, room: RoomDef, tx: number, ty: number) {
  const range = tileRange(item, room);
  return {
    tx: clamp(Math.round(tx), range.minTx, range.maxTx),
    ty: clamp(Math.round(ty), range.minTy, range.maxTy),
  };
}

/**
 * Turn a pixel position in house space into a legal tile placement.
 *
 * The room is chosen by where the item's *centre* landed, which is what makes
 * dragging between rooms feel right — the piece moves once most of it is over
 * the new floor, rather than when its top-left corner crosses. Dropping over
 * the garden keeps `fallback`, the room it came from, so a piece flung off the
 * house snaps back instead of teleporting to whichever room is listed first.
 */
export function snapPlacement(
  item: Placeable,
  rooms: RoomDef[],
  fallback: RoomDef,
  px: number,
  py: number,
) {
  const centreTx = Math.floor((px + item.w / 2) / TILE);
  const centreTy = Math.floor((py + item.h / 2) / TILE);
  const room = rooms.find((candidate) => containsTile(candidate, centreTx, centreTy)) ?? fallback;
  return { room, ...clampTile(item, room, px / TILE, py / TILE) };
}
