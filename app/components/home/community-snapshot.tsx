import { UsersIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { Challenge, CommunitySnapshot } from "@/lib/home-data";

export function CommunitySnapshotSection({
  challenge,
  snapshot,
}: {
  challenge: Challenge;
  snapshot: CommunitySnapshot;
}) {
  const percent = Math.min(
    100,
    Math.round((challenge.current / challenge.target) * 100),
  );

  return (
    <Section title="Community snapshot">
      <div className="rounded-3xl bg-leaf-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-leaf-900">
              {challenge.title}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-leaf-800/70">
              <UsersIcon className="h-3.5 w-3.5" />
              {snapshot.participants.toLocaleString()} neighbours taking part
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="text-2xl font-bold leading-none text-leaf-900">
              {percent}%
            </span>
            <span className="block text-[10px] text-leaf-800/70">
              township goal
            </span>
          </p>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
          <div
            role="progressbar"
            aria-label={`${challenge.title} township progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-full rounded-full bg-leaf-700"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-[11px] text-leaf-800">
          Your share of this challenge:{" "}
          <span className="font-semibold text-leaf-900">
            {snapshot.userContribution}%
          </span>{" "}
          of all verified {challenge.unit}.
        </p>
      </div>
    </Section>
  );
}
