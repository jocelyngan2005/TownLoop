import { CommunitySnapshotSection } from "@/app/components/home/community-snapshot";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { LevelPointsCard } from "@/app/components/home/level-points-card";
import { QuickActions } from "@/app/components/home/quick-actions";
import { RewardsHighlights } from "@/app/components/home/rewards-highlights";
import { TakeBackHighlights } from "@/app/components/home/take-back-highlights";
import {
  challenges,
  communitySnapshot,
  levelSummary,
  quickActions,
  resident,
} from "@/lib/home-data";
import { rewards } from "@/lib/rewards-data";
import { takeBackCategories } from "@/lib/take-back-data";

export default function Home() {
  const featuredChallenge =
    challenges.find((item) => item.id === communitySnapshot.challengeId) ??
    challenges[0];

  return (
    <div id="home" className="motion-shell mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
      <GreetingHeader resident={resident} level={levelSummary} />

      <main className="flex flex-col gap-6 pt-6">
        <LevelPointsCard level={levelSummary} />
        <QuickActions actions={quickActions} />
        <CommunitySnapshotSection
          challenge={featuredChallenge}
          snapshot={communitySnapshot}
        />
        <TakeBackHighlights categories={takeBackCategories} />
        <RewardsHighlights rewards={rewards} />
      </main>
    </div>
  );
}
