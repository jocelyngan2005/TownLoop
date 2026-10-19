import { ChevronRightIcon, LogoutIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { AccountLink } from "@/lib/profile-data";

export function AccountLinks({ links }: { links: AccountLink[] }) {
  return (
    <Section title="Manage">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_-16px_rgba(16,40,29,0.45)] ring-1 ring-leaf-100">
        <ul className="divide-y divide-leaf-100">
          {links.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition active:bg-leaf-50"
              >
                <span>
                  <span className="block text-sm font-medium text-leaf-900">
                    {link.label}
                  </span>
                  <span className="block text-[11px] text-leaf-700/70">
                    {link.hint}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-leaf-700/60" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-clay-500/40 py-3 text-sm font-semibold text-clay-600 transition active:scale-[0.98]"
      >
        <LogoutIcon className="h-4 w-4" />
        Sign out
      </button>
    </Section>
  );
}
