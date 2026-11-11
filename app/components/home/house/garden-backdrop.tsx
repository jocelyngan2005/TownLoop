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

/** Trees are hand-placed so they frame the room instead of landing on top of it. */
const TREES = [
  { id: "tree-big", left: -6, top: 2, scale: 3 },
  { id: "tree-pine", left: 78, top: 1, scale: 3 },
  { id: "tree-bush", left: 88, top: 20, scale: 2 },
  { id: "tree-bush", left: 2, top: 74, scale: 2 },
  { id: "tree-pine", left: 86, top: 80, scale: 3 },
  { id: "tree-big", left: 62, top: 86, scale: 2 },
];

const SCATTER_COUNT = 64;

/**
 * The garden the pixel house sits in: flat grass from the woods sheet, with
 * scattered greenery and hand-placed trees around the edges.
 *
 * A dark scrim sits on top of the greenery — the grass is bright enough that
 * the dialog's white text would otherwise fall well below a readable contrast
 * ratio. The scrim is strongest at the top and bottom, where the header and
 * controls are, and clears in the middle so the room reads against grass.
 */
export function GardenBackdrop() {
  const scatter = useMemo(() => {
    const sprites = gardenItems("scatter");
    const random = mulberry32(0x7a11b0);
    return Array.from({ length: SCATTER_COUNT }, (_, index) => {
      const item = sprites[Math.floor(random() * sprites.length)];
      return {
        key: `${item.id}-${index}`,
        item,
        left: random() * 100,
        top: random() * 100,
        scale: random() < 0.25 ? 3 : 2,
      };
    });
  }, []);

  const patch = gardenById.get("grass-patch");

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundColor: GRASS_LIGHT }} />

      {/* Darker terrain blobs break up the flat ground colour. */}
      {patch &&
        [
          { left: -10, top: 10, scale: 4 },
          { left: 55, top: 48, scale: 5 },
          { left: 10, top: 70, scale: 3 },
        ].map((blob, index) => (
          <span
            key={`patch-${index}`}
            className="absolute opacity-70"
            style={{
              ...spriteStyleFor(gardenSheet, patch, blob.scale),
              left: `${blob.left}%`,
              top: `${blob.top}%`,
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
            className="absolute drop-shadow-[0_6px_6px_rgba(16,40,29,0.35)]"
            style={{
              ...spriteStyleFor(gardenSheet, item, tree.scale),
              left: `${tree.left}%`,
              top: `${tree.top}%`,
            }}
          />
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-b from-leaf-900/75 via-leaf-900/10 to-leaf-900/85" />
    </div>
  );
}
