import { FlameIcon, TrophyIcon } from "@/app/components/icons";
import { Card, Section } from "@/app/components/home/ui";
import type { Goals } from "@/lib/home-data";

export function GoalsAndStreaks({ goals }: { goals: Goals }) {
  const earnedCount = goals.badges.filter((badge) => badge.earned).length;
  const calendarDays = Array.from({ length: 28 }, (_, index) => ({
    day: index + 1,
    active: index >= 28 - goals.sortingStreakDays,
  }));

  return (
    <Section title="Streaks & badges">
      <Card className="space-y-5">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-leaf-900">
              <FlameIcon className="h-5 w-5 text-clay-500" />
              Daily sorting streak
            </p>
            <p className="text-right text-xs text-leaf-700/75">
              <span className="text-lg font-bold text-leaf-900">
                {goals.sortingStreakDays}
              </span>{" "}
              days <span className="ml-1">· best {goals.bestStreakDays}</span>
            </p>
          </div>

          <p className="mb-2 text-[10px] font-medium uppercase text-leaf-700/60">
            Last 28 days
          </p>
          <div
            role="img"
            aria-label={`${goals.sortingStreakDays}-day current sorting streak shown over the last 28 days`}
            className="grid w-fit grid-cols-7 gap-1.5"
          >
            {calendarDays.map(({ day, active }) => (
              <span
                key={day}
                title={active ? "Sorting streak day" : "No sorting activity"}
                className={`h-5 w-5 rounded-md ${
                  active ? "bg-leaf-500" : "bg-leaf-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-leaf-900">
              <TrophyIcon className="h-4 w-4 text-sun-400" />
              Badges
            </p>
            <p className="text-[11px] text-leaf-700/70">
              {earnedCount} of {goals.badges.length} earned
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {goals.badges.map((badge) => (
              <li key={badge.id} title={badge.description}>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${
                    badge.earned
                      ? "bg-sun-300/40 text-leaf-900"
                      : "bg-leaf-50 text-leaf-700/55"
                  }`}
                >
                  <TrophyIcon className="h-3.5 w-3.5" />
                  {badge.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </Section>
  );
}
