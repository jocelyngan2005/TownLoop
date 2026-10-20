import { TrophyIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { CommunityLeaderboard } from "@/lib/home-data";

export function CommunityLeaderboardCard({
  ranking,
}: {
  ranking: CommunityLeaderboard;
}) {
  const topPercent = Math.min(
    100,
    Math.ceil((ranking.rank / ranking.communitySize) * 100),
  );

  return (
    <Section title="Community leaderboard">
      <div
        aria-label={`Ranked ${ranking.rank} of ${ranking.communitySize} community members, in the top ${topPercent} percent`}
        className="rounded-3xl bg-orchard-500 p-4 text-white shadow-[0_12px_24px_-18px_rgba(16,40,29,0.7)]"
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
        <p className="mt-4 border-t border-white/25 pt-3 text-xs font-medium">
          You&apos;re in the top {topPercent}% of your community
        </p>
      </div>
    </Section>
  );
}