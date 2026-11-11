// Compose a static preview of the whole home screen — garden backdrop, scrim
// and room — so the look can be judged without a browser.
//
// Mirrors app/components/home/house/garden-backdrop.tsx and room-canvas.tsx.
// It is a visual check, not a renderer: if those files change, this drifts.
//
// Usage: node scripts/preview-house.mjs --out <file.png> [--scale 2]
import fs from "node:fs";
import path from "node:path";

import { blank, crop, decodePNG, encodePNG, paste, scale as upscale } from "./lib/png.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

// Phone-sized viewport in CSS pixels.
const VIEW_W = 390;
const VIEW_H = 844;

const TILE = 16;
const ROOM_COLS = 10;
const ROOM_ROWS = 8;
const WALL_ROWS = 3;
const ROOM_W = ROOM_COLS * TILE;
const ROOM_H = ROOM_ROWS * TILE;
const WALL_H = WALL_ROWS * TILE;
const ROOM_SCALE = 2;

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
function applyScrim(img) {
  for (let y = 0; y < img.height; y += 1) {
    const t = y / (img.height - 1);
    const alpha = t < 0.5 ? 0.75 + (0.1 - 0.75) * (t / 0.5) : 0.1 + (0.85 - 0.1) * ((t - 0.5) / 0.5);
    for (let x = 0; x < img.width; x += 1) {
      const d = (y * img.width + x) * 4;
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

  applyScrim(view);

  // The room, centred like the dialog's flex column.
  const room = blank(ROOM_W, ROOM_H, [0, 0, 0, 0]);
  const wall = decorById.get("wall-stone");
  const wallTile = crop(interiors, wall.x, wall.y, wall.w, wall.h);
  for (let x = 0; x < ROOM_W; x += wall.w) paste(room, wallTile, x, 0);
  const floor = decorById.get("floor-wood");
  const floorTile = crop(interiors, floor.x, floor.y, floor.w, floor.h);
  for (let y = WALL_H; y < ROOM_H; y += floor.h) {
    for (let x = 0; x < ROOM_W; x += floor.w) paste(room, floorTile, x, y);
  }
  for (const [id, tx, ty] of [
    ["chair-dining", 2, 4],
    ["book-open", 6, 6],
    ["bookshelf", 5, 2],
    ["plant-tall", 8, 4],
  ]) {
    const item = decorById.get(id);
    if (item) paste(room, crop(interiors, item.x, item.y, item.w, item.h), tx * TILE, ty * TILE);
  }

  const roomPx = upscale(room, ROOM_SCALE);
  paste(view, roomPx, (VIEW_W - roomPx.width) >> 1, (VIEW_H - roomPx.height) >> 1);

  fs.writeFileSync(out, encodePNG(upscale(view, viewScale)));
  console.log(`${VIEW_W}x${VIEW_H} preview -> ${out}`);
}

main();
