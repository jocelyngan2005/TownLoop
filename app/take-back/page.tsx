import { DesktopNotice } from "@/app/components/desktop-notice";
import { GreetingHeader } from "@/app/components/home/greeting-header";
import { TakeBackCampaigns } from "@/app/components/take-back/take-back-campaigns";
import { resident } from "@/lib/home-data";
import { takeBackCategories } from "@/lib/take-back-data";

export default function TakeBackPage() {
  return (
    <>
      <DesktopNotice />

      <div className="motion-shell mx-auto flex w-full max-w-md flex-1 flex-col bg-background pb-12 md:hidden">
        <GreetingHeader resident={resident} title="Take-back" showImage={false} />

        <TakeBackCampaigns categories={takeBackCategories} />
      </div>
    </>
  );
}
