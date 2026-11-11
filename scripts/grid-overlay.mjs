// Render a tilesheet upscaled with a labelled tile grid, so tile rectangles
// can be read off by eye when authoring a sprite manifest.
//
// Usage: node scripts/grid-overlay.mjs <sheet.png> --out <file.png> [--tile 16] [--scale 6]
import fs from "node:fs";

import { blank, decodePNG, encodePNG, paste, scale as upscale } from "./lib/png.mjs";

// 3x5 pixel digits, one string per row, MSB left.
const DIGITS = {
  0: ["111", "101", "101", "101", "111"],
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"],
  7: ["111", "001", "001", "001", "001"],
  8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"],
};

function drawText(img, text, x, y, px, color) {
  let cx = x;
  for (const ch of String(text)) {
    const glyph = DIGITS[ch];
    if (!glyph) {
      cx += 4 * px;
      continue;
    }
    glyph.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit !== "1") return;
        for (let dy = 0; dy < px; dy += 1) {
          for (let dx = 0; dx < px; dx += 1) {
            const tx = cx + gx * px + dx;
            const ty = y + gy * px + dy;
            if (tx < 0 || ty < 0 || tx >= img.width || ty >= img.height) continue;
            const d = (ty * img.width + tx) * 4;
            [img.data[d], img.data[d + 1], img.data[d + 2], img.data[d + 3]] = [...color, 255];
          }
        }
      });
    });
    cx += 4 * px;
  }
}

function hline(img, y, color, alpha = 255) {
  if (y < 0 || y >= img.height) return;
  for (let x = 0; x < img.width; x += 1) {
    const d = (y * img.width + x) * 4;
    for (let c = 0; c < 3; c += 1) {
      img.data[d + c] = (img.data[d + c] * (255 - alpha) + color[c] * alpha) / 255;
    }
  }
}

function vline(img, x, color, alpha = 255) {
  if (x < 0 || x >= img.width) return;
  for (let y = 0; y < img.height; y += 1) {
    const d = (y * img.width + x) * 4;
    for (let c = 0; c < 3; c += 1) {
      img.data[d + c] = (img.data[d + c] * (255 - alpha) + color[c] * alpha) / 255;
    }
  }
}

function main() {
  const argv = process.argv.slice(2);
  const input = argv.find((a) => !a.startsWith("--"));
  const get = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i === -1 ? dflt : argv[i + 1];
  };
  const out = get("--out");
  const tile = Number(get("--tile", 16));
  const factor = Number(get("--scale", 6));
  if (!input || !out) throw new Error("usage: grid-overlay.mjs <sheet.png> --out <file.png>");

  const img = decodePNG(input);
  const cols = Math.ceil(img.width / tile);
  const rows = Math.ceil(img.height / tile);

  const pad = 9 * factor; // gutter for the axis labels
  const body = upscale(img, factor);
  const canvas = blank(body.width + pad, body.height + pad, [20, 20, 26, 255]);

  // Checkerboard behind the art so transparency is legible.
  for (let y = 0; y < body.height; y += 1) {
    for (let x = 0; x < body.width; x += 1) {
      const shade = (((x / factor) >> 3) + ((y / factor) >> 3)) % 2 ? 62 : 48;
      const d = ((y + pad) * canvas.width + x + pad) * 4;
      canvas.data[d] = shade;
      canvas.data[d + 1] = shade;
      canvas.data[d + 2] = shade + 5;
      canvas.data[d + 3] = 255;
    }
  }
  paste(canvas, body, pad, pad);

  for (let c = 0; c <= cols; c += 1) {
    const x = pad + c * tile * factor;
    vline(canvas, x, c % 4 === 0 ? [255, 90, 90] : [255, 255, 255], c % 4 === 0 ? 220 : 90);
    if (c < cols) drawText(canvas, c, x + 3, 2, Math.max(1, factor / 2), [255, 220, 120]);
  }
  for (let r = 0; r <= rows; r += 1) {
    const y = pad + r * tile * factor;
    hline(canvas, y, r % 4 === 0 ? [255, 90, 90] : [255, 255, 255], r % 4 === 0 ? 220 : 90);
    if (r < rows) drawText(canvas, r, 2, y + 3, Math.max(1, factor / 2), [255, 220, 120]);
  }

  fs.writeFileSync(out, encodePNG(canvas));
  console.log(`${input}: ${cols} cols x ${rows} rows -> ${out}`);
}

main();
