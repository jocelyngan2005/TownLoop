import { ArrowRightIcon, ClockIcon } from "@/app/components/icons";
import { Card, ProgressBar, Section } from "@/app/components/home/ui";
import type { Challenge } from "@/lib/home-data";

export function ActiveChallenges({ challenges }: { challenges: Challenge[] }) {
  return (
    <Section
      title="Active challenges"
      action={
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-leaf-600"
        >
          See all
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      }
    >
      <Card className="py-1">
        <ul className="divide-y divide-leaf-200">
          {challenges.map((challenge) => {
            const percent = Math.min(
              100,
              Math.round((challenge.current / challenge.target) * 100),
            );

            return (
              <li key={challenge.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-leaf-900">
                      {challenge.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-leaf-700/70">
                      {challenge.description}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-leaf-50 px-2 py-1 text-[10px] font-medium text-leaf-700">
                    <ClockIcon className="h-3 w-3" />
                    {challenge.daysLeft}d left
                  </span>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    value={challenge.current}
                    max={challenge.target}
                    label={`${challenge.title} progress`}
                    barClassName="bg-leaf-400"
                  />
                  <p className="mt-1.5 text-[11px] text-leaf-700/80">
                    {challenge.current.toLocaleString()} of{" "}
                    {challenge.target.toLocaleString()} {challenge.unit} ·{" "}
                    <span className="font-semibold text-leaf-900">{percent}%</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </Section>
  );
}
