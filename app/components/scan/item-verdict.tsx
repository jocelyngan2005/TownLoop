"use client";

import { CheckIcon, CoinIcon, QrCodeIcon } from "@/app/components/icons";
import { getBin, verdictMeta, type ItemMatch } from "@/lib/scan-data";

export function ItemVerdict({
  match,
  onAddAndScan,
  onRemove,
  onContinueToBin,
}: {
  match: ItemMatch;
  onAddAndScan: () => void;
  onRemove: () => void;
  onContinueToBin: () => void;
}) {
  const { item, confidence } = match;
  const meta = verdictMeta[item.verdict];
  const bin = getBin(item.binId);

  return (
    <section aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-leaf-700/70">
            {item.material}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold leading-tight text-leaf-900">
            {item.name}
          </h2>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${meta.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
          {meta.label}
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-leaf-700/85">
        {item.summary}
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-leaf-50 px-3 py-2.5">
        <span
          aria-hidden
          className="h-8 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: bin.color }}
        />
        <div className="min-w-0">
          <p className="text-[11px] text-leaf-700/80">{meta.headline} — bin</p>
          <p className="truncate text-sm font-semibold text-leaf-900">
            {bin.label}
          </p>
        </div>
        <span className="ml-auto shrink-0 text-right">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-leaf-900">
            <CoinIcon className="h-4 w-4 text-sun-400" />
            {item.points > 0 ? `+${item.points}` : "0"}
          </span>
          <span className="block text-[10px] text-leaf-700/70">
            {item.points > 0 ? "on drop-off" : "no points"}
          </span>
        </span>
      </div>

      <h3 className="mt-4 text-xs font-semibold text-leaf-900">
        Before you drop it off
      </h3>
      <ul className="mt-2 space-y-1.5">
        {item.prepSteps.map((step) => (
          <li
            key={step}
            className="flex items-start gap-2 text-xs leading-relaxed text-leaf-700/85"
          >
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-leaf-600" />
            {step}
          </li>
        ))}
      </ul>

      {item.note && (
        <p className="mt-3 rounded-2xl bg-sun-300/25 px-3 py-2 text-[11px] leading-relaxed text-leaf-900">
          {item.note}
        </p>
      )}

      <p className="mt-3 text-[10px] text-leaf-700/60">
        Identified with {Math.round(confidence * 100)}% confidence. Re-scan from
        another angle if this looks wrong.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onAddAndScan}
          className="rounded-full border border-leaf-800 bg-transparent px-2 py-3 text-[11px] font-semibold leading-tight text-leaf-900 transition active:scale-[0.98]"
        >
          Add and scan another item
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-clay-600 px-2 py-3 text-[11px] font-semibold leading-tight text-white transition active:scale-[0.98]"
        >
          Remove item
        </button>
        <button
          type="button"
          onClick={onContinueToBin}
          className="col-span-2 inline-flex items-center justify-center gap-1 rounded-full bg-leaf-800 px-2 py-3 text-[11px] font-semibold leading-tight text-white transition active:scale-[0.98]"
        >
          <QrCodeIcon className="h-3.5 w-3.5 shrink-0" />
          I&apos;m at bin
        </button>
      </div>
    </section>
  );
}
