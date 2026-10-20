"use client";

import { useState } from "react";

import { MapCanvas, projectToMap } from "@/app/components/drop-off/map-canvas";
import { StationCard } from "@/app/components/drop-off/station-card";
import { FullscreenNavigation } from "@/app/components/home/fullscreen-navigation";
import { PinIcon } from "@/app/components/icons";
import {
  dropOffStations,
  formatDistance,
  homeLocation,
  type DropOffStation,
} from "@/lib/drop-off-data";
import { recyclingBins, type BinId } from "@/lib/scan-data";

type StreamFilter = BinId | "all";

const stationsByDistance = [...dropOffStations].sort(
  (a, b) => a.distanceKm - b.distanceKm,
);

const filters = [
  { id: "all" as const, label: "All" },
  ...recyclingBins
    .filter((bin) => dropOffStations.some((station) => station.accepts.includes(bin.id)))
    .map((bin) => ({ id: bin.id, label: bin.label })),
];

const homeOffset = projectToMap(homeLocation);

const PIN_SPACING = 38;

/** Nudges pins apart when stations sit metres from each other, e.g. inside one mall. */
function layoutPins(stations: DropOffStation[]) {
  const placed: { x: number; y: number }[] = [];

  return stations.map((station) => {
    const base = projectToMap(station.coordinates);
    let point = base;

    for (let step = 1; step <= 24; step += 1) {
      const collides = placed.some(
        (other) => Math.hypot(other.x - point.x, other.y - point.y) < PIN_SPACING,
      );
      if (!collides) break;

      const angle = step * 2.4;
      const radius = PIN_SPACING * (1 + step * 0.18);
      point = {
        x: base.x + Math.cos(angle) * radius,
        y: base.y + Math.sin(angle) * radius,
      };
    }

    placed.push(point);
    return { station, point };
  });
}

export function DropOffScreen() {
  const [selectedFilter, setSelectedFilter] = useState<StreamFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleStations =
    selectedFilter === "all"
      ? stationsByDistance
      : stationsByDistance.filter((station) =>
          station.accepts.includes(selectedFilter),
        );

  const selectedStation =
    visibleStations.find((station) => station.id === selectedId) ?? null;
  const nearest = visibleStations[0];

  function changeFilter(filter: StreamFilter) {
    setSelectedFilter(filter);
    setSelectedId(null);
  }

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-leaf-100">
      <MapCanvas />

      <button
        type="button"
        aria-label="Clear station selection"
        tabIndex={selectedStation ? 0 : -1}
        onClick={() => setSelectedId(null)}
        className={`absolute inset-0 z-10 cursor-default ${
          selectedStation ? "" : "pointer-events-none"
        }`}
      />

      <span
        aria-hidden
        style={{
          left: `calc(50% + ${homeOffset.x}px)`,
          top: `calc(50% + ${homeOffset.y}px)`,
        }}
        className="absolute z-10 block h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orchard-500 shadow-[0_0_0_6px_rgba(226,114,31,0.25)]"
      />

      {layoutPins(visibleStations).map(({ station, point }) => {
        const isSelected = station.id === selectedStation?.id;

        return (
          <button
            key={station.id}
            type="button"
            aria-label={`${station.name}, ${formatDistance(station.distanceKm)} away`}
            aria-pressed={isSelected}
            onClick={() => setSelectedId(isSelected ? null : station.id)}
            style={{
              left: `calc(50% + ${point.x}px)`,
              top: `calc(50% + ${point.y}px)`,
            }}
            className={`absolute z-20 -translate-x-1/2 -translate-y-full transition ${
              isSelected ? "scale-110" : "active:scale-95"
            }`}
          >
            <span
              className={`grid h-9 w-9 place-items-center rounded-full shadow-[0_6px_14px_-6px_rgba(16,40,29,0.8)] ring-2 ring-white ${
                isSelected ? "bg-leaf-800 text-white" : "bg-white text-orchard-500"
              }`}
            >
              <PinIcon className="h-5 w-5" />
            </span>
          </button>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-3 bg-gradient-to-b from-leaf-50/95 via-leaf-50/60 to-transparent px-5 pb-6 pt-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur">
            <FullscreenNavigation />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-leaf-900">
              Drop-off
            </h1>
            <p className="mt-1 text-[11px] text-leaf-800">
              {visibleStations.length}{" "}
              {visibleStations.length === 1 ? "station" : "stations"} near your
              block
            </p>
          </div>
        </div>

        <nav
          aria-label="Filter drop-off stations by material"
          className="pointer-events-auto -mx-5 overflow-x-auto px-5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex w-max flex-nowrap gap-2">
            {filters.map((filter) => (
              <li key={filter.id}>
                <button
                  type="button"
                  aria-pressed={selectedFilter === filter.id}
                  onClick={() => changeFilter(filter.id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium shadow-sm transition ${
                    selectedFilter === filter.id
                      ? "bg-leaf-800 text-white"
                      : "bg-white/90 text-leaf-700 backdrop-blur"
                  }`}
                >
                  {filter.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="absolute bottom-1 left-5 z-20 text-[9px] text-leaf-900/50">
        © OpenStreetMap contributors
      </p>

      <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-[1.75rem] bg-white shadow-[0_-10px_30px_-18px_rgba(16,40,29,0.8)]">
        <span
          aria-hidden
          className="mx-auto mt-2.5 block h-1 w-10 rounded-full bg-leaf-200"
        />

        {selectedStation ? (
          <StationCard
            station={selectedStation}
            isNearest={selectedStation.id === nearest.id}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="px-5 pb-7 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-leaf-700/70">
              Nearest drop-off
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div>
                <p className="text-base font-semibold leading-snug text-leaf-900">
                  {nearest.name}
                </p>
                <p className="mt-0.5 text-[11px] text-leaf-800">
                  {formatDistance(nearest.distanceKm)} away · {nearest.hours}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(nearest.id)}
                className="shrink-0 rounded-full bg-leaf-800 px-4 py-2.5 text-xs font-semibold text-white transition active:scale-95"
              >
                View details
              </button>
            </div>
            <p className="mt-3 text-[11px] text-leaf-700/70">
              Tap a pin on the map to see what each station accepts.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
