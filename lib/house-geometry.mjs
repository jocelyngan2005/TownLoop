// Tile geometry for the house floor plan: which tiles the house covers, how
// big its canvas is, and where the wooden lining runs around its silhouette.
//
// Plain JS with no imports on purpose. lib/house-plan.ts wraps this with
// types and the material costs, and scripts/preview-room.mjs renders it
// without a browser — both read the same algorithm, so what the preview shows
// is what the app draws.

/**
 * @typedef {object} RoomLayout
 * @property {string} id
 * @property {string} name
 * @property {number} tx      Left tile, inclusive.
 * @property {number} ty      Top tile, inclusive.
 * @property {number} cols
 * @property {number} rows
 * @property {number} wallRows  Rows at the room's top that read as wall.
 * @property {string} floorId   Decor catalogue id tiled across the floor.
 * @property {string} wallId    Decor catalogue id tiled across the wall band.
 * @property {string} [tint]    CSS filter giving the room its own character.
 */

/**
 * The plan, shaped so every room touches the next and the house reads as one
 * building rather than separate boxes: kitchen meets hall across x[8,10),
 * hall meets bedroom down x=13 over y[5,8), hall meets living across x[8,12).
 *
 * Rectangles on a shared grid rather than free-form rooms — the lining has to
 * wrap the whole house as one outline, which is only tractable if every room
 * snaps to the same tiles. Coordinates are half-open: a room covers
 * x in [tx, tx+cols).
 *
 * @type {RoomLayout[]}
 */
export const ROOM_LAYOUT = [
  {
    // 11 columns rather than 12 on purpose: at 352px wide it is the largest
    // starter room that still fits a 390px phone at 2x without scrolling, so
    // a new resident sees their whole home at once.
    id: "living",
    name: "Living Room",
    tx: 0,
    ty: 9,
    cols: 11,
    rows: 8,
    wallRows: 3,
    floorId: "floor-wood",
    wallId: "wall-stone",
    tint: "hue-rotate(-18deg) saturate(1.15)",
  },
  {
    id: "hall",
    name: "Hall",
    tx: 8,
    ty: 5,
    cols: 5,
    rows: 4,
    wallRows: 2,
    floorId: "floor-wood",
    wallId: "wall-stone",
  },
  {
    id: "kitchen",
    name: "Kitchen",
    tx: 0,
    ty: 0,
    cols: 10,
    rows: 5,
    wallRows: 2,
    floorId: "floor-concrete",
    wallId: "wall-stone",
    tint: "hue-rotate(18deg) saturate(1.1) brightness(1.05)",
  },
  {
    id: "bedroom",
    name: "Bedroom",
    tx: 13,
    ty: 0,
    cols: 11,
    rows: 8,
    wallRows: 3,
    floorId: "floor-wood",
    wallId: "wall-drape-blue",
    tint: "hue-rotate(-60deg) saturate(0.9) brightness(1.08)",
  },
];

/** The room you start with, before any exchange. */
export const STARTER_ROOM_ID = "living";

/**
 * @typedef {"top" | "bottom" | "left" | "right"} LiningSide
 * @typedef {{ side: LiningSide, x: number, y: number, w: number, h: number }} LiningRun
 * @typedef {{ piece: "tl" | "tr" | "bl" | "br", x: number, y: number }} LiningCorner
 * @typedef {{ tx: number, ty: number, cols: number, rows: number,
 *             width: number, height: number }} HouseBounds
 */

const tileKey = (tx, ty) => `${tx},${ty}`;

/** Is this tile inside the rect? Half-open, so edges never double-count. */
export function containsTile(rect, tx, ty) {
  return tx >= rect.tx && tx < rect.tx + rect.cols && ty >= rect.ty && ty < rect.ty + rect.rows;
}

/** Every tile the house covers, as "tx,ty" keys. */
export function occupiedTiles(rooms) {
  const tiles = new Set();
  for (const room of rooms) {
    for (let ty = room.ty; ty < room.ty + room.rows; ty += 1) {
      for (let tx = room.tx; tx < room.tx + room.cols; tx += 1) tiles.add(tileKey(tx, ty));
    }
  }
  return tiles;
}

/** The box the rooms sit in — this is what the canvas is sized to. */
export function houseBounds(rooms, tile) {
  const minX = Math.min(...rooms.map((r) => r.tx));
  const minY = Math.min(...rooms.map((r) => r.ty));
  const cols = Math.max(...rooms.map((r) => r.tx + r.cols)) - minX;
  const rows = Math.max(...rooms.map((r) => r.ty + r.rows)) - minY;
  return { tx: minX, ty: minY, cols, rows, width: cols * tile, height: rows * tile };
}

/** Which room a tile belongs to, or undefined if it is outside the house. */
export function roomAt(rooms, tx, ty) {
  return rooms.find((room) => containsTile(room, tx, ty));
}

/**
 * Trace the lining around whatever shape the unlocked rooms make.
 *
 * A tile edge is exterior when the tile beyond it is not part of the house.
 * Collinear exterior edges merge into runs, so the house draws as a dozen
 * strips rather than one per tile.
 *
 * A run is extended by the inset only at a *concave* end, which is the case
 * where the house carries on past the run but its edge steps away. There the
 * perpendicular run stops short and the 6x6 inside corner would be a hole;
 * extending fills it and the two dark outer rules cross as an L. At a convex
 * end the house itself stops, the perpendicular run already reaches the
 * corner, and a corner sprite covers the overlap — extending there would
 * hang 6px of border out into the garden.
 *
 * The test for which is which is cheap: the run stopped at a concave end
 * because the neighbouring tile's edge was not exposed, so that neighbour is
 * filled. At a convex end it is empty.
 *
 * Returns pixel rects measured from `origin`, the top-left tile of whatever
 * canvas they will be drawn on. That is a required argument rather than the
 * rooms' own bounding box because the two differ whenever the canvas is
 * bigger than the built house — the app sizes its canvas to the whole floor
 * plan so unbuilt rooms can be shown, and defaulting to the rooms' own bounds
 * silently drew the lining offset by the gap between the two.
 *
 * @param {RoomLayout[]} rooms
 * @param {number} tile
 * @param {number} inset
 * @param {{ tx: number, ty: number }} origin  Tile the canvas starts at.
 * @returns {{ bounds: HouseBounds, runs: LiningRun[], corners: LiningCorner[] }}
 */
export function liningGeometry(rooms, tile, inset, origin) {
  const bounds = houseBounds(rooms, tile);
  const tiles = occupiedTiles(rooms);

  const filled = (tx, ty) => tiles.has(tileKey(tx, ty));
  const px = (tx) => (tx - origin.tx) * tile;
  const py = (ty) => (ty - origin.ty) * tile;
  const lastX = bounds.tx + bounds.cols;
  const lastY = bounds.ty + bounds.rows;

  /** @type {LiningRun[]} */
  const runs = [];

  // Horizontal sides: walk each row collecting spans whose neighbour above
  // (or below) is empty. The loop runs one past the edge so an open span
  // always gets closed.
  for (const [side, dy] of /** @type {[LiningSide, number][]} */ ([
    ["top", -1],
    ["bottom", 1],
  ])) {
    for (let ty = bounds.ty; ty < lastY; ty += 1) {
      let start = null;
      for (let tx = bounds.tx; tx <= lastX; tx += 1) {
        const exposed = tx < lastX && filled(tx, ty) && !filled(tx, ty + dy);
        if (exposed && start === null) start = tx;
        if (!exposed && start !== null) {
          const head = filled(start - 1, ty) ? inset : 0;
          const tail = filled(tx, ty) ? inset : 0;
          runs.push({
            side,
            x: px(start) - head,
            y: side === "top" ? py(ty) : py(ty + 1) - inset,
            w: px(tx) - px(start) + head + tail,
            h: inset,
          });
          start = null;
        }
      }
    }
  }

  // Vertical sides, the same walk down each column.
  for (const [side, dx] of /** @type {[LiningSide, number][]} */ ([
    ["left", -1],
    ["right", 1],
  ])) {
    for (let tx = bounds.tx; tx < lastX; tx += 1) {
      let start = null;
      for (let ty = bounds.ty; ty <= lastY; ty += 1) {
        const exposed = ty < lastY && filled(tx, ty) && !filled(tx + dx, ty);
        if (exposed && start === null) start = ty;
        if (!exposed && start !== null) {
          const head = filled(tx, start - 1) ? inset : 0;
          const tail = filled(tx, ty) ? inset : 0;
          runs.push({
            side,
            x: side === "left" ? px(tx) : px(tx + 1) - inset,
            y: py(start) - head,
            w: inset,
            h: py(ty) - py(start) + head + tail,
          });
          start = null;
        }
      }
    }
  }

  // A convex corner is a tile corner with exactly one filled tile diagonally
  // around it: both sides meeting there are exterior and they turn outward.
  // Three filled tiles is a concave junction, which the extended runs cover.
  /** @type {LiningCorner[]} */
  const corners = [];
  for (let ty = bounds.ty; ty <= lastY; ty += 1) {
    for (let tx = bounds.tx; tx <= lastX; tx += 1) {
      const nw = filled(tx - 1, ty - 1);
      const ne = filled(tx, ty - 1);
      const sw = filled(tx - 1, ty);
      const se = filled(tx, ty);
      if (se && !ne && !sw) corners.push({ piece: "tl", x: px(tx), y: py(ty) });
      if (sw && !nw && !se) corners.push({ piece: "tr", x: px(tx) - inset, y: py(ty) });
      if (ne && !nw && !se) corners.push({ piece: "bl", x: px(tx), y: py(ty) - inset });
      if (nw && !ne && !sw) corners.push({ piece: "br", x: px(tx) - inset, y: py(ty) - inset });
    }
  }

  return { bounds, runs, corners };
}
