import Image from "next/image";

import type { Coordinates } from "@/lib/drop-off-data";

const TILE_SIZE = 256;
const COLUMNS = 5;
const ROWS = 7;

export const MAP_ZOOM = 14;
export const MAP_CENTER: Coordinates = { lat: 3.058, lng: 101.5885 };

function normalizedX(lng: number) {
  return (lng + 180) / 360;
}

function normalizedY(lat: number) {
  const rad = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2;
}

/** Pixel offset of a coordinate from the map centre at the current zoom. */
export function projectToMap({ lat, lng }: Coordinates) {
  const scale = TILE_SIZE * 2 ** MAP_ZOOM;

  return {
    x: (normalizedX(lng) - normalizedX(MAP_CENTER.lng)) * scale,
    y: (normalizedY(lat) - normalizedY(MAP_CENTER.lat)) * scale,
  };
}

export function MapCanvas() {
  const centerTileX = normalizedX(MAP_CENTER.lng) * 2 ** MAP_ZOOM;
  const centerTileY = normalizedY(MAP_CENTER.lat) * 2 ** MAP_ZOOM;
  const originX = Math.floor(centerTileX) - Math.floor(COLUMNS / 2);
  const originY = Math.floor(centerTileY) - Math.floor(ROWS / 2);

  const tiles = Array.from({ length: COLUMNS * ROWS }, (_, index) => {
    const tileX = originX + (index % COLUMNS);
    const tileY = originY + Math.floor(index / COLUMNS);

    return {
      key: `${tileX}-${tileY}`,
      src: `https://tile.openstreetmap.org/${MAP_ZOOM}/${tileX}/${tileY}.png`,
      left: (tileX - centerTileX) * TILE_SIZE,
      top: (tileY - centerTileY) * TILE_SIZE,
    };
  });

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-leaf-100">
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          src={tile.src}
          alt=""
          width={TILE_SIZE}
          height={TILE_SIZE}
          unoptimized
          loading="eager"
          draggable={false}
          className="pointer-events-none absolute max-w-none select-none opacity-90 saturate-[0.85]"
          style={{
            left: `calc(50% + ${tile.left}px)`,
            top: `calc(50% + ${tile.top}px)`,
          }}
        />
      ))}
    </div>
  );
}
