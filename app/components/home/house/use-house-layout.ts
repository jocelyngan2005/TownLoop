"use client";

import { useCallback, useMemo, useState } from "react";

import {
  availableMaterials,
  canAfford,
  decorById,
  starterIds,
  type MaterialTally,
} from "@/lib/decor-data";
import {
  STARTER_ROOM_ID,
  roomById,
  starterRoom,
  unlockedRooms,
} from "@/lib/house-plan";

export const STORAGE_KEY = "townloop.house.v2";

/** One item placed in the room, positioned by its top-left tile. */
export type Placement = {
  /** Unique per placement, so the same item can be placed more than once. */
  key: string;
  itemId: string;
  tx: number;
  ty: number;
  /** Index into the item's variants — which way it has been turned. */
  facing: number;
};

type HouseState = {
  /** Ids exchanged for with materials. Starters are implicit, never stored. */
  owned: string[];
  /** Room ids built. The starter room is implicit, never stored. */
  rooms: string[];
  placements: Placement[];
};

function defaultState(): HouseState {
  // A small arrangement so the room never opens empty, positioned relative to
  // the starter room rather than the origin — the house grid starts above and
  // to the left of it.
  const seed: Placement[] = [
    { key: "seed-chair", itemId: "chair-dining", tx: 2, ty: 4, facing: 0 },
    { key: "seed-book", itemId: "book-open", tx: 6, ty: 6, facing: 0 },
  ];
  const starters = new Set(starterIds);
  return {
    owned: [],
    rooms: [],
    placements: seed
      .filter((p) => starters.has(p.itemId))
      .map((p) => ({ ...p, tx: p.tx + starterRoom.tx, ty: p.ty + starterRoom.ty })),
  };
}

/**
 * Read one stored placement, or null if it is not one.
 *
 * `facing` is normalised rather than validated: rooms saved before items had
 * more than one view have no facing at all, and dropping those placements
 * would empty an existing room to fix a field that defaults perfectly well.
 */
function readPlacement(entry: unknown): Placement | null {
  if (!entry || typeof entry !== "object") return null;
  const candidate = entry as Partial<Placement>;
  if (
    typeof candidate.key !== "string" ||
    typeof candidate.itemId !== "string" ||
    !Number.isFinite(candidate.tx) ||
    !Number.isFinite(candidate.ty) ||
    !decorById.has(candidate.itemId)
  ) {
    return null;
  }
  return {
    key: candidate.key,
    itemId: candidate.itemId,
    tx: candidate.tx as number,
    ty: candidate.ty as number,
    facing: Number.isFinite(candidate.facing) ? (candidate.facing as number) : 0,
  };
}

function parse(raw: string | null): HouseState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const state = parsed as Partial<HouseState>;

    // Rooms arrived after the first release. A save without them holds
    // placements in the old single-room coordinates, where (0,0) was the
    // room's own top-left; the house grid now starts above and to the left of
    // the starter room. Offsetting by the starter's origin maps that old 10x8
    // room exactly onto the living room, so nothing has to be thrown away.
    const legacy = !Array.isArray(state.rooms);
    const shiftX = legacy ? starterRoom.tx : 0;
    const shiftY = legacy ? starterRoom.ty : 0;

    // Drop anything that no longer matches the catalogue, so a regenerated
    // manifest or an edited rule set can't wedge the room.
    return {
      owned: Array.isArray(state.owned)
        ? state.owned.filter((id): id is string => typeof id === "string" && decorById.has(id))
        : [],
      rooms: Array.isArray(state.rooms)
        ? state.rooms.filter(
            (id): id is string =>
              typeof id === "string" && roomById.has(id) && id !== STARTER_ROOM_ID,
          )
        : [],
      placements: Array.isArray(state.placements)
        ? state.placements
            .map(readPlacement)
            .filter((p): p is Placement => p !== null)
            .map((p) => ({ ...p, tx: p.tx + shiftX, ty: p.ty + shiftY }))
        : [],
    };
  } catch {
    return null;
  }
}

function load(): HouseState {
  if (typeof window === "undefined") return defaultState();
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY)) ?? defaultState();
  } catch {
    return defaultState(); // private mode, storage disabled
  }
}

/**
 * Room layout and the set of items exchanged for, persisted to localStorage.
 *
 * Only `owned` is stored, never a material balance: what is left is always
 * recomputed as earned-minus-spent, so the wallet can never drift away from
 * what the catalogue says things cost.
 *
 * Follows the lazy-initializer pattern from the Next.js "preventing flash
 * before hydration" guide — read storage in the `useState` initializer behind
 * a `window` check, write it back from the handler rather than an effect. No
 * anti-flash inline script is needed: this UI lives in a dialog that only
 * mounts after a click, so it is never server-rendered.
 */
export function useHouseLayout() {
  const [state, setState] = useState<HouseState>(load);

  const commit = useCallback((next: HouseState) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Persisting is best-effort; the room still works for this session.
    }
  }, []);

  const { owned, rooms, placements } = state;

  const ownedOrStarter = useMemo(
    () => new Set([...starterIds, ...owned]),
    [owned],
  );

  /** The rooms that exist, starter first, in plan order. */
  const builtRooms = useMemo(() => unlockedRooms(rooms), [rooms]);

  /**
   * Earned, less what furniture and rooms have both cost. Rooms are charged
   * here rather than inside availableMaterials because they are not
   * catalogue items — but they draw on exactly the same wallet, so a resident
   * cannot spend the same bottle on a sofa and a kitchen.
   */
  const available = useMemo(() => {
    const tally = availableMaterials(owned);
    for (const id of rooms) {
      const room = roomById.get(id);
      if (!room) continue;
      for (const [material, amount] of Object.entries(room.cost)) {
        tally[material as keyof MaterialTally] -= amount as number;
      }
    }
    return tally;
  }, [owned, rooms]);

  /**
   * Put an item in the room, exchanging materials for it first if it is not
   * owned yet. Buying and placing must land in a single commit: as two
   * sequential `setState` calls, the placement would test ownership against
   * the render from before the purchase and be silently dropped.
   *
   * Returns false if the item is unknown or cannot be afforded.
   */
  const acquireAndPlace = useCallback(
    (itemId: string, tx: number, ty: number) => {
      const item = decorById.get(itemId);
      if (!item) return false;

      const alreadyOwned = ownedOrStarter.has(itemId);
      if (!alreadyOwned && !canAfford(item.cost, available)) return false;

      commit({
        ...state,
        owned: alreadyOwned ? owned : [...owned, itemId],
        placements: [
          ...placements,
          {
            key: `${itemId}-${Date.now().toString(36)}-${placements.length}`,
            itemId,
            tx,
            ty,
            facing: 0,
          },
        ],
      });
      return true;
    },
    [available, commit, owned, ownedOrStarter, placements, state],
  );

  /**
   * Build a room, charging its materials.
   *
   * Same single-commit reasoning as acquireAndPlace: the spend and the room
   * have to land together, or the next render would price the room against a
   * wallet that had not been debited yet.
   *
   * Returns false if the room is unknown, already built, or unaffordable.
   */
  const unlockRoom = useCallback(
    (roomId: string) => {
      const room = roomById.get(roomId);
      if (!room || roomId === STARTER_ROOM_ID || rooms.includes(roomId)) return false;
      if (!canAfford(room.cost, available)) return false;

      commit({ ...state, rooms: [...rooms, roomId] });
      return true;
    },
    [available, commit, rooms, state],
  );

  const move = useCallback(
    (key: string, tx: number, ty: number) => {
      commit({
        ...state,
        placements: placements.map((placement) =>
          placement.key === key ? { ...placement, tx, ty } : placement,
        ),
      });
    },
    [commit, placements, state],
  );

  /**
   * Turn a placement to its next view.
   *
   * The facing is left unclamped on purpose — `variantOf` wraps it — so this
   * stays correct if an item ever gains or loses a view, and the position is
   * left alone: a turned piece keeps its tile, and the room only re-clamps it
   * when it is next dragged.
   */
  const rotate = useCallback(
    (key: string) => {
      commit({
        ...state,
        placements: placements.map((placement) => {
          if (placement.key !== key) return placement;
          const item = decorById.get(placement.itemId);
          if (!item || item.variants.length < 2) return placement;
          return { ...placement, facing: (placement.facing + 1) % item.variants.length };
        }),
      });
    },
    [commit, placements, state],
  );

  const remove = useCallback(
    (key: string) => {
      commit({ ...state, placements: placements.filter((p) => p.key !== key) });
    },
    [commit, placements, state],
  );

  /** Clear the room but keep everything already exchanged for. */
  const resetRoom = useCallback(() => {
    commit({ ...state, placements: defaultState().placements });
  }, [commit, state]);

  return {
    placements,
    owned,
    ownedOrStarter,
    builtRooms,
    available,
    acquireAndPlace,
    unlockRoom,
    move,
    rotate,
    remove,
    resetRoom,
  };
}
