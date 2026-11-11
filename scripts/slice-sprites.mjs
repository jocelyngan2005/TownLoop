// Extract discrete objects from a pixel-art tilesheet.
//
// Objects on these sheets span multiple 16px tiles and are separated by
// transparent gutters, so we flood-fill islands of opaque pixels, snap each
// island's bounding box out to the tile grid, then merge islands that end up
// sharing tiles (e.g. a tree canopy and the trunk beneath it).
//
// Usage:
//   node scripts/slice-sprites.mjs <sheet.png> --out <dir> [--tile 16]
//        [--alpha 8] [--min-px 6] [--prefix name] [--contact <file.png>]
import fs from "node:fs";
import path from "node:path";

import { blank, crop, decodePNG, encodePNG, paste, scale } from "./lib/png.mjs";

function parseArgs(argv) {
  const args = { tile: 16, alpha: 8, minPx: 6, scale: 6, gap: 0, snap: false, dilate: 2 };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--out") args.out = argv[++i];
    else if (a === "--tile") args.tile = Number(argv[++i]);
    else if (a === "--alpha") args.alpha = Number(argv[++i]);
    else if (a === "--min-px") args.minPx = Number(argv[++i]);
    else if (a === "--prefix") args.prefix = argv[++i];
    else if (a === "--contact") args.contact = argv[++i];
    else if (a === "--scale") args.scale = Number(argv[++i]);
    else if (a === "--gap") args.gap = Number(argv[++i]);
    else if (a === "--dilate") args.dilate = Number(argv[++i]);
    else if (a === "--snap") args.snap = true;
    else if (a.startsWith("--")) throw new Error(`unknown flag ${a}`);
    else positional.push(a);
  }
  if (positional.length !== 1) throw new Error("expected exactly one input sheet");
  [args.input] = positional;
  if (!args.out) throw new Error("--out is required");
  return args;
}

/** Square-kernel dilation of a binary mask by `radius` pixels. */
function dilate(mask, width, height, radius) {
  if (radius <= 0) return mask;
  // Separable: horizontal pass then vertical pass.
  const tmp = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;
      for (let d = -radius; d <= radius && !on; d += 1) {
        const nx = x + d;
        if (nx >= 0 && nx < width && mask[y * width + nx]) on = 1;
      }
      tmp[y * width + x] = on;
    }
  }
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let on = 0;
      for (let d = -radius; d <= radius && !on; d += 1) {
        const ny = y + d;
        if (ny >= 0 && ny < height && tmp[ny * width + x]) on = 1;
      }
      out[y * width + x] = on;
    }
  }
  return out;
}

/**
 * Group opaque pixels into objects.
 *
 * Flood-filling raw alpha splits anything drawn as several disjoint pieces;
 * merging by bounding box over-merges, because on a tightly packed sheet the
 * boxes of distinct objects already intersect. So we flood-fill a *dilated*
 * mask — which bridges small gaps but not the gutters between objects — and
 * then measure each group's bounds from the undilated pixels.
 */
function findIslands(img, alphaThreshold, dilation) {
  const { width, height, data } = img;
  const n = width * height;

  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) mask[i] = data[i * 4 + 3] > alphaThreshold ? 1 : 0;
  const grown = dilate(mask, width, height, dilation);

  const labels = new Int32Array(n).fill(-1);
  let next = 0;
  for (let start = 0; start < n; start += 1) {
    if (labels[start] !== -1 || !grown[start]) continue;
    const label = next;
    next += 1;
    const stack = [start];
    labels[start] = label;
    while (stack.length) {
      const p = stack.pop();
      const x = p % width;
      const y = (p / width) | 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (labels[np] !== -1 || !grown[np]) continue;
          labels[np] = label;
          stack.push(np);
        }
      }
    }
  }

  const islands = Array.from({ length: next }, () => ({
    minX: width,
    minY: height,
    maxX: -1,
    maxY: -1,
    count: 0,
  }));
  for (let i = 0; i < n; i += 1) {
    if (!mask[i]) continue; // bounds come from real pixels, not the dilated halo
    const g = islands[labels[i]];
    const x = i % width;
    const y = (i / width) | 0;
    g.count += 1;
    if (x < g.minX) g.minX = x;
    if (x > g.maxX) g.maxX = x;
    if (y < g.minY) g.minY = y;
    if (y > g.maxY) g.maxY = y;
  }

  return islands.filter((g) => g.count > 0);
}

/** Snap a pixel bbox outward to tile boundaries. */
function snapToGrid(box, tile, width, height) {
  return {
    ...box,
    x: Math.max(0, Math.floor(box.x / tile) * tile),
    y: Math.max(0, Math.floor(box.y / tile) * tile),
    x2: Math.min(width, Math.ceil(box.x2 / tile) * tile),
    y2: Math.min(height, Math.ceil(box.y2 / tile) * tile),
  };
}

/**
 * Do two boxes overlap once each is dilated by `gap` pixels? A gap of 0 means
 * "only if they genuinely intersect". Raising it stitches an object back
 * together when it is drawn as several near-but-not-touching islands (a bed
 * frame's posts, a tree canopy floating above its trunk).
 */
const overlaps = (a, b, gap) =>
  a.x - gap < b.x2 + gap &&
  b.x - gap < a.x2 + gap &&
  a.y - gap < b.y2 + gap &&
  b.y - gap < a.y2 + gap;

/** Repeatedly union boxes that overlap. */
function mergeOverlapping(boxes, gap) {
  let current = boxes;
  for (;;) {
    const merged = [];
    const used = new Array(current.length).fill(false);
    let didMerge = false;

    for (let i = 0; i < current.length; i += 1) {
      if (used[i]) continue;
      let box = { ...current[i] };
      used[i] = true;
      for (let j = i + 1; j < current.length; j += 1) {
        if (used[j] || !overlaps(box, current[j], gap)) continue;
        box = {
          x: Math.min(box.x, current[j].x),
          y: Math.min(box.y, current[j].y),
          x2: Math.max(box.x2, current[j].x2),
          y2: Math.max(box.y2, current[j].y2),
          count: box.count + current[j].count,
        };
        used[j] = true;
        didMerge = true;
        j = i; // restart scan: the grown box may now touch earlier boxes
      }
      merged.push(box);
    }

    current = merged;
    if (!didMerge) return current;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const img = decodePNG(args.input);
  const tile = args.tile;
  const prefix = args.prefix ?? path.basename(args.input, ".png");

  const islands = findIslands(img, args.alpha, args.dilate)
    .filter((i) => i.count >= args.minPx)
    .map((i) => ({ x: i.minX, y: i.minY, x2: i.maxX + 1, y2: i.maxY + 1, count: i.count }));

  // `--gap` is an optional second pass for stragglers; off by default.
  const merged = args.gap > 0 ? mergeOverlapping(islands, args.gap) : islands;
  const boxes = (args.snap ? merged.map((b) => snapToGrid(b, tile, img.width, img.height)) : merged)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  fs.mkdirSync(args.out, { recursive: true });

  const sprites = boxes.map((box, index) => {
    const w = box.x2 - box.x;
    const h = box.y2 - box.y;
    const id = `${prefix}-${String(index).padStart(3, "0")}`;
    const piece = crop(img, box.x, box.y, w, h);
    fs.writeFileSync(path.join(args.out, `${id}.png`), encodePNG(piece));
    return {
      id,
      file: `${id}.png`,
      x: box.x,
      y: box.y,
      w,
      h,
      tilesWide: Math.round((w / tile) * 100) / 100,
      tilesHigh: Math.round((h / tile) * 100) / 100,
      opaquePixels: box.count,
    };
  });

  const manifest = {
    sheet: path.basename(args.input),
    sheetWidth: img.width,
    sheetHeight: img.height,
    tile,
    count: sprites.length,
    sprites,
  };
  fs.writeFileSync(
    path.join(args.out, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  if (args.contact) writeContactSheet(args, img, sprites);

  console.log(`${manifest.sheet}: ${sprites.length} objects -> ${args.out}`);
  const bySize = new Map();
  for (const s of sprites) {
    const key = `${s.tilesWide}x${s.tilesHigh}`;
    bySize.set(key, (bySize.get(key) ?? 0) + 1);
  }
  console.log(
    "  sizes:",
    [...bySize.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" "),
  );
}

/** Lay every extracted object out on a labelled grid so it can be eyeballed. */
function writeContactSheet(args, img, sprites) {
  const factor = args.scale;
  const cell = Math.max(...sprites.map((s) => Math.max(s.w, s.h))) * factor + 8;
  const cols = Math.ceil(Math.sqrt(sprites.length));
  const rows = Math.ceil(sprites.length / cols);
  const sheet = blank(cols * cell, rows * cell, [24, 24, 28, 255]);

  sprites.forEach((s, i) => {
    const cx = (i % cols) * cell;
    const cy = ((i / cols) | 0) * cell;
    // checkerboard so transparent regions are visible
    for (let y = 0; y < cell; y += 1) {
      for (let x = 0; x < cell; x += 1) {
        const shade = ((x >> 3) + (y >> 3)) % 2 ? 58 : 44;
        const d = ((cy + y) * sheet.width + cx + x) * 4;
        sheet.data[d] = shade;
        sheet.data[d + 1] = shade;
        sheet.data[d + 2] = shade + 4;
        sheet.data[d + 3] = 255;
      }
    }
    const piece = scale(crop(img, s.x, s.y, s.w, s.h), factor);
    paste(sheet, piece, cx + ((cell - piece.width) >> 1), cy + ((cell - piece.height) >> 1));
  });

  fs.writeFileSync(args.contact, encodePNG(sheet));
  console.log(`  contact sheet: ${args.contact} (${cols} cols x ${rows} rows, index = row*${cols}+col)`);
}

main();
