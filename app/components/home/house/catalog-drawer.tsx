"use client";

import { useMemo, useState } from "react";

import { spriteStyle } from "@/app/components/home/house/decor-sprite";
import {
  CostBreakdown,
  CostChips,
  FactPanel,
  MaterialWallet,
} from "@/app/components/home/house/material-chips";
import {
  canAfford,
  describeCost,
  isFree,
  placeableItems,
  variantOf,
  type DecorItem,
  type MaterialTally,
} from "@/lib/decor-data";

const CATEGORY_LABELS: Record<string, string> = {
  seating: "Seating",
  bedroom: "Bedroom",
  table: "Tables & storage",
  rug: "Rugs",
  decor: "Decor",
  plant: "Plants",
  wall: "Walls & windows",
};

const CATEGORY_ORDER = ["seating", "table", "bedroom", "rug", "plant", "decor", "wall"];

export function CatalogDrawer({
  open,
  available,
  ownedOrStarter,
  onPlace,
  onClose,
}: {
  open: boolean;
  available: MaterialTally;
  ownedOrStarter: Set<string>;
  onPlace: (itemId: string) => void;
  onClose: () => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byCategory = new Map<string, DecorItem[]>();
    for (const item of placeableItems) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return CATEGORY_ORDER.filter((category) => byCategory.get(category)?.length).map(
      (category) => ({ category, items: byCategory.get(category) ?? [] }),
    );
  }, []);

  if (!open) return null;

  const detail = detailId ? placeableItems.find((item) => item.id === detailId) : undefined;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[80%] flex-col rounded-t-3xl bg-leaf-900/97 text-leaf-100 shadow-[0_-18px_40px_-20px_rgba(0,0,0,0.85)] backdrop-blur">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <p className="text-sm font-semibold text-white">Materials workshop</p>
          <p className="text-xs text-leaf-200/90">
            Exchange what you recycled for the things it can be made into
          </p>
        </div>
        <button
          type="button"
          onClick={detail ? () => setDetailId(null) : onClose}
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-leaf-100 transition active:scale-95"
        >
          {detail ? "Back" : "Done"}
        </button>
      </div>

      <MaterialWallet available={available} />

      {detail ? (
        <ItemDetail
          item={detail}
          available={available}
          owned={ownedOrStarter.has(detail.id)}
          onPlace={onPlace}
        />
      ) : (
        <div className="mt-1 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
          {groups.map(({ category, items }) => (
            <section key={category} className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-leaf-300">
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <ul className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <CatalogCard
                      item={item}
                      available={available}
                      owned={ownedOrStarter.has(item.id)}
                      onOpen={() => setDetailId(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogCard({
  item,
  available,
  owned,
  onOpen,
}: {
  item: DecorItem;
  available: MaterialTally;
  owned: boolean;
  onOpen: () => void;
}) {
  const affordable = owned || canAfford(item.cost, available);
  // Catalogue entries always preview their first view; the rest are reached by
  // turning the piece once it is in the room.
  const view = variantOf(item, 0);
  const views = item.variants.length;
  const previewScale = Math.max(1, Math.min(3, Math.floor(56 / Math.max(view.w, view.h))));

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${item.name}. ${owned ? "Owned." : describeCost(item.cost)}.${
        views > 1 ? ` ${views} views.` : ""
      } Open details.`}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-2 text-left transition active:scale-[0.98]"
    >
      <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-black/25">
        <span
          aria-hidden
          style={{
            ...spriteStyle(view, previewScale),
            opacity: affordable ? 1 : 0.3,
            filter: affordable ? undefined : "grayscale(1)",
          }}
        />
        {views > 1 && (
          <span
            aria-hidden
            className="absolute bottom-0.5 right-0.5 rounded bg-black/55 px-1 text-[9px] font-semibold tabular-nums text-leaf-200"
          >
            {views} views
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-white">{item.name}</span>
        <span className="mt-1 block">
          {owned ? (
            <span className="text-[11px] font-medium text-leaf-300">Owned · tap to place</span>
          ) : (
            <CostChips cost={item.cost} available={available} />
          )}
        </span>
      </span>
    </button>
  );
}

function ItemDetail({
  item,
  available,
  owned,
  onPlace,
}: {
  item: DecorItem;
  available: MaterialTally;
  owned: boolean;
  onPlace: (itemId: string) => void;
}) {
  const affordable = canAfford(item.cost, available);
  const views = item.variants;
  const hero = variantOf(item, 0);
  const previewScale = Math.max(2, Math.min(4, Math.floor(96 / Math.max(hero.w, hero.h))));
  // The strip below the heading has to hold every view on a phone-width
  // drawer, so size it against the row's total width rather than the tallest
  // piece — four armchairs at the hero scale would run off the screen.
  const stripWidth = views.reduce((total, view) => total + view.w, 0);
  const stripScale = Math.max(1, Math.min(3, Math.floor(180 / stripWidth)));

  return (
    <div className="mt-1 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
      <div className="flex items-center gap-4">
        <span className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-black/25">
          <span aria-hidden style={spriteStyle(hero, previewScale)} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">{item.name}</h3>
          <p className="mt-1 text-xs text-leaf-200/90">
            {isFree(item.cost) ? "No materials needed" : `Needs ${describeCost(item.cost)}`}
          </p>
          {views.length > 1 && (
            <>
              {/* Shown together so a four-facing piece reads as one object
                  before it is placed. There is no picker — it goes down
                  front-on and the resident turns it in the room. */}
              <span className="mt-2 flex items-end gap-1.5">
                {views.map((view) => (
                  <span
                    key={view.facing}
                    aria-hidden
                    className="block"
                    style={spriteStyle(view, stripScale)}
                  />
                ))}
              </span>
              <p className="mt-1 text-[11px] text-leaf-300">
                {views.length} views · tap Turn once it is in the room
              </p>
            </>
          )}
        </div>
      </div>

      <CostBreakdown cost={item.cost} available={available} />

      <FactPanel fact={item.fact} />

      <div className="mt-5">
        {owned ? (
          <button
            type="button"
            onClick={() => onPlace(item.id)}
            className="w-full rounded-full bg-leaf-300 px-4 py-3 text-sm font-semibold text-leaf-900 transition active:scale-95"
          >
            Place in room
          </button>
        ) : (
          <button
            type="button"
            disabled={!affordable}
            onClick={() => onPlace(item.id)}
            className="w-full rounded-full bg-leaf-300 px-4 py-3 text-sm font-semibold text-leaf-900 transition enabled:active:scale-95 disabled:bg-white/10 disabled:text-leaf-200/60"
          >
            {affordable ? "Exchange materials" : "Not enough materials yet"}
          </button>
        )}
        {!owned && !affordable && (
          <p className="mt-2 text-center text-[11px] text-leaf-200/70">
            Keep recycling to collect what this needs.
          </p>
        )}
      </div>
    </div>
  );
}
