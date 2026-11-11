"use client";

import { useMemo } from "react";

import { spriteStyleFor } from "@/app/components/home/house/decor-sprite";
import { GRASS_LIGHT, gardenById, gardenItems, gardenSheet } from "@/lib/garden-data";

/** Deterministic PRNG — the same scatter every render, and on both server and client. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Trees are hand-placed and edge-anchored rather than scattered: the header is
 * only 140–220px tall, so percentage placement would squash the arrangement
 * between its two heights. Anchoring to the right and bottom edges keeps the
 * top-left column — greeting, name, chips — reading as open grass.
 */
const TREES: Array<{
  id: string;
  scale: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}> = [
  // The oak hangs well off the right edge: cropped any tighter its trunk is cut
  // off too and the canopy reads as a flat green corner rather than a tree.
  { id: "tree-big", scale: 2, right: -58, bottom: -26 },
  { id: "tree-pine", scale: 2, right: 38, bottom: -16 },
  { id: "tree-bush", scale: 2, right: 104, bottom: -24 },
  { id: "tree-pine", scale: 2, right: 168, bottom: -12 },
  { id: "tree-bush", scale: 2, left: -22, bottom: -26 },
  { id: "tree-pine", scale: 2, left: 48, bottom: -18 },
];

/** Darker ground blobs, edge-anchored for the same reason the trees are. */
const PATCHES: Array<{ scale: number; left?: number; right?: number; top: number }> = [
  { scale: 3, left: -70, top: -58 },
  { scale: 2, right: -20, top: 40 },
  { scale: 2, left: 96, top: -34 },
];

/**
 * The sheet's scatter sprites split by how they read at a distance. Greenery is
 * small and green, so it disappears into the grass and can go anywhere; stumps,
 * rocks and mushrooms are large brown shapes that look like litter if they
 * float in the open field, so they are rarer and confined to the lower band
 * near the tree line.
 */
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

const SCATTER_COUNT = 44;
/** Share of scatter drawn from the greenery pool rather than the ground pool. */
const FLORA_SHARE = 0.82;

/**
 * Greenery from the woods sheet, as the home header's background: flat grass
 * for the ground, darker patches to break it up, small scattered sprites for
 * detail, and trees framing the right and bottom edges.
 *
 * A light scrim runs from the top-left — the grass is saturated enough that the
 * scattered sprites would otherwise compete with the dark greeting text sitting
 * on top of it. It clears toward the bottom-right so the trees stay vivid.
 */
export function WoodsBackdrop() {
  const scatter = useMemo(() => {
    const sprites = gardenItems("scatter");
    const flora = sprites.filter((item) => FLORA.has(item.id));
    const ground = sprites.filter((item) => !FLORA.has(item.id));
    const random = mulberry32(0x5eed1e);
    return Array.from({ length: SCATTER_COUNT }, (_, index) => {
      const isFlora = random() < FLORA_SHARE || ground.length === 0;
      const pool = isFlora ? flora : ground;
      const item = pool[Math.floor(random() * pool.length)];
      return {
        key: `${item.id}-${index}`,
        item,
        left: random() * 100,
        // Ground clutter sits down in the tree line, which explains it being
        // there; any higher and it reads as litter dropped on an open lawn.
        top: isFlora ? random() * 100 : 74 + random() * 26,
        scale: isFlora && random() < 0.3 ? 3 : 2,
      };
    });
  }, []);

  const patch = gardenById.get("grass-patch");

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0" style={{ backgroundColor: GRASS_LIGHT }} />

      {patch &&
        PATCHES.map(({ scale, left, right, top }, index) => (
          <span
            key={`patch-${index}`}
            className="absolute opacity-60"
            style={{
              ...spriteStyleFor(gardenSheet, patch, scale),
              left: left === undefined ? undefined : left,
              right: right === undefined ? undefined : right,
              top,
            }}
          />
        ))}

      {scatter.map(({ key, item, left, top, scale }) => (
        <span
          key={key}
          className="absolute"
          style={{
            ...spriteStyleFor(gardenSheet, item, scale),
            left: `${left}%`,
            top: `${top}%`,
          }}
        />
      ))}

      {TREES.map((tree, index) => {
        const item = gardenById.get(tree.id);
        if (!item) return null;
        return (
          <span
            key={`tree-${index}`}
            className="absolute drop-shadow-[0_4px_5px_rgba(16,40,29,0.3)]"
            style={{
              ...spriteStyleFor(gardenSheet, item, tree.scale),
              left: tree.left,
              right: tree.right,
              top: tree.top,
              bottom: tree.bottom,
            }}
          />
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-br from-leaf-50/75 via-leaf-50/20 to-transparent" />
    </div>
  );
}
