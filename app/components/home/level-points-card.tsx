"use client";

import type { LevelSummary } from "@/lib/home-data";
import { usePoints } from "@/lib/points-store";

export function LevelPointsCard({ level }: { level: LevelSummary }) {
  // Live values from the store; `level` still supplies the tier names and
  // thresholds, which are static.
  const { balance, lifetimePoints } = usePoints();

  const span = level.nextLevelAt - level.levelStartsAt;
  const earnedInLevel = lifetimePoints - level.levelStartsAt;
  const percent = Math.max(
    0,
    Math.min(100, Math.round((earnedInLevel / span) * 100)),
  );
  const pointsToNextLevel = Math.max(0, level.nextLevelAt - lifetimePoints);

  return (
    <section className="px-5">
      <div className="rounded-3xl bg-leaf-800 p-5 text-leaf-100 shadow-[0_18px_30px_-22px_rgba(16,40,29,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-leaf-300">
              Level {level.level}
            </p>
            <p className="text-xl font-semibold text-white">{level.levelName}</p>
            <p aria-live="polite" className="mt-3 text-3xl font-bold text-white tabular-nums">
              {balance.toLocaleString()}
              <span className="ml-1 text-sm font-medium text-leaf-300">pts</span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-leaf-200/90">
            <span>Progress to {level.nextLevelName}</span>
            <span className="font-semibold text-white">
              {pointsToNextLevel.toLocaleString()} pts to go
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              role="progressbar"
              aria-label={`Progress to ${level.nextLevelName}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-full rounded-full bg-leaf-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
