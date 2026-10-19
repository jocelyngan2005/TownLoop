import {
  BoxReturnIcon,
  GiftIcon,
  PinIcon,
  QrCodeIcon,
  ScanIcon,
} from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { QuickAction } from "@/lib/home-data";

const iconFor = {
  scan: ScanIcon,
  "qr-scan": QrCodeIcon,
  "drop-off": PinIcon,
  rewards: GiftIcon,
  "take-back": BoxReturnIcon,
} as const;

const tileClassName =
  "flex h-full w-full flex-col gap-2 rounded-2xl bg-white p-3.5 text-left ring-1 ring-leaf-100 transition active:scale-[0.98]";

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <Section title="Quick actions">
      <ul className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = iconFor[action.id];
          const content = (
            <>
              <Icon className="h-6 w-6 text-orchard-500" />
              <span className="text-sm font-semibold text-leaf-900">
                {action.label}
              </span>
              <span className="text-[11px] text-leaf-700/70">{action.hint}</span>
            </>
          );

          return (
            <li key={action.id}>
              {action.href ? (
                <a href={action.href} className={tileClassName}>
                  {content}
                </a>
              ) : (
                <button type="button" className={tileClassName}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
