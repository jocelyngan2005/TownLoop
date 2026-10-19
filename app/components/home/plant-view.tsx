"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "@/app/components/icons";
import type { LevelSummary } from "@/lib/home-data";

const growthStages = [
  {
    id: "budding",
    src: "/flower/sunflower-budding.png",
    name: "Budding",
    blurb: "Your sunflower is still a bud. Keep sorting to help it open up.",
  },
  {
    id: "halfbloom",
    src: "/flower/sunflower-halfbloom.png",
    name: "Half bloom",
    blurb: "Halfway there — the first petals have opened.",
  },
  {
    id: "fullbloom",
    src: "/flower/sunflower-fullbloom.png",
    name: "Full bloom",
    blurb: "Your sunflower is in full bloom. Beautiful work this level.",
  },
] as const;

function getGrowth(level: LevelSummary) {
  const span = Math.max(1, level.nextLevelAt - level.levelStartsAt);
  const earnedInLevel = level.lifetimePoints - level.levelStartsAt;
  const percent = Math.max(0, Math.min(100, Math.round((earnedInLevel / span) * 100)));
  const stage =
    percent < 34 ? growthStages[0] : percent < 67 ? growthStages[1] : growthStages[2];

  return { percent, stage };
}

export function PlantView({ level }: { level: LevelSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const { percent, stage } = getGrowth(level);
  const pointsToNextLevel = Math.max(0, level.nextLevelAt - level.lifetimePoints);

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
        aria-controls="townloop-plant-view"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full bg-leaf-800 px-3 py-1 text-xs font-semibold text-leaf-100 shadow-sm transition active:scale-95"
      >
        View plant
      </button>

      {isOpen &&
        createPortal(
          <div
            id="townloop-plant-view"
            role="dialog"
            aria-modal="true"
            aria-label="Your community plant"
            className="fixed inset-0 z-[100] min-h-[100dvh] overflow-hidden bg-leaf-900"
          >
            <Image
              src="/soil-background.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover object-center"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-leaf-50/70 via-transparent to-leaf-900/70" />

            <div className="flex min-h-[100dvh] flex-col">
              <div className="flex items-start justify-between gap-4 px-6 py-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-leaf-800">
                    Your plant
                  </p>
                  <p className="text-2xl font-bold text-leaf-900">{stage.name}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close plant view"
                  onClick={() => setIsOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/70 text-leaf-900 shadow-sm backdrop-blur transition active:scale-95"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="relative flex flex-1 items-center justify-center px-6">
                <Image
                  src={stage.src}
                  alt={`Sunflower at ${stage.name.toLowerCase()} stage`}
                  width={760}
                  height={1160}
                  priority
                  className="h-full max-h-[62dvh] w-auto object-contain drop-shadow-[0_18px_30px_rgba(16,40,29,0.35)]"
                />
              </div>

              <div className="px-6 pb-10">
                <div className="rounded-3xl bg-leaf-900/75 p-5 text-leaf-100 backdrop-blur">
                  <p className="text-sm text-leaf-100/90">{stage.blurb}</p>

                  <div className="mt-4 mb-2 flex items-center justify-between text-xs text-leaf-200/90">
                    <span>
                      {level.lifetimePoints.toLocaleString()} pts · Level {level.level}
                    </span>
                    <span className="font-semibold text-white">
                      {pointsToNextLevel.toLocaleString()} pts to {level.nextLevelName}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      role="progressbar"
                      aria-label="Plant growth"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      className="h-full rounded-full bg-leaf-300 transition-[width] duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
