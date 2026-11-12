import {
  MATERIALS,
  materialById,
  type MaterialCost,
  type MaterialId,
  type MaterialTally,
} from "@/lib/decor-data";

/**
 * The resident's wallet: what is left of each material after everything they
 * have exchanged for. Shared by the furniture workshop and the room sheet so
 * the two always read the same balance in the same order.
 */
export function MaterialWallet({ available }: { available: MaterialTally }) {
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
export function CostChips({
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

/** The itemised "you have 4 of the 9 you need" list used in both detail views. */
export function CostBreakdown({
  cost,
  available,
}: {
  cost: MaterialCost;
  available: MaterialTally;
}) {
  const entries = Object.entries(cost) as [MaterialId, number][];
  if (entries.length === 0) return null;

  return (
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
  );
}

/** The educational payload, shared by furniture and rooms. */
export function FactPanel({ fact }: { fact: string }) {
  return (
    <section className="mt-4 rounded-2xl border border-sun-400/30 bg-sun-400/10 p-4">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sun-300">
        <span aria-hidden>💡</span> Do you know?
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-leaf-100/90">{fact}</p>
    </section>
  );
}
