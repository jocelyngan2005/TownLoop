// Minimal dependency-free PNG decoder/encoder (8-bit, non-interlaced).
// PNG is zlib-deflated filtered scanlines, so node:zlib is all we need.
import fs from "node:fs";
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

/** Decode a PNG file into { width, height, data } where data is RGBA bytes. */
export function decodePNG(file) {
  const buf = fs.readFileSync(file);
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error(`${file}: not a PNG`);

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let palette = null;
  let trns = null;
  const idat = [];

  let pos = 8;
  while (pos + 8 <= buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error(`${file}: interlaced PNGs are not supported`);
    } else if (type === "PLTE") palette = Buffer.from(data);
    else if (type === "tRNS") trns = Buffer.from(data);
    else if (type === "IDAT") idat.push(Buffer.from(data));
    else if (type === "IEND") break;

    pos += 12 + length;
  }

  if (bitDepth !== 8) throw new Error(`${file}: only 8-bit channels supported (got ${bitDepth})`);
  const channels = CHANNELS[colorType];
  if (!channels) throw new Error(`${file}: unsupported color type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = channels;
  const stride = width * bpp;
  const flat = Buffer.alloc(height * stride);

  // Undo per-scanline filtering.
  let rp = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rp];
    rp += 1;
    const line = raw.subarray(rp, rp + stride);
    rp += stride;

    const base = y * stride;
    const prevBase = base - stride;
    for (let i = 0; i < stride; i += 1) {
      const a = i >= bpp ? flat[base + i - bpp] : 0;
      const b = y > 0 ? flat[prevBase + i] : 0;
      const c = y > 0 && i >= bpp ? flat[prevBase + i - bpp] : 0;
      let v = line[i];
      switch (filter) {
        case 0:
          break;
        case 1:
          v = (v + a) & 0xff;
          break;
        case 2:
          v = (v + b) & 0xff;
          break;
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pred) & 0xff;
          break;
        }
        default:
          throw new Error(`${file}: unknown filter type ${filter}`);
      }
      flat[base + i] = v;
    }
  }

  // Normalise every colour type to straight RGBA.
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0, n = width * height; i < n; i += 1) {
    let r;
    let g;
    let b;
    let a = 255;
    if (colorType === 6) {
      r = flat[i * 4];
      g = flat[i * 4 + 1];
      b = flat[i * 4 + 2];
      a = flat[i * 4 + 3];
    } else if (colorType === 2) {
      r = flat[i * 3];
      g = flat[i * 3 + 1];
      b = flat[i * 3 + 2];
    } else if (colorType === 0) {
      r = g = b = flat[i];
    } else if (colorType === 4) {
      r = g = b = flat[i * 2];
      a = flat[i * 2 + 1];
    } else {
      const pi = flat[i];
      r = palette[pi * 3];
      g = palette[pi * 3 + 1];
      b = palette[pi * 3 + 2];
      a = trns && pi < trns.length ? trns[pi] : 255;
    }
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }

  return { width, height, data };
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([length, typed, crc]);
}

/** Encode { width, height, data } (RGBA bytes) to a PNG buffer. */
export function encodePNG({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none — tiny images, keeps it simple
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Copy a rectangle out of an image. */
export function crop(img, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row += 1) {
    const src = ((y + row) * img.width + x) * 4;
    img.data.copy(out, row * w * 4, src, src + w * 4);
  }
  return { width: w, height: h, data: out };
}

/** Nearest-neighbour upscale — keeps pixel art crisp. */
export function scale(img, factor) {
  const w = img.width * factor;
  const h = img.height * factor;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    const sy = (y / factor) | 0;
    for (let x = 0; x < w; x += 1) {
      const sx = (x / factor) | 0;
      const s = (sy * img.width + sx) * 4;
      const d = (y * w + x) * 4;
      out[d] = img.data[s];
      out[d + 1] = img.data[s + 1];
      out[d + 2] = img.data[s + 2];
      out[d + 3] = img.data[s + 3];
    }
  }
  return { width: w, height: h, data: out };
}

export function blank(width, height, fill = [0, 0, 0, 0]) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return { width, height, data };
}

/** Alpha-composite `src` onto `dst` at (dx, dy). */
export function paste(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y += 1) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x += 1) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width) continue;
      const s = (y * src.width + x) * 4;
      const a = src.data[s + 3];
      if (a === 0) continue;
      const d = (ty * dst.width + tx) * 4;
      if (a === 255) {
        dst.data[d] = src.data[s];
        dst.data[d + 1] = src.data[s + 1];
        dst.data[d + 2] = src.data[s + 2];
        dst.data[d + 3] = 255;
        continue;
      }
      const da = dst.data[d + 3];
      const outA = a + (da * (255 - a)) / 255;
      for (let c = 0; c < 3; c += 1) {
        dst.data[d + c] = outA === 0
          ? 0
          : (src.data[s + c] * a + dst.data[d + c] * da * (255 - a) / 255) / outA;
      }
      dst.data[d + 3] = outA;
    }
  }
}
