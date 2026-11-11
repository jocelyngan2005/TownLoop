import { ChevronRightIcon, TrophyIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { CommunityLeaderboard } from "@/lib/home-data";
import type {
  LeaderboardEntry,
  LeaderboardSeason,
} from "@/lib/leaderboard-data";

const medalClasses: Record<number, string> = {
  1: "bg-sun-400 text-leaf-900",
  2: "bg-white text-leaf-900",
  3: "bg-sun-300/70 text-leaf-900",
};

export function CommunityLeaderboardCard({
  ranking,
  entries,
  season,
}: {
  ranking: CommunityLeaderboard;
  entries: LeaderboardEntry[];
  season: LeaderboardSeason;
}) {
  const topPercent = Math.min(
    100,
    Math.ceil((ranking.rank / ranking.communitySize) * 100),
  );
  const eligible = ranking.rank <= season.eligibleRankCutoff;
  const cutoffEntry = entries.find(
    (entry) => entry.rank === season.eligibleRankCutoff,
  );
  // Only meaningful while ineligible: how far behind the last qualifying resident.
  const pointsToCutoff = cutoffEntry
    ? Math.max(0, cutoffEntry.seasonPoints - ranking.seasonPoints)
    : 0;

  return (
    <Section title="Community leaderboard">
      <div
        aria-label={`Ranked ${ranking.rank} of ${ranking.communitySize} community members, in the top ${topPercent} percent`}
        className="rounded-3xl bg-orchard-500 p-4 text-white shadow-[0_8px_24px_-16px_rgba(16,40,29,0.45)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrophyIcon className="h-7 w-7 shrink-0 text-sun-300" />
            <div>
              <p className="text-xs font-medium text-white/80">
                Your neighbourhood rank
              </p>
              <p className="mt-0.5 text-3xl font-bold leading-none">
                #{ranking.rank}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">
              of {ranking.communitySize.toLocaleString()}
            </p>
            <p className="text-[11px] text-white/80">community members</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/25 pt-3">
          <p className="text-xs font-medium">
            You&apos;re in the top {topPercent}% of your community
          </p>
          <p className="mt-1.5 text-[11px] text-white/80">
            {season.label} season · closes {season.endsOn} · {season.daysLeft}{" "}
            days left
          </p>
          <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
            {eligible
              ? `Top ${season.eligibleRankCutoff} — township reward unlocked`
              : pointsToCutoff > 0
                ? `${pointsToCutoff.toLocaleString()} pts to reach the top ${season.eligibleRankCutoff}`
                : `Reach the top ${season.eligibleRankCutoff} to unlock township rewards`}
          </p>
        </div>

        <details className="group mt-3 border-t border-white/25 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl text-xs font-semibold text-white">
            <span>
              Top {entries.length} this season
              <span className="ml-1.5 font-medium text-white/75">
                · you&apos;re #{ranking.rank}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-white/80">
              <span className="group-open:hidden">Show</span>
              <span className="hidden group-open:inline">Hide</span>
              <ChevronRightIcon className="h-4 w-4 transition-transform duration-200 group-open:rotate-90" />
            </span>
          </summary>

          <ol className="mt-3 overflow-hidden rounded-2xl bg-white/10">
            {entries.map((entry) => (
              <li
                key={entry.id}
                aria-current={entry.isCurrentUser ? "true" : undefined}
                className={`flex items-center gap-2.5 border-b border-white/15 px-2.5 py-2 last:border-b-0 ${
                  entry.isCurrentUser ? "bg-white/20" : ""
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    medalClasses[entry.rank] ?? "bg-white/20 text-white"
                  }`}
                >
                  {entry.rank}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs ${
                      entry.isCurrentUser ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {entry.name}
                  </p>
                  <p className="truncate text-[10px] text-white/70">
                    {entry.block} · {entry.verifiedKg} kg verified
                  </p>
                </div>

                <p className="shrink-0 text-right text-xs font-semibold">
                  {entry.seasonPoints.toLocaleString()}
                  <span className="ml-1 text-[10px] font-medium text-white/70">
                    pts
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </Section>
  );
}
