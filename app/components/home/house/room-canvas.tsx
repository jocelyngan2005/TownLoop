"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { spriteStyle } from "@/app/components/home/house/decor-sprite";
import type { Placement } from "@/app/components/home/house/use-house-layout";
import {
  ROOM_H,
  ROOM_W,
  WALL_H,
  snapPlacement,
} from "@/app/components/home/house/room-geometry";
import { decorById, TILE } from "@/lib/decor-data";

type DragState = { key: string; px: number; py: number; grabX: number; grabY: number };

export function RoomCanvas({
  placements,
  selectedKey,
  onSelect,
  onMove,
}: {
  placements: Placement[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onMove: (key: string, tx: number, ty: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Integer scale keeps pixel art crisp; recompute as the viewport changes.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const available = frame.clientWidth;
      setScale(Math.max(2, Math.floor(available / ROOM_W)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const toRoomPixels = useCallback(
    (clientX: number, clientY: number) => {
      const surface = frameRef.current?.querySelector("[data-room-surface]");
      const rect = surface?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
    },
    [scale],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent, placement: Placement) => {
      const item = decorById.get(placement.itemId);
      if (!item) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const pointer = toRoomPixels(event.clientX, event.clientY);
      onSelect(placement.key);
      setDrag({
        key: placement.key,
        px: placement.tx * TILE,
        py: placement.ty * TILE,
        grabX: pointer.x - placement.tx * TILE,
        grabY: pointer.y - placement.ty * TILE,
      });
    },
    [onSelect, toRoomPixels],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!drag) return;
      const pointer = toRoomPixels(event.clientX, event.clientY);
      setDrag({ ...drag, px: pointer.x - drag.grabX, py: pointer.y - drag.grabY });
    },
    [drag, toRoomPixels],
  );

  const endDrag = useCallback(() => {
    if (!drag) return;
    const placement = placements.find((candidate) => candidate.key === drag.key);
    const item = placement ? decorById.get(placement.itemId) : undefined;
    if (placement && item) {
      const { tx, ty } = snapPlacement(item, drag.px, drag.py);
      onMove(placement.key, tx, ty);
    }
    setDrag(null);
  }, [drag, onMove, placements]);

  // Nudge the selected item with the arrow keys — dragging is pointer-only.
  useEffect(() => {
    if (!selectedKey) return;
    function onKeyDown(event: KeyboardEvent) {
      const delta =
        event.key === "ArrowLeft"
          ? [-1, 0]
          : event.key === "ArrowRight"
            ? [1, 0]
            : event.key === "ArrowUp"
              ? [0, -1]
              : event.key === "ArrowDown"
                ? [0, 1]
                : null;
      if (!delta) return;
      const placement = placements.find((candidate) => candidate.key === selectedKey);
      const item = placement ? decorById.get(placement.itemId) : undefined;
      if (!placement || !item) return;
      event.preventDefault();
      const { tx, ty } = snapPlacement(
        item,
        (placement.tx + delta[0]) * TILE,
        (placement.ty + delta[1]) * TILE,
      );
      onMove(placement.key, tx, ty);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onMove, placements, selectedKey]);

  // Items lower in the room draw in front of items further back.
  const ordered = [...placements].sort((a, b) => {
    const itemA = decorById.get(a.itemId);
    const itemB = decorById.get(b.itemId);
    return (a.ty * TILE + (itemA?.h ?? 0)) - (b.ty * TILE + (itemB?.h ?? 0));
  });

  const dragItem = drag
    ? decorById.get(placements.find((p) => p.key === drag.key)?.itemId ?? "")
    : undefined;
  const ghost = drag && dragItem ? snapPlacement(dragItem, drag.px, drag.py) : null;

  return (
    <div ref={frameRef} className="flex w-full justify-center">
      <div
        data-room-surface
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onSelect(null);
        }}
        className="relative touch-none overflow-hidden rounded-xl shadow-[0_18px_30px_-20px_rgba(16,40,29,0.9)]"
        style={{ width: ROOM_W * scale, height: ROOM_H * scale }}
      >
        {/* Wall and floor are tiled from the sliced surface sprites, which is
            what CSS background-repeat needs — a sheet offset cannot repeat. */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: WALL_H * scale,
            backgroundImage: "url(/sprites/decor/wall-stone.png)",
            backgroundSize: `${48 * scale}px ${48 * scale}px`,
            imageRendering: "pixelated",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: (ROOM_H - WALL_H) * scale,
            backgroundImage: "url(/sprites/decor/floor-wood.png)",
            backgroundSize: `${TILE * scale}px ${TILE * scale}px`,
            imageRendering: "pixelated",
          }}
        />

        {/* Snap target under the item being dragged. */}
        {ghost && dragItem && (
          <div
            className="absolute rounded-sm bg-white/35 ring-2 ring-white/70"
            style={{
              left: ghost.tx * TILE * scale,
              top: ghost.ty * TILE * scale,
              width: dragItem.w * scale,
              height: dragItem.h * scale,
            }}
          />
        )}

        {ordered.map((placement) => {
          const item = decorById.get(placement.itemId);
          if (!item) return null;
          const isDragging = drag?.key === placement.key;
          const left = isDragging && drag ? drag.px : placement.tx * TILE;
          const top = isDragging && drag ? drag.py : placement.ty * TILE;
          const selected = selectedKey === placement.key;

          return (
            <button
              key={placement.key}
              type="button"
              aria-label={`${item.name}, drag to move`}
              aria-pressed={selected}
              onPointerDown={(event) => handlePointerDown(event, placement)}
              onClick={(event) => event.preventDefault()}
              className="absolute cursor-grab touch-none active:cursor-grabbing"
              style={{
                left: left * scale,
                top: top * scale,
                width: item.w * scale,
                height: item.h * scale,
                zIndex: isDragging ? 50 : 1,
                outline: selected ? "2px solid var(--color-sun-400)" : undefined,
                outlineOffset: 2,
              }}
            >
              <span
                aria-hidden
                className="block"
                style={{
                  ...spriteStyle(item, scale),
                  filter: isDragging
                    ? "drop-shadow(0 6px 6px rgba(0,0,0,0.45))"
                    : undefined,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
