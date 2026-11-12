// Compose a static preview of the whole home screen — garden backdrop and
// house — so the look can be judged without a browser.
//
// Mirrors app/components/home/house/garden-backdrop.tsx and room-canvas.tsx,
// and reads the floor plan from lib/house-geometry.mjs so the silhouette is
// the real one. It is a visual check, not a renderer: if those components
// change, this drifts.
//
// Two things it deliberately leaves out, both pure CSS in the app: the
// per-room colour tint, and the dashed outlines of rooms not yet built (which
// is also why the canvas here is sized to the built house rather than to the
// whole plan).
//
// Usage: node scripts/preview-house.mjs --out <file.png> [--scale 2] [--rooms a,b]
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

// Phone-sized viewport in CSS pixels.
const VIEW_W = 390;
const VIEW_H = 844;

const TILE = 16;
/** Matches MIN_SCALE in room-canvas.tsx: below this the house scrolls. */
const MIN_SCALE = 2;

const GRASS_LIGHT = [0x59, 0xc1, 0x35];
const LEAF_900 = [0x0f, 0x30, 0x22];

const TREES = [
  { id: "tree-big", left: -6, top: 2, scale: 3 },
  { id: "tree-pine", left: 78, top: 1, scale: 3 },
  { id: "tree-bush", left: 88, top: 20, scale: 2 },
  { id: "tree-bush", left: 2, top: 74, scale: 2 },
  { id: "tree-pine", left: 86, top: 80, scale: 3 },
  { id: "tree-big", left: 62, top: 86, scale: 2 },
];

const SCATTER_COUNT = 64;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vertical scrim matching `from-leaf-900/75 via-leaf-900/10 to-leaf-900/85`. */
/**
 * The backing panel behind the heading. The garden carries no scrim any more,
 * so the only darkening in the view is local to the text that needs it — this
 * mirrors the panel in house-view.tsx.
 */
function panel(img, x, y, w, h, alpha = 0.7) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
      const d = (py * img.width + px) * 4;
      for (let c = 0; c < 3; c += 1) {
        img.data[d + c] = img.data[d + c] * (1 - alpha) + LEAF_900[c] * alpha;
      }
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const get = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i === -1 ? dflt : argv[i + 1];
  };
  const out = get("--out", "/tmp/house-preview.png");
  const viewScale = Number(get("--scale", 2));
  // Default to the finished house; --rooms renders a partial build. The
  // starter is always in, which is what unlockedRooms() does in the app.
  const only = get("--rooms", null);
  const wanted = only === null ? null : new Set(only.split(",").filter(Boolean));
  const rooms =
    wanted === null
      ? ROOM_LAYOUT
      : ROOM_LAYOUT.filter((r) => r.id === STARTER_ROOM_ID || wanted.has(r.id));

  const woods = decodePNG(path.join(ROOT, "public/free_pixel_16_woods.png"));
  const interiors = decodePNG(path.join(ROOT, "public/interiors_demo.png"));
  const garden = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/garden-catalog.json"), "utf8"));
  const decor = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/decor-catalog.json"), "utf8"));
  const gardenById = new Map(garden.items.map((i) => [i.id, i]));
  const decorById = new Map(decor.items.map((i) => [i.id, i]));

  const view = blank(VIEW_W, VIEW_H, [...GRASS_LIGHT, 255]);

  // Darker terrain blobs.
  const patch = gardenById.get("grass-patch");
  for (const blob of [
    { left: -10, top: 10, scale: 4 },
    { left: 55, top: 48, scale: 5 },
    { left: 10, top: 70, scale: 3 },
  ]) {
    const sprite = upscale(crop(woods, patch.x, patch.y, patch.w, patch.h), blob.scale);
    paste(view, sprite, Math.round((blob.left / 100) * VIEW_W), Math.round((blob.top / 100) * VIEW_H));
  }

  // Scatter, same PRNG and seed as the component.
  const scatterSprites = garden.items.filter((i) => i.category === "scatter");
  const random = mulberry32(0x7a11b0);
  for (let i = 0; i < SCATTER_COUNT; i += 1) {
    const item = scatterSprites[Math.floor(random() * scatterSprites.length)];
    const left = random() * 100;
    const top = random() * 100;
    const s = random() < 0.25 ? 3 : 2;
    paste(
      view,
      upscale(crop(woods, item.x, item.y, item.w, item.h), s),
      Math.round((left / 100) * VIEW_W),
      Math.round((top / 100) * VIEW_H),
    );
  }

  for (const tree of TREES) {
    const item = gardenById.get(tree.id);
    paste(
      view,
      upscale(crop(woods, item.x, item.y, item.w, item.h), tree.scale),
      Math.round((tree.left / 100) * VIEW_W),
      Math.round((tree.top / 100) * VIEW_H),
    );
  }

  // The heading's own backing panel, since the garden is no longer darkened.
  panel(view, 18, 14, 232, 62);

  // Entries carry a list of views; `facing` picks one, the same way
  // variantOf() does in the app.
  const decorView = (id, facing = 0) => {
    const entry = decorById.get(id);
    if (!entry) return null;
    const { variants } = entry;
    return variants[((facing % variants.length) + variants.length) % variants.length];
  };

  const bounds = houseBounds(rooms, TILE);
  const house = blank(bounds.width, bounds.height, [0, 0, 0, 0]);
  const px = (tx) => (tx - bounds.tx) * TILE;
  const py = (ty) => (ty - bounds.ty) * TILE;

  for (const room of rooms) {
    const wall = decorView(room.wallId);
    const floor = decorView(room.floorId);
    const wallH = room.wallRows * TILE;
    const roomW = room.cols * TILE;
    const clip = [px(room.tx), py(room.ty), roomW, room.rows * TILE];

    if (wall) {
      const tile = crop(interiors, wall.x, wall.y, wall.w, wall.h);
      // Bottom-anchored, so the skirting lands on the floor line even in the
      // rooms whose wall band is shorter than the 48px sprite.
      for (let y = wallH - wall.h; y > -wall.h; y -= wall.h) {
        for (let x = 0; x < roomW; x += wall.w) {
          clipPaste(house, tile, px(room.tx) + x, py(room.ty) + y, ...clip, wallH);
        }
      }
    }
    if (floor) {
      const tile = crop(interiors, floor.x, floor.y, floor.w, floor.h);
      for (let y = wallH; y < room.rows * TILE; y += floor.h) {
        for (let x = 0; x < roomW; x += floor.w) {
          clipPaste(house, tile, px(room.tx) + x, py(room.ty) + y, ...clip);
        }
      }
    }
  }

  for (const [id, tx, ty, facing] of [
    ["sofa-red", 2, 13, 0],
    ["bookshelf", 9, 11, 0],
    ["chair-dining", 6, 14, 1],
    ["plant-tall", 11, 7, 0],
    ["bed-blue", 14, 3, 0],
    ["table-long", 4, 2, 0],
  ]) {
    const item = decorView(id, facing);
    if (!item) continue;
    if (!rooms.some((r) => tx >= r.tx && tx < r.tx + r.cols && ty >= r.ty && ty < r.ty + r.rows)) {
      continue;
    }
    paste(house, crop(interiors, item.x, item.y, item.w, item.h), px(tx), py(ty));
  }

  pasteLining(house, interiors, rooms, decor.lining, bounds);

  // Scaled the way RoomCanvas does: fit to whole pixels, never below
  // MIN_SCALE, since past that point the frame scrolls instead of shrinking.
  const frameW = VIEW_W - 32;
  const frameH = VIEW_H - 300;
  const houseScale = Math.max(
    MIN_SCALE,
    Math.min(Math.floor(frameW / bounds.width), Math.floor(frameH / bounds.height)),
  );
  const housePx = upscale(house, houseScale);
  // Clipped to the frame, because that is what the resident sees before they
  // scroll — a house wider than the viewport should look cut off here too.
  const clipW = Math.min(housePx.width, frameW);
  const clipH = Math.min(housePx.height, frameH);
  const visible = crop(
    housePx,
    (housePx.width - clipW) >> 1,
    (housePx.height - clipH) >> 1,
    clipW,
    clipH,
  );
  paste(view, visible, (VIEW_W - clipW) >> 1, (VIEW_H - clipH) >> 1);

  fs.writeFileSync(out, encodePNG(upscale(view, viewScale)));
  console.log(
    `${VIEW_W}x${VIEW_H} preview, house ${bounds.cols}x${bounds.rows} tiles ` +
      `at ${houseScale}x${housePx.width > frameW ? " (scrolls)" : ""} -> ${out}`,
  );
}

/** paste(), refusing to spill outside one room's rectangle. */
function clipPaste(dst, src, dx, dy, clipX, clipY, clipW, clipH, limitH = clipH) {
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const tx = dx + x;
      const ty = dy + y;
      if (tx < clipX || ty < clipY || tx >= clipX + clipW || ty >= clipY + limitH) continue;
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

/** The lining, matching HouseLining in room-canvas.tsx. */
function pasteLining(house, sheet, rooms, lining, origin) {
  if (!lining) return;
  const i = lining.inset;
  const { x, y, w, h } = lining.rect;
  const slice = {
    tl: crop(sheet, x, y, i, i),
    tr: crop(sheet, x + w - i, y, i, i),
    bl: crop(sheet, x, y + h - i, i, i),
    br: crop(sheet, x + w - i, y + h - i, i, i),
    top: crop(sheet, x + (w >> 1), y, 1, i),
    bottom: crop(sheet, x + (w >> 1), y + h - i, 1, i),
    left: crop(sheet, x, y + (h >> 1), i, 1),
    right: crop(sheet, x + w - i, y + (h >> 1), i, 1),
  };

  const { runs, corners } = liningGeometry(rooms, TILE, i, origin);
  for (const run of runs) {
    const strip = slice[run.side];
    for (let dy = 0; dy < run.h; dy += 1) {
      for (let dx = 0; dx < run.w; dx += 1) {
        const s =
          ((strip.height === 1 ? 0 : dy % strip.height) * strip.width +
            (strip.width === 1 ? 0 : dx % strip.width)) *
          4;
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
