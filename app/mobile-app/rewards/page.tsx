import { GreetingHeader } from "@/app/components/home/greeting-header";
import { RewardsScreen } from "@/app/components/rewards/rewards-screen";
import { TownshipRewards } from "@/app/components/rewards/township-rewards";
import { communityLeaderboard, resident } from "@/lib/home-data";
import { leaderboardSeason, townshipRewards } from "@/lib/leaderboard-data";
import { rewards, rewardsSummary } from "@/lib/rewards-data";

export default function RewardsPage() {
  return (
    <div className="motion-shell mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
      <GreetingHeader resident={resident} title="Rewards" showImage={false} />

      <RewardsScreen
        rewards={rewards}
        summary={rewardsSummary}
        townshipPanel={
          <TownshipRewards
            rewards={townshipRewards}
            season={leaderboardSeason}
            userRank={communityLeaderboard.rank}
          />
        }
      />
    </div>
  );
}
