"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CheckIcon, CloseIcon, CoinIcon } from "@/app/components/icons";
import { PointsBalanceCard } from "@/app/components/rewards/points-balance";
import { RewardCard } from "@/app/components/rewards/reward-card";
import { VoucherCard } from "@/app/components/rewards/voucher-card";
import {
  rewardCategories,
  type Reward,
  type RewardCategory,
  type RewardsSummary,
  type Voucher,
} from "@/lib/rewards-data";

function createVoucherCode(partner: string) {
  const prefix = partner.replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function formatExpiry(validityDays: number) {
  const date = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RewardsScreen({
  initialPoints,
  rewards,
  initialVouchers,
  summary,
}: {
  initialPoints: number;
  rewards: Reward[];
  initialVouchers: Voucher[];
  summary: RewardsSummary;
}) {
  const [points, setPoints] = useState(initialPoints);
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [tab, setTab] = useState<"catalog" | "vouchers">("catalog");
  const [category, setCategory] = useState<RewardCategory | "all">("all");
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [newVoucherId, setNewVoucherId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingReward) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPendingReward(null);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pendingReward]);

  const visibleRewards =
    category === "all"
      ? rewards
      : rewards.filter((reward) => reward.category === category);
  const activeVouchers = vouchers.filter(
    (voucher) => voucher.status === "active",
  ).length;

  function confirmRedeem(reward: Reward) {
    if (points < reward.costPoints) return;

    const voucher: Voucher = {
      id: `${reward.id}-${Date.now()}`,
      partner: reward.partner,
      title: reward.title,
      value: reward.value,
      code: createVoucherCode(reward.partner),
      status: "active",
      expiresOn: formatExpiry(reward.validityDays),
    };

    setPoints((current) => current - reward.costPoints);
    setVouchers((current) => [voucher, ...current]);
    setNewVoucherId(voucher.id);
    setPendingReward(null);
    setTab("vouchers");
  }

  return (
    <main className="flex flex-col gap-6 pt-3">
      <PointsBalanceCard
        points={points}
        activeVouchers={activeVouchers}
        summary={summary}
      />

      <div className="px-5">
        <div
          role="tablist"
          aria-label="Rewards sections"
          className="grid grid-cols-2 gap-1 rounded-full bg-leaf-50 p-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-catalog"
            aria-selected={tab === "catalog"}
            aria-controls="panel-catalog"
            onClick={() => setTab("catalog")}
            className={`rounded-full py-2 text-xs font-semibold transition ${
              tab === "catalog"
                ? "bg-white text-leaf-900 shadow-sm"
                : "text-leaf-700/70"
            }`}
          >
            Reward catalog
          </button>
          <button
            type="button"
            role="tab"
            id="tab-vouchers"
            aria-selected={tab === "vouchers"}
            aria-controls="panel-vouchers"
            onClick={() => setTab("vouchers")}
            className={`rounded-full py-2 text-xs font-semibold transition ${
              tab === "vouchers"
                ? "bg-white text-leaf-900 shadow-sm"
                : "text-leaf-700/70"
            }`}
          >
            My vouchers ({activeVouchers})
          </button>
        </div>
      </div>

      {tab === "catalog" ? (
        <section
          id="panel-catalog"
          role="tabpanel"
          aria-labelledby="tab-catalog"
          className="flex flex-col gap-4"
        >
          <div className="overflow-x-auto px-5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max gap-2">
              {[{ id: "all" as const, label: "All" }, ...rewardCategories].map(
                (item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={category === item.id}
                      onClick={() => setCategory(item.id)}
                      className={`rounded-full px-3.5 py-2 text-xs font-medium transition ${
                        category === item.id
                          ? "bg-leaf-800 text-white"
                          : "bg-white text-leaf-700 ring-1 ring-leaf-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>

          <ul className="divide-y divide-leaf-200 px-5">
            {visibleRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                points={points}
                onRedeem={setPendingReward}
              />
            ))}
          </ul>

          
        </section>
      ) : (
        <section
          id="panel-vouchers"
          role="tabpanel"
          aria-labelledby="tab-vouchers"
          className="px-5"
        >
          {newVoucherId && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-leaf-100 px-3 py-2 text-xs font-medium text-leaf-800">
              <CheckIcon className="h-4 w-4 text-leaf-600" />
              Voucher added. Show the code at the counter.
            </p>
          )}

          <ul className="divide-y divide-leaf-200">
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                highlighted={voucher.id === newVoucherId}
              />
            ))}
          </ul>
        </section>
      )}

      {pendingReward &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <button
              type="button"
              aria-label="Cancel redemption"
              onClick={() => setPendingReward(null)}
              className="absolute inset-0 bg-leaf-900/50"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="redeem-dialog-title"
              className="relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-[0_-10px_40px_-20px_rgba(16,40,29,0.8)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-orchard-500">
                    {pendingReward.partner}
                  </p>
                  <h2
                    id="redeem-dialog-title"
                    className="mt-0.5 text-lg font-semibold text-leaf-900"
                  >
                    {pendingReward.title}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setPendingReward(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-leaf-50 text-leaf-900 transition active:scale-95"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <dl className="mt-4 space-y-2 rounded-2xl bg-leaf-50 p-3 text-xs text-leaf-800">
                <div className="flex items-center justify-between">
                  <dt>Cost</dt>
                  <dd className="inline-flex items-center gap-1.5 font-semibold">
                    <CoinIcon className="h-4 w-4 text-sun-400" />
                    {pendingReward.costPoints.toLocaleString()} pts
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Balance after redeeming</dt>
                  <dd className="font-semibold">
                    {(points - pendingReward.costPoints).toLocaleString()} pts
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Voucher validity</dt>
                  <dd className="font-semibold">
                    {pendingReward.validityDays} days
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] leading-relaxed text-leaf-700/75">
                Points are deducted immediately and cannot be refunded once the
                voucher is issued.
              </p>

              <button
                type="button"
                onClick={() => confirmRedeem(pendingReward)}
                className="mt-4 w-full rounded-full bg-leaf-800 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
              >
                Confirm redemption
              </button>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
