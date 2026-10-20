import { AccountDetails } from "@/app/components/profile/account-details";
import { AccountLinks } from "@/app/components/profile/account-links";
import { Preferences } from "@/app/components/profile/preferences";
import { ProfileIdentity } from "@/app/components/profile/profile-identity";
import { DesktopNotice } from "@/app/components/desktop-notice";
import { GoalsAndStreaks } from "@/app/components/home/goals-streaks";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { LevelPointsCard } from "@/app/components/home/level-points-card";
import { goals, levelSummary, resident } from "@/lib/home-data";
import {
  accountLinks,
  preferenceSettings,
  profileDetails,
  profileStats,
} from "@/lib/profile-data";

export default function ProfilePage() {
  return (
    <>
      <DesktopNotice />

      <div className="motion-shell mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
        <GreetingHeader resident={resident} title="Profile" showImage={false} />

        <main className="flex flex-col gap-6 pt-3">
          <ProfileIdentity
            details={profileDetails}
            level={levelSummary}
            stats={profileStats}
          />
          <LevelPointsCard level={levelSummary} />
          <GoalsAndStreaks goals={goals} />
          <AccountDetails details={profileDetails} />
          <Preferences settings={preferenceSettings} />
          <AccountLinks links={accountLinks} />
        </main>
      </div>
    </>
  );
}
