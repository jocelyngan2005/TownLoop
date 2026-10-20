import { DesktopNotice } from "@/app/components/desktop-notice";
import { DropOffScreen } from "@/app/components/drop-off/drop-off-screen";

export default function DropOffPage() {
  return (
    <>
      <DesktopNotice />

      <div className="mx-auto w-full max-w-md flex-1 bg-background md:hidden">
        <DropOffScreen />
      </div>
    </>
  );
}
