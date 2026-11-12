"use client";

import {
  CostBreakdown,
  FactPanel,
  MaterialWallet,
} from "@/app/components/home/house/material-chips";
import { canAfford, describeCost, type MaterialTally } from "@/lib/decor-data";
import { TILE } from "@/lib/decor-data";
import type { RoomDef } from "@/lib/house-plan";

/**
 * The sheet for building a room, deliberately the same shape as the furniture
 * detail view in catalog-drawer.tsx: a room is another thing you exchange
 * recyclables for, so it should not feel like a different transaction.
 */
export function RoomUnlockSheet({
  room,
  available,
  onBuild,
  onClose,
}: {
  room: RoomDef | null;
  available: MaterialTally;
  onBuild: (roomId: string) => void;
  onClose: () => void;
}) {
  if (!room) return null;

  const affordable = canAfford(room.cost, available);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[80%] flex-col rounded-t-3xl bg-leaf-900/97 text-leaf-100 shadow-[0_-18px_40px_-20px_rgba(0,0,0,0.85)] backdrop-blur">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <p className="text-sm font-semibold text-white">Build a room</p>
          <p className="text-xs text-leaf-200/90">
            Exchange what you recycled for more space to fill
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-leaf-100 transition active:scale-95"
        >
          Close
        </button>
      </div>

      <MaterialWallet available={available} />

      <div className="mt-1 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        <div className="flex items-center gap-4">
          {/* A scale plan of the room rather than a sprite — what is being
              bought is floor area, so show its shape and size. */}
          <span className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-black/25">
            <span
              aria-hidden
              className="rounded-sm border-2 border-dashed border-leaf-300/70 bg-leaf-300/10"
              style={{
                width: Math.round((room.cols / 24) * 88),
                height: Math.round((room.rows / 17) * 88),
              }}
            />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{room.name}</h3>
            <p className="mt-1 text-xs text-leaf-200/90">Needs {describeCost(room.cost)}</p>
            <p className="mt-1 text-[11px] text-leaf-300">
              {room.cols} x {room.rows} tiles · {room.cols * TILE}x{room.rows * TILE}px of floor
            </p>
          </div>
        </div>

        <CostBreakdown cost={room.cost} available={available} />

        <FactPanel fact={room.fact} />

        <div className="mt-5">
          <button
            type="button"
            disabled={!affordable}
            onClick={() => onBuild(room.id)}
            className="w-full rounded-full bg-leaf-300 px-4 py-3 text-sm font-semibold text-leaf-900 transition enabled:active:scale-95 disabled:bg-white/10 disabled:text-leaf-200/60"
          >
            {affordable ? "Build this room" : "Not enough materials yet"}
          </button>
          {!affordable && (
            <p className="mt-2 text-center text-[11px] text-leaf-200/70">
              Keep recycling to collect what this needs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
