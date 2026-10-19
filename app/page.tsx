import { DesktopNotice } from "@/app/components/desktop-notice";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { LevelPointsCard } from "@/app/components/home/level-points-card";
import { QuickActions } from "@/app/components/home/quick-actions";
import { RewardsHighlights } from "@/app/components/home/rewards-highlights";
import { TakeBackHighlights } from "@/app/components/home/take-back-highlights";
import { levelSummary, quickActions, resident } from "@/lib/home-data";
import { rewards } from "@/lib/rewards-data";
import { takeBackCategories } from "@/lib/take-back-data";

export default function Home() {
  return (
    <>
      <DesktopNotice />

      <div id="home" className="mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
        <GreetingHeader resident={resident} level={levelSummary} />

        <main className="flex flex-col gap-6 pt-6">
          <LevelPointsCard level={levelSummary} />
          <QuickActions actions={quickActions} />
          <TakeBackHighlights categories={takeBackCategories} />
          <RewardsHighlights rewards={rewards} />
        </main>
      </div>
    </>
  );
}
