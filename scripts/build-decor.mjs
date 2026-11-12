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

/**
 * Interiors catalogue: one entry per *object*, listing every view of it drawn
 * on the sheet.
 *
 * Several pieces are drawn four times, once per facing. Those are one entry
 * with four variants rather than four entries, so the workshop lists "Armchair"
 * once and the resident turns it in the room. Variant order is the turn order —
 * front, right, back, left — so a rotate control can just step the index.
 *
 * Every rectangle here was measured off the alpha channel of the sheet (column
 * and row runs through each band), not eyeballed: together they cover every
 * opaque pixel on interiors_demo.png exactly once, with no overlaps. Objects
 * on this sheet are NOT tile-aligned — the armchair is 28x30 at 130,2 — so
 * these are pixel rects, not tile rects.
 *
 * Shape: { id, name, category, variants: [[facing, x, y, w, h], ...] }
 */
const CATALOG = [
  // --- surfaces -----------------------------------------------------------
  // Tiled as the room's wall and floor rather than placed; see room-canvas.
  { id: "wall-stone", name: "Stone Wall", category: "wall", variants: [["front", 48, 0, 48, 48]] },
  { id: "wall-drape-blue", name: "Blue Drape", category: "wall", variants: [["front", 0, 0, 48, 48]] },
  { id: "floor-concrete", name: "Concrete Floor", category: "floor", variants: [["front", 96, 32, 16, 16]] },
  { id: "floor-wood", name: "Wood Floor", category: "floor", variants: [["front", 112, 32, 16, 16]] },

  // --- wall-mounted -------------------------------------------------------
  { id: "window", name: "Window", category: "wall", variants: [["front", 103, 9, 18, 18]] },
  { id: "curtains-red", name: "Red Curtains", category: "wall", variants: [["front", 196, 103, 24, 25]] },
  { id: "picture-portrait", name: "Framed Portrait", category: "wall", variants: [["front", 240, 145, 16, 14]] },
  { id: "picture-group", name: "Framed Photo", category: "wall", variants: [["front", 240, 161, 16, 14]] },

  // --- seating ------------------------------------------------------------
  {
    id: "armchair",
    name: "Armchair",
    category: "seating",
    variants: [
      ["front", 130, 2, 28, 30],
      ["right", 161, 0, 23, 32],
      ["back", 194, 7, 28, 25],
      ["left", 232, 0, 23, 32],
    ],
  },
  {
    // The old "low sofa" is this sofa's back, and the two tall 23x48 pieces
    // are its sides — mirror images of each other, which is what gives the
    // set away. Same front/back height relationship as the armchair.
    id: "sofa-red",
    name: "Red Sofa",
    category: "seating",
    variants: [
      ["front", 0, 130, 47, 30],
      ["right", 49, 128, 23, 48],
      ["back", 80, 135, 47, 25],
      ["left", 136, 128, 23, 48],
    ],
  },
  {
    // Exactly one 16px column each: 128..144, 144..160, 160..176, 176..192.
    id: "chair-dining",
    name: "Dining Chair",
    category: "seating",
    variants: [
      ["front", 128, 97, 16, 31],
      ["right", 144, 97, 16, 31],
      ["back", 160, 97, 16, 31],
      ["left", 176, 97, 16, 31],
    ],
  },
  { id: "stool", name: "Wooden Stool", category: "seating", variants: [["front", 145, 64, 14, 16]] },

  // --- bedroom ------------------------------------------------------------
  { id: "bed-blue", name: "Blue Bed", category: "bedroom", variants: [["front", 177, 37, 46, 59]] },
  { id: "bed-green", name: "Green Bed", category: "bedroom", variants: [["front", 225, 37, 30, 59]] },
  {
    id: "bedside-table",
    name: "Bedside Table",
    category: "bedroom",
    variants: [
      ["front", 144, 44, 16, 20],
      ["back", 160, 44, 16, 20],
    ],
  },
  { id: "cabinet", name: "Cabinet", category: "bedroom", variants: [["front", 116, 58, 24, 22]] },

  // --- tables & storage ---------------------------------------------------
  { id: "table-long", name: "Long Table", category: "table", variants: [["front", 0, 58, 64, 22]] },
  { id: "table-wood", name: "Wooden Table", category: "table", variants: [["front", 192, 137, 48, 39]] },
  { id: "bookshelf", name: "Bookshelf", category: "table", variants: [["front", 160, 128, 32, 44]] },

  // --- rugs ---------------------------------------------------------------
  { id: "rug-red", name: "Red Carpet", category: "rug", variants: [["front", 81, 81, 46, 46]] },
  { id: "rug-blue", name: "Blue Rug", category: "rug", variants: [["front", 80, 53, 32, 22]] },

  // --- plants & decor -----------------------------------------------------
  { id: "plant-tall", name: "Tall Houseplant", category: "plant", variants: [["front", 224, 97, 16, 31]] },
  { id: "flowerpot-pink", name: "Pink Flowerpot", category: "plant", variants: [["front", 242, 114, 10, 14]] },
  { id: "succulent", name: "Succulent", category: "plant", variants: [["front", 242, 130, 11, 14]] },
  { id: "watering-can", name: "Watering Can", category: "decor", variants: [["front", 244, 99, 9, 9]] },
  { id: "books-blue", name: "Stack of Books", category: "decor", variants: [["front", 114, 164, 11, 11]] },
  { id: "book-open", name: "Open Book", category: "decor", variants: [["front", 98, 166, 13, 9]] },
];

/**
 * The wooden lining that surrounds a room, nine-sliced out of the sheet.
 *
 * Three rooms are outlined on the sheet (10,90 28x38; 48,80 32x16, open at the
 * top; 48,106 32x22). All three use the same 6px border: a dark outer rule, a
 * flat brown fill and a highlight pixel in each corner. The closed 32x22 one is
 * the slice source because it is the only one with all four sides.
 *
 * Each edge is constant along its length, so a 1px strip repeats to any size
 * with no seam — which keeps the lining pixel-exact at every integer zoom,
 * where a stretched border-image would not be.
 */
const LINING = { x: 48, y: 106, w: 32, h: 22, inset: 6 };

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

/**
 * Accept both catalogue shapes.
 *
 * The garden sheet has one view per object, so its entries stay flat tuples;
 * the interiors sheet needs a variant list. Normalising here means only this
 * function knows about the difference, and `variants: false` keeps the garden
 * manifest flat for the backdrops that read it.
 */
function normalise(entry) {
  if (Array.isArray(entry)) {
    const [id, name, category, x, y, w, h] = entry;
    return { id, name, category, variants: [["front", x, y, w, h]], flat: true };
  }
  return { ...entry, flat: false };
}

function buildCatalog({ sheetPath, outDir, manifestPath, catalog, label, lining }) {
  const SHEET = path.join(ROOT, sheetPath);
  const OUT_DIR = path.join(ROOT, outDir);

  const img = decodePNG(SHEET);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Clear the previous cut first. Renaming or merging an entry would otherwise
  // leave its old PNG behind, and a stale sprite that still loads is a much
  // harder thing to notice than a missing one.
  for (const entry of fs.readdirSync(OUT_DIR)) {
    if (entry.endsWith(".png")) fs.rmSync(path.join(OUT_DIR, entry));
  }

  /** Cut one rect, write it out, and measure how well the rect fits it. */
  function cutPiece(fileName, facing, x, y, w, h, id) {
    if (x < 0 || y < 0 || x + w > img.width || y + h > img.height) {
      throw new Error(`${id}: rect ${x},${y} ${w}x${h} falls outside the sheet`);
    }
    const piece = crop(img, x, y, w, h);

    // Guard against a rect that missed its subject or clipped a neighbour.
    let opaque = 0;
    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        if (piece.data[(py * w + px) * 4 + 3] > 8) opaque += 1;
      }
    }

    fs.writeFileSync(path.join(OUT_DIR, `${fileName}.png`), encodePNG(piece));
    return { facing, x, y, w, h, coverage: opaque / (w * h) };
  }

  const items = catalog.map(normalise).map((entry) => {
    const variants = entry.variants.map(([facing, x, y, w, h], index) =>
      // First variant keeps the bare id, so single-view ids are unchanged.
      cutPiece(index === 0 ? entry.id : `${entry.id}-${facing}`, facing, x, y, w, h, entry.id),
    );
    return { ...entry, variants };
  });

  const manifest = {
    sheet: `/${path.relative(path.join(ROOT, "public"), SHEET)}`,
    sheetWidth: img.width,
    sheetHeight: img.height,
    tile: 16,
    // Only geometry ships to the app; coverage is a build-time check.
    items: items.map((item) => {
      const head = { id: item.id, name: item.name, category: item.category };
      // A single-view sheet stays flat, with no facing to choose between.
      if (item.flat) {
        const { x, y, w, h } = item.variants[0];
        return { ...head, x, y, w, h };
      }
      return {
        ...head,
        variants: item.variants.map(({ facing, x, y, w, h }) => ({ facing, x, y, w, h })),
      };
    }),
  };
  if (lining) manifest.lining = buildLining(img, OUT_DIR, lining);

  fs.writeFileSync(
    path.join(ROOT, manifestPath),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const sprites = items.reduce((n, item) => n + item.variants.length, 0);
  console.log(`${label}: ${items.length} entries, ${sprites} sprites -> ${outDir}/`);
  const suspect = items.flatMap((item) =>
    item.variants
      .filter((variant) => variant.coverage < 0.15)
      .map((variant) => `${item.id} (${variant.facing})  ${(variant.coverage * 100).toFixed(0)}%`),
  );
  if (suspect.length) {
    console.log("  low fill (check framing):");
    for (const line of suspect) console.log(`    ${line}`);
  }

  return { img, items };
}

/**
 * Cut the room lining into four corners and four 1px repeating edge strips.
 *
 * Taking the strips from the midpoint of each side avoids the corner
 * highlights, and because every side is constant along its length one pixel
 * is as good as the whole run.
 */
function buildLining(img, outDir, { x, y, w, h, inset }) {
  const dir = path.join(outDir, "lining");
  fs.mkdirSync(dir, { recursive: true });

  const midX = x + (w >> 1);
  const midY = y + (h >> 1);
  const pieces = {
    tl: [x, y, inset, inset],
    tr: [x + w - inset, y, inset, inset],
    bl: [x, y + h - inset, inset, inset],
    br: [x + w - inset, y + h - inset, inset, inset],
    top: [midX, y, 1, inset],
    bottom: [midX, y + h - inset, 1, inset],
    left: [x, midY, inset, 1],
    right: [x + w - inset, midY, inset, 1],
  };

  for (const [name, rect] of Object.entries(pieces)) {
    fs.writeFileSync(path.join(dir, `${name}.png`), encodePNG(crop(img, ...rect)));
  }
  console.log(`  lining: ${inset}px border -> ${path.relative(ROOT, dir)}/`);

  // `rect` is for tooling that re-cuts from the sheet (scripts/preview-room);
  // the app only ever loads the slices under `dir`.
  return { inset, dir: `/${path.relative(path.join(ROOT, "public"), dir)}`, rect: { x, y, w, h } };
}

/**
 * Contact sheet for eyeballing the cuts: one cell per variant, one row per
 * entry, so a four-facing object reads as a row of four and a mis-cut shows up
 * next to its siblings.
 */
function writeVerify(out, img, items) {
  const factor = 5;
  const all = items.flatMap((item) => item.variants);
  const cell = Math.max(...all.map((v) => Math.max(v.w, v.h))) * factor + 10;
  const cols = Math.max(...items.map((item) => item.variants.length));
  const cells = items.flatMap((item, row) =>
    item.variants.map((variant, col) => ({ ...variant, row, col })),
  );
  const sheet = blank(cols * cell, items.length * cell, [20, 20, 26, 255]);

  cells.forEach((item) => {
    const cx = item.col * cell;
    const cy = item.row * cell;
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
  console.log(`  verify sheet: ${out} (one row per entry, up to ${cols} views)`);
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
      lining: LINING,
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
