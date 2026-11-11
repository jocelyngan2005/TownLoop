import type { CSSProperties } from "react";

import { decorSheet, type DecorGeometry } from "@/lib/decor-data";

/** Just enough of a manifest to address sprites on it. */
export type SheetMeta = { sheet: string; sheetWidth: number; sheetHeight: number };
export type SpriteRect = Pick<DecorGeometry, "x" | "y" | "w" | "h">;

/**
 * Draws one sprite straight out of a shared tilesheet.
 *
 * Each catalogue is a single small PNG, so we offset it with
 * background-position rather than loading one file per item (which costs far
 * more in per-file PNG overhead than the pixels are worth).
 */
export function spriteStyleFor(
  meta: SheetMeta,
  item: SpriteRect,
  scale: number,
): CSSProperties {
  return {
    width: item.w * scale,
    height: item.h * scale,
    backgroundImage: `url(${meta.sheet})`,
    backgroundPosition: `${-item.x * scale}px ${-item.y * scale}px`,
    backgroundSize: `${meta.sheetWidth * scale}px ${meta.sheetHeight * scale}px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
  };
}

/** Sprite from the interiors (furniture) sheet. */
export function spriteStyle(item: SpriteRect, scale: number): CSSProperties {
  return spriteStyleFor(decorSheet, item, scale);
}

export function DecorSprite({
  item,
  scale,
  className,
  style,
}: {
  item: SpriteRect;
  scale: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={className}
      style={{ ...spriteStyle(item, scale), ...style }}
    />
  );
}
