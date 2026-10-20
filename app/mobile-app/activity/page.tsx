import { ActiveChallenges } from "@/app/components/home/active-challenges";
import { CircularActionsSection } from "@/app/components/home/circular-actions";
import { CommunityLeaderboardCard } from "@/app/components/home/community-leaderboard";
import { GoalsAndStreaks } from "@/app/components/home/goals-streaks";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { MonthlyImpactSection } from "@/app/components/home/monthly-impact";
import { PersonalInsights } from "@/app/components/home/personal-insights";
import {
  challenges,
  circularActions,
  communityLeaderboard,
  goals,
  insights,
  monthlyImpact,
  resident,
} from "@/lib/home-data";

export default function ActivityPage() {
  const activeChallenges = challenges.slice(0, 2);

  return (
    <div className="motion-shell mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
      <GreetingHeader resident={resident} title="Activity" showImage={false} />

      <main className="flex flex-col gap-6 pt-3">
        <CommunityLeaderboardCard ranking={communityLeaderboard} />
        <MonthlyImpactSection impact={monthlyImpact} />
        <CircularActionsSection actions={circularActions} />
        <GoalsAndStreaks goals={goals} />
        <ActiveChallenges challenges={activeChallenges} />
        <PersonalInsights insights={insights.slice(0, 2)} />
      </main>
    </div>
  );
}