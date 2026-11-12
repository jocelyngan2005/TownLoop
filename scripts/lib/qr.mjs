/**
 * A small QR encoder, byte mode, versions 1-4.
 *
 * Written rather than installed for the same reason as lib/png.mjs: the asset
 * scripts in this folder stay dependency-free so a checkout can regenerate
 * everything in public/ with nothing but Node.
 *
 * Versions 1-4 are enough for a bin code (16 characters at most) and are the
 * range where every error-correction block is the same length, which keeps the
 * interleaving step simple. Version 5 and up mix two block sizes and would
 * need more table data than this file is worth.
 *
 * Structure follows Project Nayuki's reference QR implementation, the clearest
 * public description of the spec's bit-placement and masking rules.
 */

/** Byte-mode error-correction levels, in the bit encoding the format info uses. */
const EC_LEVELS = {
  L: { ordinal: 0, formatBits: 1 },
  M: { ordinal: 1, formatBits: 0 },
  Q: { ordinal: 2, formatBits: 3 },
  H: { ordinal: 3, formatBits: 2 },
};

/** Indexed [ecOrdinal][version]; index 0 of each row is unused padding. */
const ECC_CODEWORDS_PER_BLOCK = [
  [0, 7, 10, 15, 20], // L
  [0, 10, 16, 26, 18], // M
  [0, 13, 22, 18, 26], // Q
  [0, 17, 28, 22, 16], // H
];

const NUM_EC_BLOCKS = [
  [0, 1, 1, 1, 1], // L
  [0, 1, 1, 1, 2], // M
  [0, 1, 1, 2, 2], // Q
  [0, 1, 1, 2, 4], // H
];

const MIN_VERSION = 1;
const MAX_VERSION = 4;

// ---------------------------------------------------------------------------
// GF(256) arithmetic for Reed-Solomon, primitive polynomial 0x11D
// ---------------------------------------------------------------------------

function gfMul(a, b) {
  let result = 0;
  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((b >>> i) & 1) * a;
  }
  return result & 0xff;
}

/** Divisor polynomial for `degree` error-correction codewords, high term first. */
function rsDivisor(degree) {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;

  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data, divisor) {
  const result = new Uint8Array(divisor.length);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < divisor.length; i += 1) {
      result[i] ^= gfMul(divisor[i], factor);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

function rawDataModules(version) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
  }
  return result;
}

function rawCodewords(version) {
  return Math.floor(rawDataModules(version) / 8);
}

function dataCodewords(version, ec) {
  return (
    rawCodewords(version) -
    ECC_CODEWORDS_PER_BLOCK[ec.ordinal][version] * NUM_EC_BLOCKS[ec.ordinal][version]
  );
}

/** How many raw bytes fit, after the 4-bit mode and 8-bit length header. */
export function byteCapacity(version, level = "H") {
  return Math.floor((dataCodewords(version, EC_LEVELS[level]) * 8 - 12) / 8);
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

function buildCodewords(bytes, version, ec) {
  const capacity = dataCodewords(version, ec);
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };

  push(0x4, 4); // byte mode
  push(bytes.length, 8); // length fits 8 bits for versions 1-9
  for (const byte of bytes) push(byte, 8);

  // Terminator, then pad to a whole byte, then the spec's alternating filler.
  push(0, Math.min(4, capacity * 8 - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity * 8; pad ^= 0xec ^ 0x11) {
    push(pad, 8);
  }

  const codewords = new Uint8Array(bits.length / 8);
  bits.forEach((bit, i) => {
    codewords[i >>> 3] |= bit << (7 - (i & 7));
  });
  return codewords;
}

/** Split into blocks, append each block's remainder, interleave the lot. */
function addEcAndInterleave(data, version, ec) {
  const numBlocks = NUM_EC_BLOCKS[ec.ordinal][version];
  const eccLen = ECC_CODEWORDS_PER_BLOCK[ec.ordinal][version];
  const total = rawCodewords(version);
  const numShortBlocks = numBlocks - (total % numBlocks);
  const shortLen = Math.floor(total / numBlocks);
  const divisor = rsDivisor(eccLen);

  const blocks = [];
  let offset = 0;
  for (let i = 0; i < numBlocks; i += 1) {
    const length = shortLen - eccLen + (i < numShortBlocks ? 0 : 1);
    const block = Array.from(data.slice(offset, offset + length));
    offset += length;
    const ecc = rsRemainder(block, divisor);
    // Short blocks carry a placeholder so every block transposes at the same
    // width; the interleave below skips it.
    if (i < numShortBlocks) block.push(0);
    blocks.push(block.concat(Array.from(ecc)));
  }

  const result = [];
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShortBlocks) result.push(block[i]);
    });
  }
  return Uint8Array.from(result);
}

// ---------------------------------------------------------------------------
// Module placement
// ---------------------------------------------------------------------------

function createGrid(version) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(false));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));

  const set = (x, y, dark) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, dist !== 2 && dist !== 4);
      }
    }
  };

  // Timing patterns first; the finders overwrite their ends.
  for (let i = 0; i < size; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  // Versions 2-6 carry exactly one alignment pattern, opposite the top-left
  // finder; the other three grid positions collide with finders and are omitted.
  if (version >= 2) {
    const pos = size - 7;
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        set(pos + dx, pos + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  return { size, modules, isFunction, set };
}

function drawFormatBits(grid, ec, mask) {
  const { size, set } = grid;
  const data = (ec.formatBits << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const bit = (i) => ((bits >>> i) & 1) !== 0;

  for (let i = 0; i <= 5; i += 1) set(8, i, bit(i));
  set(8, 7, bit(6));
  set(8, 8, bit(7));
  set(7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) set(14 - i, 8, bit(i));

  for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true); // the always-dark module
}

function drawCodewords(grid, codewords) {
  const { size, modules, isFunction } = grid;
  let i = 0;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // the vertical timing strip is not data
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (isFunction[y][x] || i >= codewords.length * 8) continue;
        modules[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
        i += 1;
      }
    }
  }
}

function maskBit(mask, x, y) {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(grid, mask) {
  const { size, modules, isFunction } = grid;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isFunction[y][x] && maskBit(mask, x, y)) modules[y][x] = !modules[y][x];
    }
  }
}

/** The spec's four penalty rules; the lowest-scoring mask is the one used. */
function penalty(grid) {
  const { size, modules } = grid;
  let score = 0;

  const runScore = (run) => (run >= 5 ? 3 + (run - 5) : 0);

  for (let y = 0; y < size; y += 1) {
    let run = 0;
    let colour = false;
    for (let x = 0; x < size; x += 1) {
      if (modules[y][x] === colour) run += 1;
      else {
        score += runScore(run);
        colour = modules[y][x];
        run = 1;
      }
    }
    score += runScore(run);
  }

  for (let x = 0; x < size; x += 1) {
    let run = 0;
    let colour = false;
    for (let y = 0; y < size; y += 1) {
      if (modules[y][x] === colour) run += 1;
      else {
        score += runScore(run);
        colour = modules[y][x];
        run = 1;
      }
    }
    score += runScore(run);
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        score += 3;
      }
    }
  }

  // The finder-like 1:1:3:1:1 sequence, with four light modules on either side.
  const FINDER = [true, false, true, true, true, false, true];
  const matchesAt = (get, i, size_) => {
    for (let k = 0; k < 7; k += 1) if (get(i + k) !== FINDER[k]) return false;
    const before = [i - 4, i - 3, i - 2, i - 1].every((j) => j < 0 || !get(j));
    const after = [i + 7, i + 8, i + 9, i + 10].every((j) => j >= size_ || !get(j));
    return before || after;
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x + 7 <= size; x += 1) {
      if (matchesAt((i) => modules[y][i], x, size)) score += 40;
    }
  }
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y + 7 <= size; y += 1) {
      if (matchesAt((i) => modules[i][x], y, size)) score += 40;
    }
  }

  let dark = 0;
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) if (modules[y][x]) dark += 1;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode `text` as a QR matrix.
 *
 * Returns `{ size, version, level, modules }`, where `modules[y][x]` is true
 * for a dark module. No quiet zone is included — the renderer adds it.
 */
export function encodeQR(text, { level = "H" } = {}) {
  const ec = EC_LEVELS[level];
  if (!ec) throw new Error(`Unknown error-correction level: ${level}`);

  const bytes = Array.from(Buffer.from(text, "utf8"));

  let version = MIN_VERSION;
  while (version <= MAX_VERSION && bytes.length > byteCapacity(version, level)) {
    version += 1;
  }
  if (version > MAX_VERSION) {
    throw new Error(
      `"${text}" is ${bytes.length} bytes; the largest supported version ` +
        `(${MAX_VERSION} at level ${level}) holds ${byteCapacity(MAX_VERSION, level)}.`,
    );
  }

  const codewords = addEcAndInterleave(buildCodewords(bytes, version, ec), version, ec);

  let best = null;
  for (let mask = 0; mask < 8; mask += 1) {
    const grid = createGrid(version);
    drawFormatBits(grid, ec, mask);
    drawCodewords(grid, codewords);
    applyMask(grid, mask);
    const score = penalty(grid);
    if (!best || score < best.score) best = { score, grid, mask };
  }

  return {
    size: best.grid.size,
    version,
    level,
    mask: best.mask,
    modules: best.grid.modules,
  };
}
