import { SparkIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { Insight } from "@/lib/home-data";

export function PersonalInsights({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <Section title="Insights for you">
      <div className="rounded-3xl bg-sun-300 p-4">
        <SparkIcon className="h-5 w-5 text-leaf-900" />
        <ul className="mt-2 divide-y divide-leaf-900/15">
          {insights.map((insight) => (
            <li key={insight.id} className="py-3 first:pt-2 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-leaf-900">
                  {insight.headline}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-leaf-700/80">
                  {insight.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
