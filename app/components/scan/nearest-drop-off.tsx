"use client";

import Link from "next/link";

import {
  ArrowRightIcon,
  ClockIcon,
  PinIcon,
} from "@/app/components/icons";
import {
  directionsHref,
  formatDistance,
  stationKindLabel,
  stationsAccepting,
} from "@/lib/drop-off-data";
import { getBin, type BinId } from "@/lib/scan-data";

/**
 * Where to take the scanned item. Only some stations accept a given stream, so
 * the verdict is only actionable once the user knows which one is closest.
 *
 * Distances are the hard-coded `distanceKm` from the resident's registered
 * block — the same figures the drop-off map sorts by.
 */
export function NearestDropOff({ binId }: { binId: BinId }) {
  const bin = getBin(binId);
  const [nearest, ...others] = stationsAccepting(binId);

  // General waste has no collection point; the refuse room is the destination.
  if (!nearest) {
    return (
      <div className="mt-4 rounded-2xl bg-leaf-50 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-leaf-700/70">
          Where it goes
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-leaf-800">
          <PinIcon className="mt-px h-3.5 w-3.5 shrink-0 text-orchard-500" />
          No recycling point takes this stream. Use the {bin.label.toLowerCase()}{" "}
          bin at {bin.location}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-leaf-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-leaf-700/70">
            Nearest {bin.label.toLowerCase()} drop-off
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-leaf-900">
            {nearest.name}
          </p>
          <p className="text-[11px] text-leaf-700/70">
            {stationKindLabel[nearest.kind]} · {nearest.operator}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="text-base font-bold leading-none text-leaf-900">
            {formatDistance(nearest.distanceKm)}
          </span>
          <span className="mt-0.5 block text-[10px] text-leaf-700/70">away</span>
        </p>
      </div>

      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-leaf-800">
        <PinIcon className="mt-px h-3.5 w-3.5 shrink-0 text-orchard-500" />
        {nearest.address}
      </p>

      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-leaf-800">
        <ClockIcon className="h-3.5 w-3.5 shrink-0 text-orchard-500" />
        {nearest.hours}
        {nearest.alwaysOpen && (
          <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-medium text-leaf-800">
            Always open
          </span>
        )}
      </p>

      {nearest.note && (
        <p className="mt-2 rounded-xl bg-white px-2.5 py-1.5 text-[11px] leading-relaxed text-leaf-800">
          {nearest.note}
        </p>
      )}

      <a
        href={directionsHref(nearest)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-semibold text-white transition active:scale-[0.98]"
      >
        Get directions
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </a>

      {others.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-leaf-900">
            {others.length} other{" "}
            {others.length === 1 ? "point takes" : "points take"} this
          </summary>
          <ul className="mt-2 space-y-1.5">
            {others.map((station) => (
              <li
                key={station.id}
                className="flex items-center justify-between gap-2 text-[11px] text-leaf-800"
              >
                <a
                  href={directionsHref(station)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate font-medium underline-offset-2 hover:underline"
                >
                  {station.name}
                </a>
                <span className="shrink-0 tabular-nums text-leaf-700/75">
                  {formatDistance(station.distanceKm)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/mobile-app/drop-off"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-leaf-800 underline underline-offset-2"
          >
            See them on the map
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </details>
      )}
    </div>
  );
}

/** One-line variant for lists, e.g. the items left over after a wrong check-in. */
export function NearestDropOffLine({ binId }: { binId: BinId }) {
  const bin = getBin(binId);
  const nearest = stationsAccepting(binId)[0];

  if (!nearest) return null;

  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-leaf-800">
      <PinIcon className="mt-px h-3.5 w-3.5 shrink-0 text-orchard-500" />
      <span>
        <span className="font-semibold text-leaf-900">{bin.label}</span> —{" "}
        {nearest.name}, {formatDistance(nearest.distanceKm)} away ·{" "}
        <a
          href={directionsHref(nearest)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-leaf-800 underline underline-offset-2"
        >
          Directions
        </a>
      </span>
    </p>
  );
}
