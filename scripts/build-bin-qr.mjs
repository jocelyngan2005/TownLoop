/**
 * Render scannable bin QR stickers into public/bin-qr/.
 *
 *   node scripts/build-bin-qr.mjs              # the demo bin only
 *   node scripts/build-bin-qr.mjs --all        # every bin in lib/scan-data.ts
 *   node scripts/build-bin-qr.mjs TL-BIN-X-01  # an arbitrary code
 *
 * Codes are read out of lib/scan-data.ts rather than repeated here, so editing
 * a qrCode there and re-running this is enough to reissue the sticker.
 *
 * Every sticker is decoded with jsqr — the same library the scanner uses —
 * before it is written. A QR this script cannot read back is never saved.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import jsQR from "jsqr";

import { encodePNG } from "./lib/png.mjs";
import { encodeQR } from "./lib/qr.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DATA = path.join(ROOT, "lib", "scan-data.ts");
const OUT_DIR = path.join(ROOT, "public", "bin-qr");

/** Pixels per QR module. 12 keeps a 29-module code crisp on paper and screen. */
const MODULE_PX = 12;
/** Quiet zone in modules. The spec requires 4; scanners rely on it. */
const QUIET = 4;
const LABEL_SCALE = 4;
const LABEL_GAP = 10;

const INK = [17, 32, 25, 255];
const PAPER = [255, 255, 255, 255];

// ---------------------------------------------------------------------------
// A 5x7 bitmap font, limited to what a bin code can contain
// ---------------------------------------------------------------------------

const GLYPHS = {
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11110 10001 10001 10001 10001 10001 11110",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01110",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "11111 00100 00100 00100 00100 00100 11111",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10001 10001 10001 10001",
  N: "10001 11001 10101 10011 10001 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 11011 10001",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  0: "01110 10001 10011 10101 11001 10001 01110",
  1: "00100 01100 00100 00100 00100 00100 01110",
  2: "01110 10001 00001 00010 00100 01000 11111",
  3: "11111 00010 00100 00010 00001 10001 01110",
  4: "00010 00110 01010 10010 11111 00010 00010",
  5: "11111 10000 11110 00001 00001 10001 01110",
  6: "00110 01000 10000 11110 10001 10001 01110",
  7: "11111 00001 00010 00100 01000 01000 01000",
  8: "01110 10001 10001 01110 10001 10001 01110",
  9: "01110 10001 10001 01111 00001 00010 01100",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  " ": "00000 00000 00000 00000 00000 00000 00000",
};

const GLYPH_W = 5;
const GLYPH_H = 7;

function fillRect(img, x, y, w, h, colour) {
  for (let row = y; row < y + h; row += 1) {
    if (row < 0 || row >= img.height) continue;
    for (let col = x; col < x + w; col += 1) {
      if (col < 0 || col >= img.width) continue;
      const i = (row * img.width + col) * 4;
      img.data[i] = colour[0];
      img.data[i + 1] = colour[1];
      img.data[i + 2] = colour[2];
      img.data[i + 3] = colour[3];
    }
  }
}

function textWidth(text, scale) {
  return text.length * (GLYPH_W + 1) * scale - scale;
}

function drawText(img, text, x, y, scale, colour) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    const glyph = GLYPHS[char] ?? GLYPHS[" "];
    const rows = glyph.split(" ");
    rows.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit === "1") {
          fillRect(img, cursor + gx * scale, y + gy * scale, scale, scale, colour);
        }
      });
    });
    cursor += (GLYPH_W + 1) * scale;
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderSticker(code) {
  const qr = encodeQR(code, { level: "H" });
  const span = (qr.size + QUIET * 2) * MODULE_PX;
  const labelH = GLYPH_H * LABEL_SCALE;
  const height = span + LABEL_GAP + labelH + QUIET * MODULE_PX;

  const img = {
    width: span,
    height,
    data: Buffer.alloc(span * height * 4),
  };
  fillRect(img, 0, 0, span, height, PAPER);

  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (!qr.modules[y][x]) continue;
      fillRect(
        img,
        (x + QUIET) * MODULE_PX,
        (y + QUIET) * MODULE_PX,
        MODULE_PX,
        MODULE_PX,
        INK,
      );
    }
  }

  // The app tells residents the code is printed under the sticker, and its
  // manual-entry box expects exactly this string.
  drawText(
    img,
    code,
    Math.round((span - textWidth(code, LABEL_SCALE)) / 2),
    span + LABEL_GAP,
    LABEL_SCALE,
    INK,
  );

  return { img, qr };
}

/** Decode the rendered pixels with the scanner's own library. */
function verify(img, code) {
  const pixels = new Uint8ClampedArray(img.data);
  const result = jsQR(pixels, img.width, img.height);
  if (!result) throw new Error(`Rendered QR for "${code}" did not decode`);
  if (result.data !== code) {
    throw new Error(`Rendered QR decoded as "${result.data}", expected "${code}"`);
  }
}

// ---------------------------------------------------------------------------
// Codes, read from lib/scan-data.ts
// ---------------------------------------------------------------------------

function readCodes() {
  const source = fs.readFileSync(SCAN_DATA, "utf8");

  const demoBlock = source.match(/export const demoBin[\s\S]*?\n};/);
  const demo = demoBlock?.[0].match(/qrCode:\s*"([^"]+)"/)?.[1];
  if (!demo) {
    throw new Error("Could not find demoBin.qrCode in lib/scan-data.ts");
  }

  const binsBlock = source.match(/export const recyclingBins[\s\S]*?\n];/);
  const real = [...(binsBlock?.[0].matchAll(/qrCode:\s*"([^"]+)"/g) ?? [])].map(
    (match) => match[1],
  );

  return { demo, real };
}

function slug(code) {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function main() {
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const explicit = args.filter((arg) => !arg.startsWith("--"));

  const { demo, real } = readCodes();
  const codes = explicit.length > 0 ? explicit : all ? [demo, ...real] : [demo];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const code of codes) {
    const { img, qr } = renderSticker(code);
    verify(img, code);

    const file = path.join(OUT_DIR, `${slug(code)}.png`);
    fs.writeFileSync(file, encodePNG(img));
    console.log(
      `${path.relative(ROOT, file)}  ${img.width}x${img.height}  ` +
        `v${qr.version}-${qr.level}  "${code}"  verified`,
    );
  }
}

main();
