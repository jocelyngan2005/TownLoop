"use client";

import { useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";

import {
  CheckIcon,
  CloseIcon,
  InvoiceIcon,
  LockerIcon,
  LockIcon,
  ParkingIcon,
  StampIcon,
  TrophyIcon,
} from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type {
  LeaderboardSeason,
  TownshipClaim,
  TownshipReward,
  TownshipRewardId,
} from "@/lib/leaderboard-data";

const rewardIcons: Record<
  TownshipRewardId,
  ComponentType<{ className?: string }>
> = {
  "parking-pass": ParkingIcon,
  "maintenance-discount": InvoiceIcon,
  "parcel-locker": LockerIcon,
  "admin-fee-discount": StampIcon,
};

const referencePrefixes: Record<TownshipRewardId, string> = {
  "parking-pass": "PARK",
  "maintenance-discount": "MNTC",
  "parcel-locker": "LCKR",
  "admin-fee-discount": "ADMN",
};

function createClaimReference(rewardId: TownshipRewardId) {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TL-${referencePrefixes[rewardId]}-${suffix}`;
}

function formatClaimDate() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TownshipRewards({
  rewards,
  season,
  userRank,
  initialClaim = null,
}: {
  rewards: TownshipReward[];
  season: LeaderboardSeason;
  userRank: number;
  initialClaim?: TownshipClaim | null;
}) {
  const [claim, setClaim] = useState<TownshipClaim | null>(initialClaim);
  const [pendingReward, setPendingReward] = useState<TownshipReward | null>(
    null,
  );

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

  const eligible = userRank <= season.eligibleRankCutoff;
  const claimedReward = claim
    ? rewards.find((reward) => reward.id === claim.rewardId)
    : undefined;

  function confirmClaim(reward: TownshipReward) {
    if (!eligible || claim) return;

    setClaim({
      rewardId: reward.id,
      reference: createClaimReference(reward.id),
      claimedOn: formatClaimDate(),
      seasonLabel: season.label,
    });
    setPendingReward(null);
  }

  return (
    <Section title="Township rewards">
      {eligible ? (
        <div className="mb-3 flex items-start gap-2.5 rounded-2xl bg-leaf-100 px-3.5 py-3">
          <TrophyIcon className="mt-0.5 h-5 w-5 shrink-0 text-orchard-500" />
          <div>
            <p className="text-xs font-semibold text-leaf-900">
              Top {season.eligibleRankCutoff} unlocked — pick one perk
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-leaf-700/80">
              Funded by the township council, not your points balance. One claim
              per resident each season, so choose the one you will actually use.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-3 flex items-start gap-2.5 rounded-2xl bg-leaf-50 px-3.5 py-3 ring-1 ring-leaf-200">
          <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-leaf-700/70" />
          <div>
            <p className="text-xs font-semibold text-leaf-900">
              Reach the top {season.eligibleRankCutoff} to unlock
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-leaf-700/80">
              You are ranked #{userRank}. The {season.label} season closes on{" "}
              {season.endsOn} — {season.daysLeft} days left to climb.
            </p>
          </div>
        </div>
      )}

      {claim && claimedReward && (
        <div className="mb-3 rounded-2xl bg-leaf-800 p-3.5 text-white">
          <p className="inline-flex items-center gap-2 text-xs font-semibold">
            <CheckIcon className="h-4 w-4 text-leaf-300" />
            {claimedReward.title} claimed
          </p>
          <dl className="mt-2.5 space-y-1.5 text-[11px] text-white/85">
            <div className="flex items-center justify-between gap-3">
              <dt>Claim reference</dt>
              <dd className="font-mono text-xs font-semibold tracking-wider text-white">
                {claim.reference}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Claimed on</dt>
              <dd className="font-semibold text-white">{claim.claimedOn}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Next claim opens</dt>
              <dd className="font-semibold text-white">{season.resetsOn}</dd>
            </div>
          </dl>
          <p className="mt-2.5 border-t border-white/20 pt-2 text-[11px] leading-relaxed text-white/80">
            {claimedReward.fulfilment}
          </p>
        </div>
      )}

      <ul className="divide-y divide-leaf-200">
        {rewards.map((reward) => {
          const Icon = rewardIcons[reward.id];
          const isClaimed = claim?.rewardId === reward.id;
          const spentOnOther = Boolean(claim) && !isClaimed;
          const canClaim = eligible && !claim;

          return (
            <li key={reward.id} className="motion-card py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-orchard-500">
                    {reward.issuer}
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
                    <Icon className="h-4 w-4 text-leaf-600" />
                    {reward.value}
                  </p>
                  <p className="text-[10px] text-leaf-700/65">
                    {reward.validityLabel}
                  </p>
                </div>

                {isClaimed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-4 py-2 text-xs font-semibold text-leaf-800">
                    <CheckIcon className="h-4 w-4 text-leaf-600" />
                    Claimed
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => setPendingReward(reward)}
                    className="rounded-full bg-orchard-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orchard-600 active:scale-95 disabled:bg-leaf-100 disabled:text-leaf-700/55"
                  >
                    {!eligible
                      ? `Top ${season.eligibleRankCutoff} only`
                      : spentOnOther
                        ? "1 claim per season"
                        : "Claim reward"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {pendingReward &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <button
              type="button"
              aria-label="Cancel claim"
              onClick={() => setPendingReward(null)}
              className="absolute inset-0 bg-leaf-900/50"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="township-claim-title"
              className="relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-[0_-10px_40px_-20px_rgba(16,40,29,0.8)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-orchard-500">
                    {pendingReward.issuer}
                  </p>
                  <h2
                    id="township-claim-title"
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
                <div className="flex items-center justify-between gap-3">
                  <dt>Unlocked by</dt>
                  <dd className="font-semibold">
                    Rank #{userRank} this season
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Worth</dt>
                  <dd className="font-semibold">{pendingReward.value}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Points cost</dt>
                  <dd className="font-semibold">None</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Validity</dt>
                  <dd className="text-right font-semibold">
                    {pendingReward.validityLabel}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] leading-relaxed text-leaf-700/75">
                {pendingReward.fulfilment} This uses your single{" "}
                {season.shortLabel} claim — the other three township rewards
                close until {season.resetsOn}.
              </p>

              <button
                type="button"
                onClick={() => confirmClaim(pendingReward)}
                className="mt-4 w-full rounded-full bg-leaf-800 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
              >
                Confirm claim
              </button>
            </div>
          </div>,
          document.body,
        )}
    </Section>
  );
}
