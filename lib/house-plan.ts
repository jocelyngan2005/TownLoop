import { LINING, TILE, type MaterialCost } from "@/lib/decor-data";
import {
  ROOM_LAYOUT,
  STARTER_ROOM_ID,
  containsTile,
  houseBounds as boundsOf,
  liningGeometry as liningOf,
  occupiedTiles as occupiedOf,
  roomAt as roomAtOf,
} from "@/lib/house-geometry.mjs";

export { STARTER_ROOM_ID, containsTile };

/** Where a room sits and what it is made of. */
export type RoomLayout = {
  id: string;
  name: string;
  tx: number;
  ty: number;
  cols: number;
  rows: number;
  /** Rows at this room's top that read as wall rather than floor. */
  wallRows: number;
  /** Ids in the decor catalogue; the room tiles its surfaces from these. */
  floorId: string;
  wallId: string;
  /**
   * CSS filter giving the room its own character. The sheet has only two
   * floors and two wall styles, so colour variety has to come from a filter
   * until there is real art for it. Applied to the surface layers only,
   * never to furniture.
   */
  tint?: string;
};

/** What a room costs to build, and why those materials. */
type RoomEconomy = {
  /** Recyclables exchanged to build it. Empty means it is the starter. */
  cost: MaterialCost;
  /** Shown when the room is tapped, same role as a catalogue item's fact. */
  fact: string;
};

/**
 * Kept here rather than in house-geometry.mjs so the material ids are type
 * checked against MaterialCost — a typo in one would otherwise charge
 * nothing and go unnoticed. Quantities are on the scale the large furniture
 * already uses, and are illustrative rather than sourced, like the rest of
 * the exchange table in lib/decor-data.ts.
 */
const ECONOMY: Record<string, RoomEconomy> = {
  living: {
    cost: {},
    fact: "The greenest room in any house is the one already standing — reusing a structure skips every kilo of material a new one would need.",
  },
  hall: {
    cost: { cardboard: 40, woodOffcut: 10 },
    fact: "Floorboards are the most reused part of a house. A reclaimed board skips felling, milling and drying, so it carries almost none of the carbon a new one does.",
  },
  kitchen: {
    cost: { cardboard: 80, woodOffcut: 25, glassBottle: 10 },
    fact: "Crushed glass and broken concrete both go back in as aggregate in new screed, which makes a kitchen floor one of the easiest places in a house to put rubble back to work.",
  },
  bedroom: {
    cost: { cardboard: 90, woodOffcut: 30, garment: 12 },
    fact: "Wall hangings take coarser reclaimed fibre than clothing can, so a soft-walled room is a good home for textiles too worn to wear again.",
  },
};

const FALLBACK: RoomEconomy = {
  cost: {},
  fact: "Every room kept in use is one that does not need building again.",
};

export type RoomDef = RoomLayout & RoomEconomy;

export const ROOMS: RoomDef[] = (ROOM_LAYOUT as RoomLayout[]).map((room) => ({
  ...room,
  ...(ECONOMY[room.id] ?? FALLBACK),
}));

export const roomById = new Map(ROOMS.map((room) => [room.id, room]));

export const starterRoom = roomById.get(STARTER_ROOM_ID) as RoomDef;

/** The rooms that are built, always including the starter. */
export function unlockedRooms(unlocked: Iterable<string>): RoomDef[] {
  const ids = new Set([STARTER_ROOM_ID, ...unlocked]);
  return ROOMS.filter((room) => ids.has(room.id));
}

/** The rooms still to build, in plan order. */
export function lockedRooms(unlocked: Iterable<string>): RoomDef[] {
  const ids = new Set([STARTER_ROOM_ID, ...unlocked]);
  return ROOMS.filter((room) => !ids.has(room.id));
}

// ---------------------------------------------------------------------------
// Geometry — thin wrappers that supply the tile size and lining inset
// ---------------------------------------------------------------------------

export type HouseBounds = {
  tx: number;
  ty: number;
  cols: number;
  rows: number;
  /** Pixel size of the canvas these rooms need. */
  width: number;
  height: number;
};

export type LiningRun = {
  side: "top" | "bottom" | "left" | "right";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LiningCorner = { piece: "tl" | "tr" | "bl" | "br"; x: number; y: number };

export type LiningGeometry = {
  bounds: HouseBounds;
  runs: LiningRun[];
  corners: LiningCorner[];
};

export const occupiedTiles = (rooms: RoomLayout[]): Set<string> => occupiedOf(rooms);

export const houseBounds = (rooms: RoomLayout[]): HouseBounds => boundsOf(rooms, TILE);

export const roomAt = (rooms: RoomDef[], tx: number, ty: number): RoomDef | undefined =>
  roomAtOf(rooms, tx, ty);

/**
 * The lining around `rooms`, positioned for a canvas whose top-left is
 * `origin`. Pass the canvas's own bounds, not the rooms' — the two differ
 * whenever the canvas covers more than the built house.
 */
export const liningGeometry = (
  rooms: RoomLayout[],
  origin: { tx: number; ty: number },
): LiningGeometry => liningOf(rooms, TILE, LINING.inset, origin);
