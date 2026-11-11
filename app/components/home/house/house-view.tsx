"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "@/app/components/icons";
import { CatalogDrawer } from "@/app/components/home/house/catalog-drawer";
import { GardenBackdrop } from "@/app/components/home/house/garden-backdrop";
import { RoomCanvas } from "@/app/components/home/house/room-canvas";
import {
  ROOM_H,
  ROOM_W,
  WALL_H,
  snapPlacement,
} from "@/app/components/home/house/room-geometry";
import { useHouseLayout } from "@/app/components/home/house/use-house-layout";
import { decorById } from "@/lib/decor-data";
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
    available,
    acquireAndPlace,
    move,
    remove,
    resetRoom,
  } = useHouseLayout();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const selected = placements.find((placement) => placement.key === selectedKey);
  const selectedItem = selected ? decorById.get(selected.itemId) : undefined;

  const placeFromCatalog = useCallback(
    (itemId: string) => {
      const item = decorById.get(itemId);
      if (!item) return;
      // Drop it in the middle of its own layer; the resident drags from there.
      const centreY = item.layer === "wall" ? WALL_H / 2 : (WALL_H + ROOM_H) / 2;
      const { tx, ty } = snapPlacement(item, (ROOM_W - item.w) / 2, centreY - item.h / 2);
      if (acquireAndPlace(itemId, tx, ty)) setCatalogOpen(false);
    },
    [acquireAndPlace],
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
        <div>
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

      <div className="relative flex flex-1 flex-col justify-center px-4">
        <RoomCanvas
          placements={placements}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onMove={move}
        />

        <p className="mx-auto mt-3 max-w-xs text-center text-[11px] leading-snug text-white/90 [text-shadow:0_1px_3px_rgba(16,40,29,0.9)]">
          {selectedItem
            ? `${selectedItem.name} selected — drag it, nudge it with the arrow keys, or remove it.`
            : "Drag anything to rearrange it. Recycle more to exchange for new pieces."}
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

          {selected ? (
            <button
              type="button"
              onClick={() => {
                remove(selected.key);
                setSelectedKey(null);
              }}
              className="rounded-full bg-clay-500 px-4 py-3 text-sm font-semibold text-white transition active:scale-95"
            >
              Remove
            </button>
          ) : (
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
          )}
        </div>
      </div>

      {/* Sibling of the layout column so it anchors to the dialog, not the footer. */}
      <CatalogDrawer
        open={catalogOpen}
        available={available}
        ownedOrStarter={ownedOrStarter}
        onPlace={placeFromCatalog}
        onClose={() => setCatalogOpen(false)}
      />
    </div>
  );
}
