import { CoinIcon } from "@/app/components/icons";
import type { Reward } from "@/lib/rewards-data";

export function RewardCard({
  reward,
  points,
  onRedeem,
}: {
  reward: Reward;
  points: number;
  onRedeem: (reward: Reward) => void;
}) {
  const affordable = points >= reward.costPoints;
  const missingPoints = reward.costPoints - points;

  return (
    <li className="motion-card py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-orchard-500">
            {reward.partner}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-leaf-900">
            {reward.title}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-leaf-700/75">
            {reward.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-leaf-200 px-3 py-1.5 text-sm font-semibold text-leaf-900">
            <CoinIcon className="h-4 w-4 text-sun-400" />
            {reward.costPoints.toLocaleString()} pts
          </p>
          <p className="text-[10px] text-leaf-700/65">
            {reward.stock} left · valid {reward.validityDays} days
          </p>
        </div>

        <button
          type="button"
          disabled={!affordable}
          onClick={() => onRedeem(reward)}
          className="rounded-full bg-orchard-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orchard-600 active:scale-95 disabled:bg-leaf-100 disabled:text-leaf-700/55"
        >
          {affordable ? "Redeem" : `${missingPoints.toLocaleString()} pts short`}
        </button>
      </div>
    </li>
  );
}
