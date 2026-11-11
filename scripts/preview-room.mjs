// Compose a static preview of the room so furniture scale and the tiled
// floor/wall can be judged without a browser. Mirrors the constants in
// app/components/home/house/room-canvas.tsx.
//
// Usage: node scripts/preview-room.mjs --out <file.png> [--scale 4]
import fs from "node:fs";
import path from "node:path";

import { blank, crop, decodePNG, encodePNG, paste, scale as upscale } from "./lib/png.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TILE = 16;
const ROOM_COLS = 10;
const ROOM_ROWS = 8;
const WALL_ROWS = 3;
const ROOM_W = ROOM_COLS * TILE;
const ROOM_H = ROOM_ROWS * TILE;
const WALL_H = WALL_ROWS * TILE;

// A deliberately busy arrangement: the biggest pieces plus a few small ones.
const SCENE = [
  ["wall-drape-blue", 0, 0],
  ["window", 6, 1],
  ["bed-blue", 0, 2],
  ["bookshelf", 4, 2],
  ["sofa-red", 5, 5],
  ["plant-tall", 9, 4],
  ["chair-dining", 3, 6],
  ["book-open", 8, 7],
];

function main() {
  const argv = process.argv.slice(2);
  const get = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i === -1 ? dflt : argv[i + 1];
  };
  const out = get("--out", "/tmp/room-preview.png");
  const factor = Number(get("--scale", 4));

  const sheet = decodePNG(path.join(ROOT, "public/interiors_demo.png"));
  const catalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, "lib/decor-catalog.json"), "utf8"),
  );
  const byId = new Map(catalog.items.map((i) => [i.id, i]));

  const room = blank(ROOM_W, ROOM_H, [0, 0, 0, 0]);

  // Tile the wall then the floor, same as the CSS background-repeat layers.
  const wall = byId.get("wall-stone");
  const wallTile = crop(sheet, wall.x, wall.y, wall.w, wall.h);
  for (let x = 0; x < ROOM_W; x += wall.w) paste(room, wallTile, x, 0);

  const floor = byId.get("floor-wood");
  const floorTile = crop(sheet, floor.x, floor.y, floor.w, floor.h);
  for (let y = WALL_H; y < ROOM_H; y += floor.h) {
    for (let x = 0; x < ROOM_W; x += floor.w) paste(room, floorTile, x, y);
  }

  // Depth sort by foot position, as the room canvas does.
  const placed = SCENE.map(([id, tx, ty]) => ({ item: byId.get(id), tx, ty }))
    .filter((p) => p.item)
    .sort((a, b) => a.ty * TILE + a.item.h - (b.ty * TILE + b.item.h));

  for (const { item, tx, ty } of placed) {
    paste(room, crop(sheet, item.x, item.y, item.w, item.h), tx * TILE, ty * TILE);
    const overflowX = tx * TILE + item.w > ROOM_W;
    const overflowY = ty * TILE + item.h > ROOM_H;
    if (overflowX || overflowY) {
      console.log(
        `  ${item.id} (${item.w}x${item.h}) overflows at tile ${tx},${ty}` +
          `${overflowX ? " [x]" : ""}${overflowY ? " [y]" : ""}`,
      );
    }
  }

  fs.writeFileSync(out, encodePNG(upscale(room, factor)));
  console.log(`room ${ROOM_W}x${ROOM_H} (${ROOM_COLS}x${ROOM_ROWS} tiles) -> ${out}`);
  console.log("item footprints (tiles):");
  for (const { item } of placed) {
    console.log(
      `  ${item.id.padEnd(16)} ${(item.w / TILE).toFixed(1)}x${(item.h / TILE).toFixed(1)}` +
        `  = ${((item.w * item.h) / (ROOM_W * ROOM_H) * 100).toFixed(0)}% of room`,
    );
  }
}

main();
