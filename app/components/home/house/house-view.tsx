"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "@/app/components/icons";
import { CatalogDrawer } from "@/app/components/home/house/catalog-drawer";
import { GardenBackdrop } from "@/app/components/home/house/garden-backdrop";
import { RoomCanvas } from "@/app/components/home/house/room-canvas";
import { RoomUnlockSheet } from "@/app/components/home/house/room-unlock-sheet";
import { clampTile } from "@/app/components/home/house/room-geometry";
import { useHouseLayout } from "@/app/components/home/house/use-house-layout";
import { decorById, TILE, variantOf } from "@/lib/decor-data";
import { lockedRooms as lockedRoomsFor, roomById } from "@/lib/house-plan";
import type { LevelSummary } from "@/lib/home-data";

export function HouseView({ level }: { level: LevelSummary }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="townloop-house-view"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full bg-leaf-800 px-3 py-1 text-xs font-semibold text-leaf-100 shadow-sm transition active:scale-95"
      >
        My home
      </button>

      {isOpen &&
        createPortal(
          <HouseDialog level={level} onClose={() => setIsOpen(false)} />,
          document.body,
        )}
    </>
  );
}

function HouseDialog({
  level,
  onClose,
}: {
  level: LevelSummary;
  onClose: () => void;
}) {
  const {
    placements,
    ownedOrStarter,
    builtRooms,
    available,
    acquireAndPlace,
    unlockRoom,
    move,
    rotate,
    remove,
    resetRoom,
  } = useHouseLayout();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [roomSheetId, setRoomSheetId] = useState<string | null>(null);

  const selected = placements.find((placement) => placement.key === selectedKey);
  const selectedItem = selected ? decorById.get(selected.itemId) : undefined;
  const builtIds = builtRooms.map((room) => room.id);
  const locked = lockedRoomsFor(builtIds);
  const roomSheet = roomSheetId ? (roomById.get(roomSheetId) ?? null) : null;

  const placeFromCatalog = useCallback(
    (itemId: string) => {
      const item = decorById.get(itemId);
      if (!item) return;
      // Sized from the view it will be placed in, which is always the first.
      const view = variantOf(item, 0);
      // Drop it into the middle of the biggest room the resident has, on its
      // own layer — somewhere they can see it, and drag from there.
      const room = builtRooms.reduce((best, candidate) =>
        candidate.cols * candidate.rows > best.cols * best.rows ? candidate : best,
      );
      const roomH = room.rows * TILE;
      const wallH = room.wallRows * TILE;
      const centreY = item.layer === "wall" ? wallH / 2 : (wallH + roomH) / 2;
      const { tx, ty } = clampTile(
        { ...view, layer: item.layer },
        room,
        (room.tx * TILE + (room.cols * TILE - view.w) / 2) / TILE,
        (room.ty * TILE + centreY - view.h / 2) / TILE,
      );
      if (acquireAndPlace(itemId, tx, ty)) setCatalogOpen(false);
    },
    [acquireAndPlace, builtRooms],
  );

  const buildRoom = useCallback(
    (roomId: string) => {
      if (unlockRoom(roomId)) setRoomSheetId(null);
    },
    [unlockRoom],
  );

  return (
    <div
      id="townloop-house-view"
      role="dialog"
      aria-modal="true"
      aria-label="Your pixel home"
      className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-hidden bg-leaf-900"
    >
      <GardenBackdrop />

      <div className="relative flex items-start justify-between gap-4 px-6 py-5">
        {/* The garden is bright enough that white text on it falls to about
            2:1 contrast, so the heading carries its own backing rather than
            darkening the whole garden behind it. */}
        <div className="rounded-2xl bg-leaf-900/70 px-3 py-2 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-leaf-300">
            Your home
          </p>
          <p className="text-2xl font-bold text-white">
            Level {level.level} · {level.levelName}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close home view"
          onClick={onClose}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-900/60 text-white shadow-sm backdrop-blur transition active:scale-95"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center px-4">
        <RoomCanvas
          rooms={builtRooms}
          lockedRooms={locked}
          placements={placements}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onSelectRoom={setRoomSheetId}
          onMove={move}
          onRotate={rotate}
          onRemove={remove}
        />

        <p className="mx-auto mt-3 max-w-xs shrink-0 rounded-full bg-leaf-900/65 px-3 py-1.5 text-center text-[11px] leading-snug text-white/95 backdrop-blur-sm">
          {selectedItem
            ? `${selectedItem.name} selected — drag it, nudge it with the arrow keys, or use the buttons on it.`
            : "Drag anything to rearrange it. Tap a dashed room to build it."}
        </p>
      </div>

      <div className="relative px-5 pb-8 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className="flex-1 rounded-full bg-leaf-300 px-4 py-3 text-sm font-semibold text-leaf-900 transition active:scale-95"
          >
            Materials workshop
          </button>

          {/* Turn and Remove live on the selected piece itself now, so the
              footer keeps one pair of actions whatever is selected. */}
          <button
            type="button"
            onClick={() => {
              resetRoom();
              setSelectedKey(null);
            }}
            className="rounded-full bg-leaf-900/70 px-4 py-3 text-sm font-semibold text-leaf-100 backdrop-blur transition active:scale-95"
          >
            Tidy up
          </button>
        </div>
      </div>

      {/* Siblings of the layout column so they anchor to the dialog, not the
          footer. Only one can be open: tapping a room closes the workshop. */}
      <CatalogDrawer
        open={catalogOpen && !roomSheet}
        available={available}
        ownedOrStarter={ownedOrStarter}
        onPlace={placeFromCatalog}
        onClose={() => setCatalogOpen(false)}
      />

      <RoomUnlockSheet
        room={roomSheet}
        available={available}
        onBuild={buildRoom}
        onClose={() => setRoomSheetId(null)}
      />
    </div>
  );
}
