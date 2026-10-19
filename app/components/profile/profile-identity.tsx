import { Card, Section } from "@/app/components/home/ui";
import type { ProfileDetails, ProfileStat } from "@/lib/profile-data";
import type { LevelSummary } from "@/lib/home-data";

export function ProfileIdentity({
  details,
  level,
  stats,
}: {
  details: ProfileDetails;
  level: LevelSummary;
  stats: ProfileStat[];
}) {
  return (
    <Section title="Your account">
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-leaf-800 text-xl font-semibold text-leaf-100">
            {details.initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-leaf-900">
              {details.fullName}
            </h3>
            <p className="truncate text-xs text-leaf-700/75">{details.address}</p>
            <span className="mt-2 inline-block rounded-full bg-leaf-100 px-3 py-1 text-[11px] font-semibold text-leaf-800">
              Level {level.level} · {level.levelName}
            </span>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <li key={stat.id} className="rounded-2xl bg-leaf-50 px-3 py-2.5">
              <p className="text-lg font-semibold leading-tight text-leaf-900">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-leaf-700/80">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="w-full rounded-full border border-leaf-200 py-2.5 text-xs font-semibold text-leaf-800 transition active:scale-[0.98]"
        >
          Edit profile
        </button>
      </Card>
    </Section>
  );
}
