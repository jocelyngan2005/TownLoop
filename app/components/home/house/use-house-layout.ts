"use client";

import { useCallback, useMemo, useState } from "react";

import {
  availableMaterials,
  canAfford,
  decorById,
  starterIds,
} from "@/lib/decor-data";

export const STORAGE_KEY = "townloop.house.v2";

/** One item placed in the room, positioned by its top-left tile. */
export type Placement = {
  /** Unique per placement, so the same item can be placed more than once. */
  key: string;
  itemId: string;
  tx: number;
  ty: number;
};

type HouseState = {
  /** Ids exchanged for with materials. Starters are implicit, never stored. */
  owned: string[];
  placements: Placement[];
};

function defaultState(): HouseState {
  // A small arrangement so the room never opens empty.
  const seed: Placement[] = [
    { key: "seed-chair", itemId: "chair-dining", tx: 2, ty: 4 },
    { key: "seed-book", itemId: "book-open", tx: 6, ty: 6 },
  ];
  const starters = new Set(starterIds);
  return { owned: [], placements: seed.filter((p) => starters.has(p.itemId)) };
}

function isPlacement(entry: unknown): entry is Placement {
  const candidate = entry as Placement;
  return (
    !!entry &&
    typeof entry === "object" &&
    typeof candidate.key === "string" &&
    typeof candidate.itemId === "string" &&
    Number.isFinite(candidate.tx) &&
    Number.isFinite(candidate.ty) &&
    decorById.has(candidate.itemId)
  );
}

function parse(raw: string | null): HouseState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const state = parsed as Partial<HouseState>;
    // Drop anything that no longer matches the catalogue, so a regenerated
    // manifest or an edited rule set can't wedge the room.
    return {
      owned: Array.isArray(state.owned)
        ? state.owned.filter((id): id is string => typeof id === "string" && decorById.has(id))
        : [],
      placements: Array.isArray(state.placements) ? state.placements.filter(isPlacement) : [],
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

  const { owned, placements } = state;

  const ownedOrStarter = useMemo(
    () => new Set([...starterIds, ...owned]),
    [owned],
  );

  const available = useMemo(() => availableMaterials(owned), [owned]);

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
        owned: alreadyOwned ? owned : [...owned, itemId],
        placements: [
          ...placements,
          {
            key: `${itemId}-${Date.now().toString(36)}-${placements.length}`,
            itemId,
            tx,
            ty,
          },
        ],
      });
      return true;
    },
    [available, commit, owned, ownedOrStarter, placements],
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
    available,
    acquireAndPlace,
    move,
    remove,
    resetRoom,
  };
}
