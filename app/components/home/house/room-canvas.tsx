"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { CloseIcon, RotateIcon } from "@/app/components/icons";
import { spriteStyle } from "@/app/components/home/house/decor-sprite";
import type { Placement } from "@/app/components/home/house/use-house-layout";
import { snapPlacement } from "@/app/components/home/house/room-geometry";
import { decorById, LINING, TILE, variantOf } from "@/lib/decor-data";
import {
  containsTile,
  houseBounds,
  liningGeometry,
  starterRoom,
  type HouseBounds,
  type RoomDef,
} from "@/lib/house-plan";

type DragState = { key: string; px: number; py: number; grabX: number; grabY: number };

/** Below this the pixels get too small to read, so the house scrolls instead. */
const MIN_SCALE = 2;

/**
 * The view of a placement that is currently on screen: its rules (layer) from
 * the entry, its size from the facing it was last turned to.
 */
function resolve(placement: Placement) {
  const item = decorById.get(placement.itemId);
  if (!item) return null;
  return { item, view: variantOf(item, placement.facing) };
}

/**
 * The room a placement currently sits in — the one a drag falls back to when
 * it is dropped over the garden, so a piece flung off the house returns to
 * where it came from.
 */
function roomOf(rooms: RoomDef[], placement: Placement) {
  return (
    rooms.find((room) => containsTile(room, placement.tx, placement.ty)) ??
    rooms[0] ??
    starterRoom
  );
}

/** Where a tiled surface sprite lives, so a room can repeat it as a background. */
function surfaceTile(id: string) {
  const entry = decorById.get(id);
  const view = entry ? variantOf(entry, 0) : null;
  return view ? { url: `/sprites/decor/${id}.png`, w: view.w, h: view.h } : null;
}

export function RoomCanvas({
  rooms,
  lockedRooms,
  placements,
  selectedKey,
  onSelect,
  onSelectRoom,
  onMove,
  onRotate,
  onRemove,
}: {
  rooms: RoomDef[];
  lockedRooms: RoomDef[];
  placements: Placement[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onSelectRoom: (roomId: string) => void;
  onMove: (key: string, tx: number, ty: number) => void;
  onRotate: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MIN_SCALE);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Locked rooms are drawn too, as dashed outlines, so the resident can see
  // where the house could grow. That makes the canvas the size of the whole
  // plan — which is also what stops the view jumping when a room is bought.
  const bounds = useMemo(() => houseBounds([...rooms, ...lockedRooms]), [rooms, lockedRooms]);
  const built = useMemo(() => houseBounds(rooms), [rooms]);
  // Measured from the canvas origin, which spans the whole plan — not from
  // the built rooms' own box, or the lining lands wherever the two differ.
  const lining = useMemo(() => liningGeometry(rooms, bounds), [rooms, bounds]);

  /**
   * Integer scale keeps pixel art crisp, so the house is fitted to whole
   * multiples and never stretched. Below MIN_SCALE it would be unreadable, so
   * past that point it stops shrinking and the frame scrolls instead.
   *
   * Fitted to what is *built*, not to the whole plan: the dashed outlines of
   * rooms that do not exist yet should not shrink the home someone actually
   * has. A starter living room therefore fills the frame, and the plan around
   * it is reached by scrolling.
   */
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const fit = Math.min(
        Math.floor(frame.clientWidth / built.width),
        Math.floor(frame.clientHeight / built.height),
      );
      setScale(Math.max(MIN_SCALE, fit));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [built.width, built.height]);

  /**
   * Centre the frame on the house someone has built — on open, and again
   * whenever they add a room. Without this the canvas spans the whole plan
   * and a new resident would open onto empty garden with their one room off
   * in a corner.
   */
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const centreX = ((built.tx - bounds.tx) * TILE + built.width / 2) * scale;
    const centreY = ((built.ty - bounds.ty) * TILE + built.height / 2) * scale;
    frame.scrollLeft = centreX - frame.clientWidth / 2;
    frame.scrollTop = centreY - frame.clientHeight / 2;
  }, [built, bounds, scale]);

  /** Pointer position in house pixels, relative to the surface's top-left. */
  const toHousePixels = useCallback(
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
      if (!resolve(placement)) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const pointer = toHousePixels(event.clientX, event.clientY);
      onSelect(placement.key);
      setDrag({
        key: placement.key,
        px: placement.tx * TILE,
        py: placement.ty * TILE,
        grabX: pointer.x - placement.tx * TILE,
        grabY: pointer.y - placement.ty * TILE,
      });
    },
    [onSelect, toHousePixels],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!drag) return;
      const pointer = toHousePixels(event.clientX, event.clientY);
      setDrag({ ...drag, px: pointer.x - drag.grabX, py: pointer.y - drag.grabY });
    },
    [drag, toHousePixels],
  );

  const endDrag = useCallback(() => {
    if (!drag) return;
    const placement = placements.find((candidate) => candidate.key === drag.key);
    const resolved = placement ? resolve(placement) : null;
    if (placement && resolved) {
      const { item, view } = resolved;
      const { tx, ty } = snapPlacement(
        { ...view, layer: item.layer },
        rooms,
        roomOf(rooms, placement),
        drag.px,
        drag.py,
      );
      onMove(placement.key, tx, ty);
    }
    setDrag(null);
  }, [drag, onMove, placements, rooms]);

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
      const resolved = placement ? resolve(placement) : null;
      if (!placement || !resolved) return;
      event.preventDefault();
      const { tx, ty } = snapPlacement(
        { ...resolved.view, layer: resolved.item.layer },
        rooms,
        roomOf(rooms, placement),
        (placement.tx + delta[0]) * TILE,
        (placement.ty + delta[1]) * TILE,
      );
      onMove(placement.key, tx, ty);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onMove, placements, rooms, selectedKey]);

  // Items lower in the house draw in front of items further back, measured
  // from the current facing so turning a sofa onto its side re-sorts it.
  // Rugs come first whatever their position: they lie on the floor, and a rug
  // whose foot line happens to tie with a sofa's would otherwise cover it.
  const ordered = [...placements]
    .map((placement) => ({ placement, resolved: resolve(placement) }))
    .filter((entry) => entry.resolved !== null)
    .sort((a, b) => {
      const flat = (entry: typeof a) => (entry.resolved?.item.category === "rug" ? 0 : 1);
      const foot = (entry: typeof a) =>
        entry.placement.ty * TILE + (entry.resolved?.view.h ?? 0);
      return flat(a) - flat(b) || foot(a) - foot(b);
    });

  const dragged = drag ? placements.find((p) => p.key === drag.key) : undefined;
  const dragResolved = dragged ? resolve(dragged) : null;
  const ghost =
    drag && dragged && dragResolved
      ? snapPlacement(
          { ...dragResolved.view, layer: dragResolved.item.layer },
          rooms,
          roomOf(rooms, dragged),
          drag.px,
          drag.py,
        )
      : null;

  const selected = selectedKey
    ? placements.find((placement) => placement.key === selectedKey)
    : undefined;
  const selectedResolved = selected ? resolve(selected) : null;

  // House pixel -> CSS pixel, relative to the house bounds origin.
  const left = (x: number) => (x - bounds.tx * TILE) * scale;
  const top = (y: number) => (y - bounds.ty * TILE) * scale;

  return (
    <div ref={frameRef} className="flex min-h-0 w-full flex-1 overflow-auto overscroll-contain">
      <div
        data-room-surface
        /* `m-auto` rather than the parent centring its items: on a scroll
           container, `justify-center` pushes overflow past the scrollable
           origin and the start of the house becomes unreachable. Auto
           margins centre a flex item and still allow scrolling both ways. */
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerDown={(event) => {
          // Anything that is not a control deselects. Testing for the surface
          // itself would never fire: the floor and wall layers cover it, so
          // every tap on empty floor lands on a child, not on this element.
          if (!(event.target as HTMLElement).closest("button")) onSelect(null);
        }}
        /* `isolate` matters: without its own stacking context the lining's
           z-index would compete with the workshop drawer's in the dialog and
           draw straight over the open drawer. */
        className="relative isolate m-auto shrink-0"
        style={{ width: bounds.width * scale, height: bounds.height * scale }}
      >
        {rooms.map((room) => (
          <RoomSurface key={room.id} room={room} bounds={bounds} scale={scale} />
        ))}

        {lockedRooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelectRoom(room.id)}
            aria-label={`${room.name}, not built yet. Open details.`}
            className="absolute z-[55] grid place-items-center rounded-lg border-2 border-dashed border-white/45 bg-leaf-900/35 text-center transition hover:bg-leaf-900/50 active:scale-[0.99]"
            style={{
              left: left(room.tx * TILE),
              top: top(room.ty * TILE),
              width: room.cols * TILE * scale,
              height: room.rows * TILE * scale,
            }}
          >
            <span className="px-2">
              <span className="block text-[11px] font-semibold text-white [text-shadow:0_1px_3px_rgba(16,40,29,0.9)]">
                {room.name}
              </span>
              <span className="mt-0.5 block text-[10px] font-medium text-leaf-200">
                Tap to build
              </span>
            </span>
          </button>
        ))}

        {/* Snap target under the item being dragged. */}
        {ghost && dragResolved && (
          <div
            className="absolute z-[1] rounded-sm bg-white/35 ring-2 ring-white/70"
            style={{
              left: left(ghost.tx * TILE),
              top: top(ghost.ty * TILE),
              width: dragResolved.view.w * scale,
              height: dragResolved.view.h * scale,
            }}
          />
        )}

        {ordered.map(({ placement, resolved }) => {
          if (!resolved) return null;
          const { item, view } = resolved;
          const isDragging = drag?.key === placement.key;
          const x = isDragging && drag ? drag.px : placement.tx * TILE;
          const y = isDragging && drag ? drag.py : placement.ty * TILE;
          const isSelected = selectedKey === placement.key;

          return (
            <button
              key={placement.key}
              type="button"
              aria-label={`${item.name}, drag to move`}
              aria-pressed={isSelected}
              onPointerDown={(event) => handlePointerDown(event, placement)}
              onClick={(event) => event.preventDefault()}
              className="absolute cursor-grab touch-none active:cursor-grabbing"
              style={{
                left: left(x),
                top: top(y),
                width: view.w * scale,
                height: view.h * scale,
                zIndex: isDragging ? 50 : 2,
                outline: isSelected ? "2px solid var(--color-sun-400)" : undefined,
                outlineOffset: 2,
              }}
            >
              <span
                aria-hidden
                className="block"
                style={{
                  ...spriteStyle(view, scale),
                  filter: isDragging
                    ? "drop-shadow(0 6px 6px rgba(0,0,0,0.45))"
                    : undefined,
                }}
              />
            </button>
          );
        })}

        <HouseLining lining={lining} scale={scale} />

        {selected && selectedResolved && !drag && (
          <SelectionControls
            left={left(selected.tx * TILE)}
            top={top(selected.ty * TILE)}
            width={selectedResolved.view.w * scale}
            height={selectedResolved.view.h * scale}
            name={selectedResolved.item.name}
            canTurn={selectedResolved.item.variants.length > 1}
            onRotate={() => onRotate(selected.key)}
            onRemove={() => {
              onRemove(selected.key);
              onSelect(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

/** One room's wall band and floor, tiled from its own surface sprites. */
function RoomSurface({
  room,
  bounds,
  scale,
}: {
  room: RoomDef;
  bounds: HouseBounds;
  scale: number;
}) {
  const wall = surfaceTile(room.wallId);
  const floor = surfaceTile(room.floorId);

  const left = (room.tx - bounds.tx) * TILE * scale;
  const top = (room.ty - bounds.ty) * TILE * scale;
  const width = room.cols * TILE * scale;
  const wallHeight = room.wallRows * TILE * scale;
  const floorHeight = (room.rows - room.wallRows) * TILE * scale;

  // The tint is what gives each room its character — the sheet has only two
  // floors and two wall styles. It goes on the surfaces alone, so furniture
  // keeps the colours it was drawn in.
  const tinted = { filter: room.tint, imageRendering: "pixelated" as const };

  return (
    <>
      {wall && (
        <div
          className="absolute"
          style={{
            ...tinted,
            left,
            top,
            width,
            height: wallHeight,
            backgroundImage: `url(${wall.url})`,
            backgroundSize: `${wall.w * scale}px ${wall.h * scale}px`,
            // Anchored to the bottom so the skirting board always lands on the
            // floor line. The wall sprites are 48px tall and some rooms have a
            // 32px band; tiling from the top would crop the skirting off and
            // leave the wall meeting the floor with no join.
            backgroundPosition: "left bottom",
          }}
        />
      )}
      {floor && (
        <div
          className="absolute"
          style={{
            ...tinted,
            left,
            top: top + wallHeight,
            width,
            height: floorHeight,
            backgroundImage: `url(${floor.url})`,
            backgroundSize: `${floor.w * scale}px ${floor.h * scale}px`,
          }}
        />
      )}
    </>
  );
}

/**
 * The wooden lining around the house, drawn from the nine-slice in
 * public/sprites/decor/lining/.
 *
 * Absolute strips rather than a CSS border-image: every piece lands on a
 * whole multiple of `scale`, so the border stays pixel-exact at any zoom. A
 * stretched border-image would resample the 6px rim and soften the dark outer
 * rule, which is the one line that reads as "wall" at this size. The runs and
 * corners come from lib/house-geometry.mjs, which traces whatever silhouette
 * the built rooms make. Takes no pointer events so the house stays draggable.
 */
function HouseLining({
  lining,
  scale,
}: {
  lining: ReturnType<typeof liningGeometry>;
  scale: number;
}) {
  const url = (piece: string) => `url(${LINING.dir}/${piece}.png)`;
  const base = { position: "absolute" as const, imageRendering: "pixelated" as const };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[60]">
      {lining.runs.map((run, index) => {
        const horizontal = run.side === "top" || run.side === "bottom";
        return (
          <div
            key={`run-${index}`}
            style={{
              ...base,
              left: run.x * scale,
              top: run.y * scale,
              width: run.w * scale,
              height: run.h * scale,
              backgroundImage: url(run.side),
              backgroundRepeat: horizontal ? "repeat-x" : "repeat-y",
              // The strip sprite is 1px along its run, so it repeats seamlessly
              // at any length; only the 6px thickness is fixed.
              backgroundSize: horizontal
                ? `${scale}px ${run.h * scale}px`
                : `${run.w * scale}px ${scale}px`,
            }}
          />
        );
      })}

      {lining.corners.map((corner, index) => (
        <div
          key={`corner-${index}`}
          style={{
            ...base,
            left: corner.x * scale,
            top: corner.y * scale,
            width: LINING.inset * scale,
            height: LINING.inset * scale,
            backgroundImage: url(corner.piece),
            backgroundSize: "100% 100%",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Remove and turn, attached to the selected piece instead of the footer.
 *
 * Sized in fixed CSS pixels rather than scaled with the art, so they stay
 * tappable when the house is zoomed out, and placed above the lining so they
 * are never clipped by a piece sitting against a wall.
 */
function SelectionControls({
  left,
  top,
  width,
  height,
  name,
  canTurn,
  onRotate,
  onRemove,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  name: string;
  canTurn: boolean;
  onRotate: () => void;
  onRemove: () => void;
}) {
  const size = 28;
  const half = size / 2;
  const badge =
    "absolute grid place-items-center rounded-full text-white shadow-[0_2px_6px_rgba(16,40,29,0.6)] transition active:scale-90";

  return (
    <div className="pointer-events-none absolute z-[70]" style={{ left, top, width, height }}>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onRemove}
        className={`${badge} pointer-events-auto bg-clay-500`}
        style={{ width: size, height: size, left: -half, top: -half }}
      >
        <CloseIcon className="h-4 w-4" />
      </button>

      {canTurn && (
        <button
          type="button"
          aria-label={`Turn ${name}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onRotate}
          className={`${badge} pointer-events-auto bg-leaf-300 text-leaf-900`}
          style={{ width: size, height: size, left: width - half, top: height - half }}
        >
          <RotateIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
