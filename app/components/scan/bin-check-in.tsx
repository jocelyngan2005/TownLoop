"use client";

import {
  AlertIcon,
  CheckIcon,
  CoinIcon,
  ScanIcon,
} from "@/app/components/icons";
import { getBin, type RecyclingBin, type ScanItem } from "@/lib/scan-data";

export type BinCheckIn = {
  bin: RecyclingBin;
  item: ScanItem | null;
  outcome: "matched" | "mismatch" | "no-item";
  awardedPoints: number;
};

export function BinCheckIn({
  checkIn,
  onScanItem,
  onDone,
}: {
  checkIn: BinCheckIn;
  onScanItem: () => void;
  onDone: () => void;
}) {
  const { bin, item, outcome, awardedPoints } = checkIn;
  const correctBin = item ? getBin(item.binId) : null;

  return (
    <section
      aria-live="polite"
      className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_-16px_rgba(16,40,29,0.45)] ring-1 ring-leaf-100"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            outcome === "mismatch" ? "bg-clay-500/15" : "bg-leaf-100"
          }`}
        >
          {outcome === "mismatch" ? (
            <AlertIcon className="h-5 w-5 text-clay-600" />
          ) : (
            <CheckIcon className="h-5 w-5 text-leaf-600" />
          )}
        </span>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-leaf-700/70">
            Checked in at
          </p>
          <h2 className="text-lg font-semibold leading-tight text-leaf-900">
            {bin.label}
          </h2>
          <p className="mt-0.5 text-xs text-leaf-700/80">{bin.location}</p>
        </div>
      </div>

      {outcome === "matched" && item && (
        <div className="mt-4 rounded-2xl bg-leaf-50 p-3">
          <p className="text-sm font-semibold text-leaf-900">
            {awardedPoints > 0
              ? `${item.name} belongs here`
              : `${item.name} is correct for this bin`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-leaf-700/85">
            {awardedPoints > 0
              ? "Drop it in — the sorting is logged against your streak."
              : "No points for general waste, but keeping it out of recycling protects the batch."}
          </p>
          {awardedPoints > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-leaf-900 ring-1 ring-leaf-100">
              <CoinIcon className="h-4 w-4 text-sun-400" />+{awardedPoints} pts
              added
            </p>
          )}
        </div>
      )}

      {outcome === "mismatch" && item && correctBin && (
        <div className="mt-4 rounded-2xl bg-clay-500/10 p-3">
          <p className="text-sm font-semibold text-leaf-900">
            Wrong bin for {item.name}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-leaf-700/85">
            This one belongs in{" "}
            <span className="font-semibold text-leaf-900">
              {correctBin.label}
            </span>{" "}
            at {correctBin.location}. Nothing was logged yet.
          </p>
        </div>
      )}

      {outcome === "no-item" && (
        <div className="mt-4 rounded-2xl bg-leaf-50 p-3">
          <p className="text-sm font-semibold text-leaf-900">
            Bin recognised — nothing scanned yet
          </p>
          <p className="mt-1 text-xs leading-relaxed text-leaf-700/85">
            Scan the item you are holding to confirm it belongs in this bin and
            to collect the points.
          </p>
        </div>
      )}

      <dl className="mt-3 space-y-2 rounded-2xl bg-leaf-50 p-3 text-[11px] leading-relaxed text-leaf-800">
        <div>
          <dt className="font-semibold text-leaf-900">Accepts</dt>
          <dd className="text-leaf-700/85">{bin.accepts}</dd>
        </div>
        <div>
          <dt className="font-semibold text-leaf-900">Keep out</dt>
          <dd className="text-leaf-700/85">{bin.rejects}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-semibold text-leaf-900">Bin code</dt>
          <dd className="font-mono text-[10px] tracking-wide text-leaf-700/85">
            {bin.qrCode}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-leaf-50 py-3 text-xs font-semibold text-leaf-900 transition active:scale-[0.98]"
        >
          Scan another bin
        </button>
        <button
          type="button"
          onClick={onScanItem}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-leaf-800 py-3 text-xs font-semibold text-white transition active:scale-[0.98]"
        >
          <ScanIcon className="h-4 w-4" />
          Scan an item
        </button>
      </div>
    </section>
  );
}
