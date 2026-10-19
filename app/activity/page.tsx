import { ActiveChallenges } from "@/app/components/home/active-challenges";
import { CircularActionsSection } from "@/app/components/home/circular-actions";
import { CommunityLeaderboardCard } from "@/app/components/home/community-leaderboard";
import { CommunitySnapshotSection } from "@/app/components/home/community-snapshot";
import { DesktopNotice } from "@/app/components/desktop-notice";
import { GoalsAndStreaks } from "@/app/components/home/goals-streaks";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { MonthlyImpactSection } from "@/app/components/home/monthly-impact";
import { PersonalInsights } from "@/app/components/home/personal-insights";
import {
  challenges,
  circularActions,
  communityLeaderboard,
  communitySnapshot,
  goals,
  insights,
  monthlyImpact,
  resident,
} from "@/lib/home-data";

export default function ActivityPage() {
  const activeChallenges = challenges.slice(0, 2);
  const featuredChallenge =
    challenges.find((item) => item.id === communitySnapshot.challengeId) ??
    challenges[0];

  return (
    <>
      <DesktopNotice />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
        <GreetingHeader resident={resident} title="Activity" showImage={false} />

        <main className="flex flex-col gap-6 pt-3">
          <MonthlyImpactSection impact={monthlyImpact} />
          <CircularActionsSection actions={circularActions} />
          <GoalsAndStreaks goals={goals} />
          <ActiveChallenges challenges={activeChallenges} />
          <CommunitySnapshotSection
            challenge={featuredChallenge}
            snapshot={communitySnapshot}
          />
          <CommunityLeaderboardCard ranking={communityLeaderboard} />
          <PersonalInsights insights={insights.slice(0, 2)} />
        </main>
      </div>
    </>
  );
}