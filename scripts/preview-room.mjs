// Compose a static preview of the whole house so the floor plan, the lining
// around its silhouette and the furniture scale can all be judged without a
// browser.
//
// Reads the same lib/house-geometry.mjs the app does, so the outline here is
// the outline room-canvas.tsx draws — this is a check on that code, not a
// second implementation of it.
//
// Usage: node scripts/preview-room.mjs --out <file.png> [--scale 4] [--rooms a,b]
import fs from "node:fs";
import path from "node:path";

import {
  ROOM_LAYOUT,
  STARTER_ROOM_ID,
  houseBounds,
  liningGeometry,
} from "../lib/house-geometry.mjs";
import { blank, crop, decodePNG, encodePNG, paste, scale as upscale } from "./lib/png.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TILE = 16;

/**
 * A deliberately busy arrangement spread across every room, in house tile
 * coordinates. Fourth column is the facing index, so turned pieces and the
 * per-room clamping both get exercised.
 */
const SCENE = [
  // Kitchen
  ["cabinet", 1, 2],
  ["table-long", 4, 2],
  ["window", 6, 0],
  // Hall
  ["bookshelf", 8, 6],
  ["plant-tall", 11, 7],
  // Bedroom
  ["bed-blue", 14, 3],
  ["bedside-table", 19, 3],
  ["picture-portrait", 16, 0],
  ["curtains-red", 21, 0],
  // Living room
  ["sofa-red", 1, 13],
  ["armchair", 6, 13, 1],
  ["rug-red", 2, 12],
  ["bookshelf", 9, 11],
  ["chair-dining", 8, 14, 3],
  ["book-open", 5, 15],
];

function main() {
  const argv = process.argv.slice(2);
  const get = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i === -1 ? dflt : argv[i + 1];
  };
  const out = get("--out", "/tmp/house-preview.png");
  const factor = Number(get("--scale", 4));
  // Default to the finished house; --rooms renders a partial build, so the
  // starter-only state a new resident sees can be checked too. The starter is
  // always included, which is what unlockedRooms() does in the app.
  const only = get("--rooms", null);
  const wanted = only === null ? null : new Set(only.split(",").filter(Boolean));
  const rooms =
    wanted === null
      ? ROOM_LAYOUT
      : ROOM_LAYOUT.filter((r) => r.id === STARTER_ROOM_ID || wanted.has(r.id));

  const sheet = decodePNG(path.join(ROOT, "public/interiors_demo.png"));
  const catalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, "lib/decor-catalog.json"), "utf8"),
  );
  const byId = new Map(catalog.items.map((i) => [i.id, i]));

  /** One view of an entry, matching variantOf() in lib/decor-data.ts. */
  const view = (id, facing = 0) => {
    const entry = byId.get(id);
    if (!entry) return null;
    const { variants } = entry;
    return { id, ...variants[((facing % variants.length) + variants.length) % variants.length] };
  };

  // The canvas spans the WHOLE plan, not just what is built — same as
  // RoomCanvas, which needs the room it keeps for unbuilt outlines. Getting
  // this wrong is not hypothetical: drawing the lining in the built rooms'
  // own frame instead of the canvas's put it nine tiles too high on screen,
  // and a preview sized to the built rooms could not see it, because there
  // the two frames happen to coincide.
  const bounds = houseBounds(ROOM_LAYOUT, TILE);
  const unbuilt = ROOM_LAYOUT.filter((r) => !rooms.includes(r));
  const house = blank(bounds.width, bounds.height, [0, 0, 0, 0]);
  // House tile -> canvas pixel.
  const px = (tx) => (tx - bounds.tx) * TILE;
  const py = (ty) => (ty - bounds.ty) * TILE;

  // Rooms still to build, as the dashed placeholders the app shows.
  for (const room of unbuilt) {
    outline(house, px(room.tx), py(room.ty), room.cols * TILE, room.rows * TILE);
  }

  // Each room tiles its own wall band and floor, same as RoomSurface. The
  // per-room tint is a CSS filter in the app and has no equivalent here, so
  // this preview shows the untinted art — which is the right thing to check
  // the geometry against anyway.
  for (const room of rooms) {
    const wall = view(room.wallId);
    const floor = view(room.floorId);
    const wallH = room.wallRows * TILE;
    const clipW = room.cols * TILE;

    if (wall) {
      const tile = crop(sheet, wall.x, wall.y, wall.w, wall.h);
      // Anchored to the bottom, matching RoomSurface: the wall sprites are
      // 48px tall and some rooms have a 32px band, so tiling from the top
      // would crop the skirting board off the floor line.
      for (let y = wallH - wall.h; y > -wall.h; y -= wall.h) {
        for (let x = 0; x < clipW; x += wall.w) {
          pasteClipped(
            house, tile,
            px(room.tx) + x, py(room.ty) + y,
            px(room.tx), py(room.ty), clipW, wallH,
          );
        }
      }
    }
    if (floor) {
      const tile = crop(sheet, floor.x, floor.y, floor.w, floor.h);
      const floorH = (room.rows - room.wallRows) * TILE;
      for (let y = 0; y < floorH; y += floor.h) {
        for (let x = 0; x < clipW; x += floor.w) {
          pasteClipped(
            house, tile,
            px(room.tx) + x, py(room.ty) + wallH + y,
            px(room.tx), py(room.ty) + wallH, clipW, floorH,
          );
        }
      }
    }
  }

  // Depth sort by foot position with rugs first, as the house canvas does.
  // Pieces belonging to rooms that are not built are left out, so a partial
  // build shows only what the resident could actually have placed.
  const inHouse = (tx, ty) =>
    rooms.some((r) => tx >= r.tx && tx < r.tx + r.cols && ty >= r.ty && ty < r.ty + r.rows);

  const placed = SCENE.filter(([, tx, ty]) => inHouse(tx, ty))
    .map(([id, tx, ty, facing]) => ({
      item: view(id, facing),
      entry: byId.get(id),
      tx,
      ty,
    }))
    .filter((p) => p.item)
    .sort((a, b) => {
      const flat = (p) => (p.entry?.category === "rug" ? 0 : 1);
      return flat(a) - flat(b) || a.ty * TILE + a.item.h - (b.ty * TILE + b.item.h);
    });

  for (const { item, tx, ty } of placed) {
    paste(house, crop(sheet, item.x, item.y, item.w, item.h), px(tx), py(ty));
    const overflowX = px(tx) + item.w > bounds.width;
    const overflowY = py(ty) + item.h > bounds.height;
    if (overflowX || overflowY) {
      console.log(
        `  ${item.id} (${item.w}x${item.h}) overflows the house at tile ${tx},${ty}` +
          `${overflowX ? " [x]" : ""}${overflowY ? " [y]" : ""}`,
      );
    }
  }

  pasteLining(house, sheet, rooms, catalog.lining, bounds);

  fs.writeFileSync(out, encodePNG(upscale(house, factor)));
  console.log(
    `house ${bounds.width}x${bounds.height} (${bounds.cols}x${bounds.rows} tiles), ` +
      `${rooms.length} room(s) -> ${out}`,
  );
  console.log("item footprints (tiles):");
  for (const { item } of placed) {
    console.log(
      `  ${item.id.padEnd(17)} ${(item.w / TILE).toFixed(1)}x${(item.h / TILE).toFixed(1)}`,
    );
  }
}

/** A dashed placeholder for a room that has not been built yet. */
function outline(img, x, y, w, h) {
  const dot = (px, py) => {
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) return;
    const d = (py * img.width + px) * 4;
    img.data[d] = 210;
    img.data[d + 1] = 220;
    img.data[d + 2] = 214;
    img.data[d + 3] = 255;
  };
  for (let i = 0; i < w; i += 1) {
    if (i % 6 < 3) {
      dot(x + i, y);
      dot(x + i, y + h - 1);
    }
  }
  for (let i = 0; i < h; i += 1) {
    if (i % 6 < 3) {
      dot(x, y + i);
      dot(x + w - 1, y + i);
    }
  }
}

/** paste(), but refusing to spill outside one room's rectangle. */
function pasteClipped(dst, src, dx, dy, clipX, clipY, clipW, clipH) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const tx = dx + x;
      const ty = dy + y;
      if (tx < clipX || ty < clipY || tx >= clipX + clipW || ty >= clipY + clipH) continue;
      if (tx < 0 || ty < 0 || tx >= dst.width || ty >= dst.height) continue;
      const s = (y * src.width + x) * 4;
      if (src.data[s + 3] <= 8) continue;
      const d = (ty * dst.width + tx) * 4;
      dst.data[d] = src.data[s];
      dst.data[d + 1] = src.data[s + 1];
      dst.data[d + 2] = src.data[s + 2];
      dst.data[d + 3] = 255;
    }
  }
}

/**
 * Draw the wooden lining over the finished house, mirroring HouseLining in
 * room-canvas.tsx: repeat each 1px edge strip along its run, then drop the
 * corner sprites on top. Slices are re-cut from the source sheet so this
 * stays honest if public/sprites/decor/lining/ ever drifts from the manifest.
 */
function pasteLining(house, sheet, rooms, lining, origin) {
  if (!lining) return;
  const i = lining.inset;
  const { x, y, w, h } = lining.rect;
  const midX = x + (w >> 1);
  const midY = y + (h >> 1);

  const slice = {
    tl: crop(sheet, x, y, i, i),
    tr: crop(sheet, x + w - i, y, i, i),
    bl: crop(sheet, x, y + h - i, i, i),
    br: crop(sheet, x + w - i, y + h - i, i, i),
    top: crop(sheet, midX, y, 1, i),
    bottom: crop(sheet, midX, y + h - i, 1, i),
    left: crop(sheet, x, midY, i, 1),
    right: crop(sheet, x + w - i, midY, i, 1),
  };

  const { runs, corners } = liningGeometry(rooms, TILE, i, origin);

  for (const run of runs) {
    const strip = slice[run.side];
    for (let dy = 0; dy < run.h; dy += 1) {
      for (let dx = 0; dx < run.w; dx += 1) {
        const sx = strip.width === 1 ? 0 : dx % strip.width;
        const sy = strip.height === 1 ? 0 : dy % strip.height;
        const s = (sy * strip.width + sx) * 4;
        if (strip.data[s + 3] <= 8) continue;
        const tx = run.x + dx;
        const ty = run.y + dy;
        if (tx < 0 || ty < 0 || tx >= house.width || ty >= house.height) continue;
        const d = (ty * house.width + tx) * 4;
        house.data[d] = strip.data[s];
        house.data[d + 1] = strip.data[s + 1];
        house.data[d + 2] = strip.data[s + 2];
        house.data[d + 3] = 255;
      }
    }
  }

  for (const corner of corners) paste(house, slice[corner.piece], corner.x, corner.y);
}

main();
