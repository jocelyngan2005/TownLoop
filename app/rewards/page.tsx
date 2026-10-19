import { DesktopNotice } from "@/app/components/desktop-notice";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { RewardsScreen } from "@/app/components/rewards/rewards-screen";
import { levelSummary, resident } from "@/lib/home-data";
import { rewards, rewardsSummary, vouchers } from "@/lib/rewards-data";

export default function RewardsPage() {
  return (
    <>
      <DesktopNotice />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
        <GreetingHeader resident={resident} title="Rewards" showImage={false} />

        <RewardsScreen
          initialPoints={levelSummary.redeemablePoints}
          rewards={rewards}
          initialVouchers={vouchers}
          summary={rewardsSummary}
        />
      </div>
    </>
  );
}
