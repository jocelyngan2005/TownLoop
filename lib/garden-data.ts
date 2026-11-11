import catalog from "@/lib/garden-catalog.json";
import type { DecorGeometry, DecorSheet } from "@/lib/decor-data";

export type GardenItem = DecorGeometry;

export const gardenSheet = catalog as DecorSheet;

export const gardenById = new Map(gardenSheet.items.map((item) => [item.id, item]));

export function gardenItems(category: string): GardenItem[] {
  return gardenSheet.items.filter((item) => item.category === category);
}

/**
 * Flat colours sampled from the grass blob interiors on the woods sheet —
 * those regions are a single RGB value, so the ground is a background-color
 * rather than a tiled sprite. Detail comes from the scatter sprites on top.
 */
export const GRASS_LIGHT = "#59c135";
export const GRASS_DARK = "#14a02e";
