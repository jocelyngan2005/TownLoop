import { ArrowRightIcon, CoinIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { Reward } from "@/lib/rewards-data";

export function RewardsHighlights({ rewards }: { rewards: Reward[] }) {
  const featured = rewards.slice(0, 6);

  return (
    <Section
      title="Rewards"
      action={
        <a
          href="/rewards"
          className="inline-flex items-center gap-1 text-xs font-medium text-leaf-600"
        >
          See all
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </a>
      }
    >
      <ul
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {featured.map((reward) => (
          <li
            key={reward.id}
            className="w-44 shrink-0 snap-start rounded-2xl bg-white p-3.5 ring-1 ring-inset ring-leaf-100"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-orchard-500">
              {reward.partner}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-leaf-900">
              {reward.title}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-leaf-200 px-2.5 py-1 text-[11px] font-semibold text-leaf-900">
              <CoinIcon className="h-3.5 w-3.5 text-sun-400" />
              {reward.costPoints.toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
