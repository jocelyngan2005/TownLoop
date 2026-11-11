"use client";

import { useMemo, useState } from "react";

import { spriteStyle } from "@/app/components/home/house/decor-sprite";
import {
  MATERIALS,
  canAfford,
  decorItems,
  describeCost,
  isFree,
  materialById,
  type DecorItem,
  type MaterialCost,
  type MaterialId,
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
  floor: "Floors",
};

const CATEGORY_ORDER = ["seating", "table", "bedroom", "rug", "plant", "decor", "wall", "floor"];

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
    for (const item of decorItems) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return CATEGORY_ORDER.filter((category) => byCategory.get(category)?.length).map(
      (category) => ({ category, items: byCategory.get(category) ?? [] }),
    );
  }, []);

  if (!open) return null;

  const detail = detailId ? decorItems.find((item) => item.id === detailId) : undefined;

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

function MaterialWallet({ available }: { available: MaterialTally }) {
  return (
    <div className="mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
      {MATERIALS.map((material) => {
        const count = available[material.id];
        return (
          <span
            key={material.id}
            title={`${count} ${material.plural} left`}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium"
          >
            <span aria-hidden className="text-leaf-300">
              {material.symbol}
            </span>
            <span className="tabular-nums text-white">{count}</span>
            <span className="sr-only">{material.plural} left</span>
          </span>
        );
      })}
    </div>
  );
}

/** Compact "8 ▣  2 ▤" cost chips, dimmed per material when short. */
function CostChips({
  cost,
  available,
}: {
  cost: MaterialCost;
  available: MaterialTally;
}) {
  const entries = Object.entries(cost) as [MaterialId, number][];
  if (entries.length === 0) {
    return <span className="text-[11px] font-medium text-leaf-300">Free</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {entries.map(([material, amount]) => {
        const def = materialById.get(material);
        const enough = available[material] >= amount;
        return (
          <span
            key={material}
            className={`rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums ${
              enough ? "bg-white/10 text-leaf-100" : "bg-clay-600/30 text-clay-400"
            }`}
          >
            {amount} <span aria-hidden>{def?.symbol}</span>
            <span className="sr-only">{def?.plural}</span>
          </span>
        );
      })}
    </span>
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
  const previewScale = Math.max(1, Math.min(3, Math.floor(56 / Math.max(item.w, item.h))));

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${item.name}. ${owned ? "Owned." : describeCost(item.cost)}. Open details.`}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-2 text-left transition active:scale-[0.98]"
    >
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-black/25">
        <span
          aria-hidden
          style={{
            ...spriteStyle(item, previewScale),
            opacity: affordable ? 1 : 0.3,
            filter: affordable ? undefined : "grayscale(1)",
          }}
        />
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
  const entries = Object.entries(item.cost) as [MaterialId, number][];
  const affordable = canAfford(item.cost, available);
  const previewScale = Math.max(2, Math.min(4, Math.floor(96 / Math.max(item.w, item.h))));

  return (
    <div className="mt-1 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
      <div className="flex items-center gap-4">
        <span className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-black/25">
          <span aria-hidden style={spriteStyle(item, previewScale)} />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white">{item.name}</h3>
          <p className="mt-1 text-xs text-leaf-200/90">
            {isFree(item.cost) ? "No materials needed" : `Needs ${describeCost(item.cost)}`}
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {entries.map(([material, amount]) => {
            const def = materialById.get(material);
            const have = available[material];
            const enough = have >= amount;
            return (
              <li
                key={material}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-2 text-leaf-100">
                  <span aria-hidden className="text-leaf-300">
                    {def?.symbol}
                  </span>
                  {amount === 1 ? def?.name : def?.plural}
                </span>
                <span
                  className={`tabular-nums font-semibold ${
                    enough ? "text-leaf-300" : "text-clay-400"
                  }`}
                >
                  {have} / {amount}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* The educational payload: why these particular materials. */}
      <section className="mt-4 rounded-2xl border border-sun-400/30 bg-sun-400/10 p-4">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sun-300">
          <span aria-hidden>💡</span> Do you know?
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-leaf-100/90">{item.fact}</p>
      </section>

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
