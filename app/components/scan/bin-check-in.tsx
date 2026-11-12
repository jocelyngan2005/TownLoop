"use client";

import {
  AlertIcon,
  CheckIcon,
  CoinIcon,
  ScanIcon,
} from "@/app/components/icons";
import { NearestDropOffLine } from "@/app/components/scan/nearest-drop-off";
import type { DisposalReceipt } from "@/lib/points-store";
import { getBin, type BinId, type RecyclingBin } from "@/lib/scan-data";

export type BinCheckIn = {
  bin: RecyclingBin;
  receipt: DisposalReceipt;
  /**
   * "matched" — at least one carried item belonged here and was dropped off.
   * "mismatch" — carrying items, but none belong in this bin.
   * "no-item" — nothing was being carried.
   */
  outcome: "matched" | "mismatch" | "no-item";
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
  const { bin, receipt, outcome } = checkIn;
  const { disposed, remaining, itemPoints, bonus, total } = receipt;

  // One hint per stream, not per item, so two cans do not repeat the address.
  const remainingBinIds = [
    ...new Set(remaining.map((entry) => entry.item.binId)),
  ] as BinId[];

  return (
    <section aria-live="polite">
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

      {outcome === "matched" && (
        <div className="mt-4 rounded-2xl bg-leaf-50 p-3">
          <p className="text-sm font-semibold text-leaf-900">
            {disposed.length === 1
              ? `${disposed[0].item.name} dropped off`
              : `${disposed.length} items dropped off`}
          </p>

          <ul className="mt-2 space-y-1">
            {disposed.map((entry) => (
              <li
                key={entry.uid}
                className="flex items-center justify-between gap-3 text-xs text-leaf-800"
              >
                <span className="truncate">{entry.item.name}</span>
                <span className="shrink-0 tabular-nums text-leaf-700/75">
                  {entry.item.points > 0 ? `+${entry.item.points}` : "0"} pts
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-1 border-t border-leaf-200 pt-2 text-xs text-leaf-800">
            <div className="flex items-center justify-between gap-3">
              <dt>Items</dt>
              <dd className="font-medium tabular-nums">+{itemPoints} pts</dd>
            </div>
            {bonus > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt>Clean sorting bonus</dt>
                <dd className="font-medium tabular-nums text-leaf-700">
                  +{bonus} pts
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-leaf-200 pt-1.5">
              <dt className="font-semibold text-leaf-900">Added to balance</dt>
              <dd className="inline-flex items-center gap-1.5 font-semibold text-leaf-900 tabular-nums">
                <CoinIcon className="h-4 w-4 text-sun-400" />+{total} pts
              </dd>
            </div>
          </dl>

          {remaining.length > 0 && (
            <p className="mt-3 text-[11px] leading-relaxed text-leaf-700/85">
              Still carrying {remaining.length}{" "}
              {remaining.length === 1 ? "item" : "items"} for another bin:{" "}
              <span className="font-semibold text-leaf-900">
                {[
                  ...new Set(
                    remaining.map((entry) => getBin(entry.item.binId).label),
                  ),
                ].join(", ")}
              </span>
              .
            </p>
          )}

          {remaining.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {remainingBinIds.map((binId) => (
                <NearestDropOffLine key={binId} binId={binId} />
              ))}
            </div>
          )}
        </div>
      )}

      {outcome === "mismatch" && (
        <div className="mt-4 rounded-2xl bg-clay-500/10 p-3">
          <p className="text-sm font-semibold text-leaf-900">
            Wrong bin for what you are carrying
          </p>
          <p className="mt-1 text-xs leading-relaxed text-leaf-700/85">
            Nothing was logged. These need a different bin:
          </p>
          <ul className="mt-2 space-y-1">
            {remaining.map((entry) => (
              <li
                key={entry.uid}
                className="flex items-start justify-between gap-3 text-xs text-leaf-800"
              >
                <span className="truncate font-medium">{entry.item.name}</span>
                <span className="shrink-0 text-right text-[11px] text-leaf-700/80">
                  {getBin(entry.item.binId).label}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1.5 border-t border-clay-500/20 pt-2">
            <p className="text-[11px] font-semibold text-leaf-900">
              Take them here instead
            </p>
            {remainingBinIds.map((binId) => (
              <NearestDropOffLine key={binId} binId={binId} />
            ))}
          </div>
        </div>
      )}

      {outcome === "no-item" && (
        <div className="mt-4 rounded-2xl bg-leaf-50 p-3">
          <p className="text-sm font-semibold text-leaf-900">
            Bin recognised — nothing scanned yet
          </p>
          <p className="mt-1 text-xs leading-relaxed text-leaf-700/85">
            Scan the items you are holding first. They stay on your list until
            you check in at the right bin, and a full drop-off earns a clean
            sorting bonus.
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
