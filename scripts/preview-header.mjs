// Compose a static preview of the home header's woods backdrop — grass, darker
// patches, scatter, edge-anchored trees and the light scrim — so the look can
// be judged without a browser. Draws grey bars where the greeting text, nav and
// bell sit, to check nothing important lands under a tree.
//
// Mirrors app/components/home/woods-backdrop.tsx. It is a visual check, not a
// renderer: if that file changes, this drifts.
//
// Usage: node scripts/preview-header.mjs --out <file.png> [--scale 2] [--height 220]
import fs from "node:fs";
import path from "node:path";

import { blank, crop, decodePNG, encodePNG, paste, scale as upscale } from "./lib/png.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

// Phone-sized viewport in CSS pixels; the header is the full width.
const VIEW_W = 390;

const GRASS_LIGHT = [0x59, 0xc1, 0x35];
const LEAF_50 = [0xf1, 0xfa, 0xf3];
const LEAF_900 = [0x0f, 0x30, 0x22];

const TREES = [
  { id: "tree-big", scale: 2, right: -58, bottom: -26 },
  { id: "tree-pine", scale: 2, right: 38, bottom: -16 },
  { id: "tree-bush", scale: 2, right: 104, bottom: -24 },
  { id: "tree-pine", scale: 2, right: 168, bottom: -12 },
  { id: "tree-bush", scale: 2, left: -22, bottom: -26 },
  { id: "tree-pine", scale: 2, left: 48, bottom: -18 },
];

const FLORA = new Set([
  "grass-tuft-a",
  "grass-tuft-b",
  "grass-tuft-c",
  "grass-tuft-d",
  "grass-tuft-e",
  "fern",
  "leaf-sprig",
  "flower-pink",
  "flowers-yellow",
  "flowers-red",
]);

const PATCHES = [
  { scale: 3, left: -70, top: -58 },
  { scale: 2, right: -20, top: 40 },
  { scale: 2, left: 96, top: -34 },
];

const SCATTER_COUNT = 44;
const FLORA_SHARE = 0.82;

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

/** Resolve left/right + top/bottom anchors to a top-left paste origin. */
function anchor(box, w, h, viewW, viewH) {
  const x = box.left === undefined ? viewW - box.right - w : box.left;
  const y = box.top === undefined ? viewH - box.bottom - h : box.top;
  return [Math.round(x), Math.round(y)];
}

/** Diagonal scrim matching `bg-gradient-to-br from-leaf-50/75 via-leaf-50/20 to-transparent`. */
function applyScrim(img) {
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      const t = (x / (img.width - 1) + y / (img.height - 1)) / 2;
      const alpha =
        t < 0.5 ? 0.75 + (0.2 - 0.75) * (t / 0.5) : 0.2 + (0 - 0.2) * ((t - 0.5) / 0.5);
      const d = (y * img.width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        img.data[d + c] = img.data[d + c] * (1 - alpha) + LEAF_50[c] * alpha;
      }
    }
  }
}

/** Solid block, to stand in for a run of text or a control. */
function block(img, x, y, w, h, colour) {
  for (let yy = y; yy < y + h; yy += 1) {
    if (yy < 0 || yy >= img.height) continue;
    for (let xx = x; xx < x + w; xx += 1) {
      if (xx < 0 || xx >= img.width) continue;
      const d = (yy * img.width + xx) * 4;
      img.data[d] = colour[0];
      img.data[d + 1] = colour[1];
      img.data[d + 2] = colour[2];
      img.data[d + 3] = 255;
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const get = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i === -1 ? dflt : argv[i + 1];
  };
  const out = get("--out", "/tmp/header-preview.png");
  const viewScale = Number(get("--scale", 2));
  const VIEW_H = Number(get("--height", 220));

  const woods = decodePNG(path.join(ROOT, "public/free_pixel_16_woods.png"));
  const garden = JSON.parse(fs.readFileSync(path.join(ROOT, "lib/garden-catalog.json"), "utf8"));
  const gardenById = new Map(garden.items.map((i) => [i.id, i]));

  const view = blank(VIEW_W, VIEW_H, [...GRASS_LIGHT, 255]);

  const patch = gardenById.get("grass-patch");
  for (const blob of PATCHES) {
    const sprite = upscale(crop(woods, patch.x, patch.y, patch.w, patch.h), blob.scale);
    // opacity-60 on the blob.
    for (let i = 3; i < sprite.data.length; i += 4) sprite.data[i] = sprite.data[i] * 0.6;
    const x = blob.left === undefined ? VIEW_W - blob.right - sprite.width : blob.left;
    paste(view, sprite, Math.round(x), blob.top);
  }

  const scatterSprites = garden.items.filter((i) => i.category === "scatter");
  const flora = scatterSprites.filter((i) => FLORA.has(i.id));
  const ground = scatterSprites.filter((i) => !FLORA.has(i.id));
  const random = mulberry32(0x5eed1e);
  for (let i = 0; i < SCATTER_COUNT; i += 1) {
    const isFlora = random() < FLORA_SHARE || ground.length === 0;
    const pool = isFlora ? flora : ground;
    const item = pool[Math.floor(random() * pool.length)];
    const left = random() * 100;
    const top = isFlora ? random() * 100 : 74 + random() * 26;
    const s = isFlora && random() < 0.3 ? 3 : 2;
    paste(
      view,
      upscale(crop(woods, item.x, item.y, item.w, item.h), s),
      Math.round((left / 100) * VIEW_W),
      Math.round((top / 100) * VIEW_H),
    );
  }

  for (const tree of TREES) {
    const item = gardenById.get(tree.id);
    const sprite = upscale(crop(woods, item.x, item.y, item.w, item.h), tree.scale);
    const [x, y] = anchor(tree, sprite.width, sprite.height, VIEW_W, VIEW_H);
    paste(view, sprite, x, y);
  }

  applyScrim(view);

  if (argv.includes("--bars")) {
    // px-5 = 20px gutter. Nav + bell row at pt-5, then greeting / name / chips.
    block(view, 20, 20, 40, 40, LEAF_900);
    block(view, VIEW_W - 60, 20, 40, 40, LEAF_900);
    block(view, 20, 72, 110, 14, LEAF_900);
    block(view, 20, 92, 150, 34, LEAF_900);
    block(view, 20, 140, 90, 26, LEAF_900);
    block(view, 120, 140, 70, 26, LEAF_900);
  }

  fs.writeFileSync(out, encodePNG(upscale(view, viewScale)));
  console.log(`${VIEW_W}x${VIEW_H} header preview -> ${out}`);
}

main();
