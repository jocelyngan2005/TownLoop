import { TILE, type DecorItem } from "@/lib/decor-data";

export const ROOM_COLS = 10;
export const ROOM_ROWS = 8;
/** Rows at the top that read as wall rather than floor. */
export const WALL_ROWS = 3;

export const ROOM_W = ROOM_COLS * TILE;
export const ROOM_H = ROOM_ROWS * TILE;
export const WALL_H = WALL_ROWS * TILE;

/** The subset of an item this module needs — keeps it testable in isolation. */
export type Placeable = Pick<DecorItem, "w" | "h" | "layer">;

export type TileRange = { minTx: number; maxTx: number; minTy: number; maxTy: number };

/**
 * The tile positions an item may legally occupy.
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
export function tileRange(item: Placeable): TileRange {
  const maxTx = Math.max(0, Math.floor((ROOM_W - item.w) / TILE));

  const bandBottom = item.layer === "wall" ? WALL_H : ROOM_H;
  const maxTy = Math.max(0, Math.floor((bandBottom - item.h) / TILE));
  const wantedMinTy =
    item.layer === "wall" ? 0 : Math.max(0, Math.ceil((WALL_H - item.h) / TILE));

  return { minTx: 0, maxTx, minTy: Math.min(wantedMinTy, maxTy), maxTy };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** Round to whole tiles and clamp into the item's legal range. */
export function clampTile(item: Placeable, tx: number, ty: number) {
  const range = tileRange(item);
  return {
    tx: clamp(Math.round(tx), range.minTx, range.maxTx),
    ty: clamp(Math.round(ty), range.minTy, range.maxTy),
  };
}

/** Convert a pixel position inside the room to a legal tile placement. */
export function snapPlacement(item: Placeable, px: number, py: number) {
  return clampTile(item, px / TILE, py / TILE);
}
