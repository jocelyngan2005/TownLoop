import {
  ArrowRightIcon,
  ClockIcon,
  CloseIcon,
  PinIcon,
} from "@/app/components/icons";
import {
  formatDistance,
  stationKindLabel,
  type DropOffStation,
} from "@/lib/drop-off-data";
import { getBin } from "@/lib/scan-data";

export function StationCard({
  station,
  isNearest = false,
  onClose,
}: {
  station: DropOffStation;
  isNearest?: boolean;
  onClose: () => void;
}) {
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    station.mapsQuery,
  )}`;

  return (
    <div className="px-5 pb-7 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-[10px] font-medium text-leaf-700">
              {stationKindLabel[station.kind]}
            </span>
            {isNearest && (
              <span className="rounded-full bg-orchard-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                Nearest
              </span>
            )}
          </div>
          <p className="mt-1.5 text-base font-semibold leading-snug text-leaf-900">
            {station.name}
          </p>
          <p className="text-[11px] text-leaf-700/70">{station.operator}</p>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <p className="text-right">
            <span className="text-lg font-bold leading-none text-leaf-900">
              {formatDistance(station.distanceKm)}
            </span>
            <span className="mt-0.5 block text-[10px] text-leaf-700/70">away</span>
          </p>
          <button
            type="button"
            aria-label="Close station details"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-leaf-50 text-leaf-900 transition active:scale-95"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-leaf-800">
        <PinIcon className="mt-px h-3.5 w-3.5 shrink-0 text-orchard-500" />
        {station.address}
      </p>

      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-leaf-800">
        <ClockIcon className="h-3.5 w-3.5 shrink-0 text-orchard-500" />
        {station.hours}
        {station.alwaysOpen && (
          <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-[10px] font-medium text-leaf-800">
            Always open
          </span>
        )}
      </p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {station.accepts.map((binId) => {
          const bin = getBin(binId);

          return (
            <li
              key={binId}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-leaf-800 ring-1 ring-inset ring-leaf-100"
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: bin.color }}
              />
              {bin.label}
            </li>
          );
        })}
      </ul>

      {station.note && (
        <p className="mt-3 rounded-2xl bg-leaf-50 px-3 py-2 text-[11px] leading-relaxed text-leaf-800">
          {station.note}
        </p>
      )}

      <a
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-leaf-800 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
      >
        Get directions
        <ArrowRightIcon className="h-4 w-4" />
      </a>
    </div>
  );
}
