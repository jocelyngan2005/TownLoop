import type { ReactNode } from "react";

import { DesktopNotice } from "@/app/components/desktop-notice";

export default function MobileAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DesktopNotice />
      {children}
    </>
  );
}
