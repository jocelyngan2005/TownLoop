// Build the decor catalogue: cut each named rectangle out of the source
// tilesheets into public/sprites/, and emit a manifest for the app.
//
// Rectangles were derived from scripts/slice-sprites.mjs for well-separated
// objects, and read off scripts/grid-overlay.mjs where objects touch on the
// sheet and no automatic segmentation can split them.
//
// Usage: node scripts/build-decor.mjs [--verify /tmp/contact.png]
import fs from "node:fs";
import path from "node:path";

import { blank, crop, decodePNG, encodePNG, paste, scale } from "./lib/png.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

// [id, name, category, x, y, w, h]
const CATALOG = [
  // --- surfaces -----------------------------------------------------------
  ["wall-stone", "Stone Wall", "wall", 48, 0, 48, 48],
  ["wall-drape-blue", "Blue Drape", "wall", 0, 0, 48, 48],
  ["floor-concrete", "Concrete Floor", "floor", 96, 32, 15, 16],
  ["floor-wood", "Wood Floor", "floor", 112, 32, 16, 16],
  ["window", "Window", "wall", 103, 9, 18, 18],

  // --- seating ------------------------------------------------------------
  ["armchair-front", "Armchair", "seating", 130, 2, 28, 30],
  ["armchair-left", "Armchair (Left)", "seating", 161, 0, 23, 32],
  ["armchair-back", "Armchair (Back)", "seating", 194, 7, 28, 25],
  ["armchair-right", "Armchair (Right)", "seating", 232, 0, 23, 32],
  ["armchair-wing", "Wing Armchair", "seating", 48, 128, 32, 48],
  ["sofa-red", "Red Sofa", "seating", 0, 130, 47, 30],
  ["sofa-red-low", "Low Sofa", "seating", 80, 135, 47, 25],
  ["chair-dining", "Dining Chair", "seating", 129, 97, 18, 31],
  ["chair-dining-alt", "Slatted Chair", "seating", 161, 97, 16, 31],

  // --- bedroom ------------------------------------------------------------
  ["bed-blue", "Blue Bed", "bedroom", 177, 37, 46, 59],
  ["bed-green", "Green Bed", "bedroom", 225, 37, 30, 59],
  ["bedside-set", "Bedside Set", "bedroom", 144, 44, 32, 36],
  ["cabinet", "Cabinet", "bedroom", 116, 58, 24, 22],

  // --- tables & storage ---------------------------------------------------
  ["table-long", "Long Table", "table", 0, 58, 72, 24],
  ["table-wood", "Wooden Table", "table", 201, 136, 40, 40],
  ["bookshelf", "Bookshelf", "table", 168, 128, 26, 48],

  // --- decor --------------------------------------------------------------
  ["rug-red", "Red Carpet", "rug", 81, 81, 46, 46],
  ["rug-blue", "Blue Rug", "rug", 80, 53, 32, 22],
  ["mirror-tall", "Tall Mirror", "decor", 10, 90, 28, 38],
  ["curtains-red", "Red Curtains", "decor", 196, 103, 24, 25],
  ["plant-tall", "Tall Houseplant", "plant", 224, 97, 16, 31],
  ["flowerpot-pink", "Pink Flowerpot", "plant", 242, 114, 10, 14],
  ["succulent", "Succulent", "plant", 242, 130, 11, 14],
  ["watering-can", "Watering Can", "decor", 244, 99, 9, 9],
  ["books-blue", "Stack of Books", "decor", 114, 164, 11, 11],
  ["book-open", "Open Book", "decor", 98, 166, 13, 9],
];

// Outdoor scatter and trees for the garden backdrop, from the woods sheet.
// The grass itself is a flat colour (the blob interiors are a single RGB
// value), so it is a CSS background-color rather than a sprite.
const GARDEN = [
  ["grass-tuft-a", "Grass Tuft", "scatter", 96, 32, 7, 7],
  ["grass-tuft-b", "Grass Tuft", "scatter", 100, 70, 8, 8],
  ["grass-tuft-c", "Grass Tuft", "scatter", 112, 80, 7, 8],
  ["grass-tuft-d", "Grass Tuft", "scatter", 136, 80, 8, 7],
  ["grass-tuft-e", "Grass Clump", "scatter", 121, 88, 15, 8],
  ["fern", "Fern", "scatter", 225, 52, 13, 12],
  ["leaf-sprig", "Leaf Sprig", "scatter", 240, 54, 15, 10],
  ["flower-pink", "Pink Flower", "scatter", 258, 54, 11, 10],
  ["flowers-yellow", "Yellow Flowers", "scatter", 81, 84, 14, 10],
  ["flowers-red", "Red Flowers", "scatter", 97, 84, 14, 10],
  ["mushroom-red", "Red Mushrooms", "scatter", 229, 70, 10, 11],
  ["mushroom-blue", "Blue Mushrooms", "scatter", 243, 71, 13, 10],
  ["stump", "Tree Stump", "scatter", 230, 83, 17, 15],
  ["rock-cluster", "Rocks", "scatter", 224, 36, 16, 12],
  ["stone-small", "Pebble", "scatter", 244, 41, 8, 5],
  ["twig", "Twig", "scatter", 260, 39, 9, 9],
  ["tree-big", "Oak Tree", "tree", 275, 10, 59, 70],
  ["tree-bush", "Bush Tree", "tree", 275, 92, 28, 36],
  ["tree-pine", "Pine Tree", "tree", 308, 97, 25, 31],
  ["grass-patch", "Grass Patch", "terrain", 151, 23, 66, 66],
];

/** Flat colours sampled from the blob interiors on the woods sheet. */
export const GRASS_LIGHT = "#59c135";
export const GRASS_DARK = "#14a02e";

function buildCatalog({ sheetPath, outDir, manifestPath, catalog, label }) {
  const SHEET = path.join(ROOT, sheetPath);
  const OUT_DIR = path.join(ROOT, outDir);

  const img = decodePNG(SHEET);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const items = catalog.map(([id, name, category, x, y, w, h]) => {
    if (x < 0 || y < 0 || x + w > img.width || y + h > img.height) {
      throw new Error(`${id}: rect ${x},${y} ${w}x${h} falls outside the sheet`);
    }
    const piece = crop(img, x, y, w, h);

    // Guard against a rect that missed its subject or clipped a neighbour.
    let opaque = 0;
    let edge = 0;
    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        if (piece.data[(py * w + px) * 4 + 3] <= 8) continue;
        opaque += 1;
        if (px === 0 || py === 0 || px === w - 1 || py === h - 1) edge += 1;
      }
    }
    const coverage = opaque / (w * h);

    fs.writeFileSync(path.join(OUT_DIR, `${id}.png`), encodePNG(piece));
    return { id, name, category, x, y, w, h, coverage, edge };
  });

  const manifest = {
    sheet: `/${path.relative(path.join(ROOT, "public"), SHEET)}`,
    sheetWidth: img.width,
    sheetHeight: img.height,
    tile: 16,
    // Only geometry ships to the app; coverage/edge are build-time checks.
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      x: i.x,
      y: i.y,
      w: i.w,
      h: i.h,
    })),
  };
  fs.writeFileSync(
    path.join(ROOT, manifestPath),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`${label}: ${items.length} items -> ${outDir}/`);
  const suspect = items.filter((i) => i.coverage < 0.15);
  if (suspect.length) {
    console.log("  low fill (check framing):");
    for (const i of suspect) {
      console.log(`    ${i.id} ${(i.coverage * 100).toFixed(0)}%`);
    }
  }

  return { img, items };
}

function writeVerify(out, img, items) {
  const factor = 5;
  const cell = Math.max(...items.map((i) => Math.max(i.w, i.h))) * factor + 10;
  const cols = 8;
  const rows = Math.ceil(items.length / cols);
  const sheet = blank(cols * cell, rows * cell, [20, 20, 26, 255]);

  items.forEach((item, i) => {
    const cx = (i % cols) * cell;
    const cy = ((i / cols) | 0) * cell;
    for (let y = 0; y < cell - 2; y += 1) {
      for (let x = 0; x < cell - 2; x += 1) {
        const shade = ((x >> 3) + (y >> 3)) % 2 ? 60 : 46;
        const d = ((cy + y) * sheet.width + cx + x) * 4;
        sheet.data[d] = shade;
        sheet.data[d + 1] = shade;
        sheet.data[d + 2] = shade + 5;
        sheet.data[d + 3] = 255;
      }
    }
    const piece = scale(crop(img, item.x, item.y, item.w, item.h), factor);
    paste(sheet, piece, cx + ((cell - piece.width) >> 1), cy + ((cell - piece.height) >> 1));
  });

  fs.writeFileSync(out, encodePNG(sheet));
  console.log(`  verify sheet: ${out} (${cols} per row)`);
}

function main() {
  const flag = process.argv.indexOf("--verify");
  const verifyDir = flag === -1 ? null : process.argv[flag + 1];

  const built = [
    buildCatalog({
      sheetPath: "public/interiors_demo.png",
      outDir: "public/sprites/decor",
      manifestPath: "lib/decor-catalog.json",
      catalog: CATALOG,
      label: "decor",
    }),
    buildCatalog({
      sheetPath: "public/free_pixel_16_woods.png",
      outDir: "public/sprites/garden",
      manifestPath: "lib/garden-catalog.json",
      catalog: GARDEN,
      label: "garden",
    }),
  ];

  if (verifyDir) {
    fs.mkdirSync(verifyDir, { recursive: true });
    for (const [i, name] of ["decor", "garden"].entries()) {
      writeVerify(path.join(verifyDir, `${name}.png`), built[i].img, built[i].items);
    }
  }
}

main();
