import { CoinIcon, TicketIcon } from "@/app/components/icons";
import type { RewardsSummary } from "@/lib/rewards-data";

export function PointsBalanceCard({
  points,
  activeVouchers,
  summary,
}: {
  points: number;
  activeVouchers: number;
  summary: RewardsSummary;
}) {
  return (
    <section className="px-5">
      <div className="rounded-3xl bg-leaf-800 p-5 text-leaf-100 shadow-[0_18px_30px_-22px_rgba(16,40,29,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-leaf-300">
              Redeemable balance
            </p>
            <p
              aria-live="polite"
              className="mt-1 text-4xl font-bold text-white tabular-nums"
            >
              {points.toLocaleString()}
              <span className="ml-1 text-sm font-medium text-leaf-300">pts</span>
            </p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-leaf-200">
            <CoinIcon className="h-6 w-6" />
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 px-2 py-2.5">
            <dt className="text-[10px] leading-tight text-leaf-200/80">
              Active vouchers
            </dt>
            <dd className="mt-0.5 text-base font-semibold text-white">
              {activeVouchers}
            </dd>
          </div>
          <div className="rounded-2xl bg-white/10 px-2 py-2.5">
            <dt className="text-[10px] leading-tight text-leaf-200/80">
              Redeemed in 2026
            </dt>
            <dd className="mt-0.5 text-base font-semibold text-white">
              {summary.redeemedThisYear}
            </dd>
          </div>
        </dl>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-sun-300/20 px-3 py-1.5 text-[11px] font-medium text-sun-300">
          <TicketIcon className="h-4 w-4" />
          {summary.pointsExpiringSoon} pts expire on {summary.expiryLabel}
        </p>
      </div>
    </section>
  );
}
