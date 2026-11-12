"use client";

import { useSyncExternalStore } from "react";

import { levelSummary } from "@/lib/home-data";
import {
  rewardsSummary,
  vouchers as seedVouchers,
  type Reward,
  type Voucher,
} from "@/lib/rewards-data";
import type { BinId, ItemMatch, ScanItem } from "@/lib/scan-data";

/**
 * The single owner of the resident's points.
 *
 * The scanner, the home level card and the rewards screen are separate routes,
 * so a balance held in any one of them is lost on navigation. This module keeps
 * the balance, the level progress, the items being carried to a bin, and the
 * issued vouchers in one place, mirrored to localStorage.
 *
 * It is an external store read through `useSyncExternalStore` rather than a
 * context + effect, so hydration uses the server snapshot and no render-time
 * setState is needed.
 */

const STORAGE_KEY = "townloop.points.v1";

/**
 * Awarded when a drop-off clears the recyclables the resident was carrying.
 *
 * Prototype shortcut: a real deployment would confirm this against the bin's
 * own sensor, so here any drop-off that includes a recyclable earns it.
 */
export const CLEAN_SORTING_BONUS = 25;

export type CarriedItem = {
  /** Distinct from `item.id` so two identical bottles are two entries. */
  uid: string;
  item: ScanItem;
  confidence: number;
};

export type DisposalReceipt = {
  /** Carried items that belonged in the scanned bin and were just dropped off. */
  disposed: CarriedItem[];
  /** Still being carried, because they belong in a different bin. */
  remaining: CarriedItem[];
  itemPoints: number;
  bonus: number;
  total: number;
};

export type PointsState = {
  balance: number;
  lifetimePoints: number;
  /**
   * The slice of `balance` that lapses at the end of the year. Older points
   * expire first, so redeeming draws this bucket down before the rest, and
   * points earned now expire in a later cycle rather than adding to it.
   *
   * Invariant: never greater than `balance`, never below 0.
   */
  expiringPoints: number;
  /** Vouchers redeemed this calendar year, including before this session. */
  redeemedThisYear: number;
  carried: CarriedItem[];
  vouchers: Voucher[];
};

const seedState: PointsState = {
  balance: levelSummary.redeemablePoints,
  lifetimePoints: levelSummary.lifetimePoints,
  expiringPoints: rewardsSummary.pointsExpiringSoon,
  redeemedThisYear: rewardsSummary.redeemedThisYear,
  carried: [],
  vouchers: seedVouchers,
};

let state: PointsState = seedState;
let loadedFromStorage = false;
let uidCounter = 0;

const listeners = new Set<() => void>();

function readStored(): PointsState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const candidate = parsed as Partial<PointsState>;
    if (
      typeof candidate.balance !== "number" ||
      typeof candidate.lifetimePoints !== "number" ||
      typeof candidate.expiringPoints !== "number" ||
      typeof candidate.redeemedThisYear !== "number" ||
      !Array.isArray(candidate.carried) ||
      !Array.isArray(candidate.vouchers)
    ) {
      return null;
    }

    return {
      balance: candidate.balance,
      lifetimePoints: candidate.lifetimePoints,
      expiringPoints: candidate.expiringPoints,
      redeemedThisYear: candidate.redeemedThisYear,
      carried: candidate.carried,
      vouchers: candidate.vouchers,
    };
  } catch {
    // Corrupt or unavailable storage falls back to the seed rather than crashing.
    return null;
  }
}

function persist() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked storage quota must not break the app.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Must return a referentially stable value while nothing has changed, so the
 * state object is only replaced inside `update`.
 */
function getSnapshot(): PointsState {
  if (!loadedFromStorage) {
    loadedFromStorage = true;
    state = readStored() ?? seedState;
  }
  return state;
}

/** React hydrates with this, then re-renders with the stored snapshot. */
function getServerSnapshot(): PointsState {
  return seedState;
}

function update(next: (current: PointsState) => PointsState) {
  state = next(getSnapshot());
  persist();
  listeners.forEach((listener) => listener());
}

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

/** Adds an identified item to the list carried to the bin. No points yet. */
export function carryItem(match: ItemMatch) {
  uidCounter += 1;
  const uid = `${match.item.id}-${Date.now()}-${uidCounter}`;

  update((current) => ({
    ...current,
    carried: [
      ...current.carried,
      { uid, item: match.item, confidence: match.confidence },
    ],
  }));
}

/** Drops an item off the list without disposing it, so it earns nothing. */
export function discardCarried(uid: string) {
  update((current) => ({
    ...current,
    carried: current.carried.filter((entry) => entry.uid !== uid),
  }));
}

/**
 * Checks in at a bin: every carried item belonging to `binId` is disposed and
 * credited, the rest stay on the list. Returns the receipt for the UI.
 */
export function disposeAtBin(binId: BinId): DisposalReceipt {
  const current = getSnapshot();
  const disposed = current.carried.filter((entry) => entry.item.binId === binId);
  const remaining = current.carried.filter((entry) => entry.item.binId !== binId);

  const itemPoints = disposed.reduce((sum, entry) => sum + entry.item.points, 0);
  // General waste alone is not "clean sorting", so it does not earn the bonus.
  const bonus = disposed.some((entry) => entry.item.points > 0)
    ? CLEAN_SORTING_BONUS
    : 0;
  const total = itemPoints + bonus;

  if (disposed.length > 0) {
    update((latest) => ({
      ...latest,
      balance: latest.balance + total,
      // Lifetime drives the level bar and only ever grows.
      lifetimePoints: latest.lifetimePoints + total,
      carried: remaining,
    }));
  }

  return { disposed, remaining, itemPoints, bonus, total };
}

/**
 * Spends points on a reward and issues the voucher.
 * Returns `null` without charging if the balance does not cover the cost.
 */
export function redeemReward(reward: Reward): Voucher | null {
  if (getSnapshot().balance < reward.costPoints) return null;

  const voucher: Voucher = {
    id: `${reward.id}-${Date.now()}`,
    partner: reward.partner,
    title: reward.title,
    value: reward.value,
    code: createVoucherCode(reward.partner),
    status: "active",
    expiresOn: formatExpiry(reward.validityDays),
  };

  update((current) => {
    // Spending never touches lifetimePoints, so the level cannot regress.
    const balance = Math.max(0, current.balance - reward.costPoints);

    return {
      ...current,
      balance,
      // Oldest points go first, and the bucket can never exceed the balance.
      expiringPoints: Math.min(
        Math.max(0, current.expiringPoints - reward.costPoints),
        balance,
      ),
      redeemedThisYear: current.redeemedThisYear + 1,
      vouchers: [voucher, ...current.vouchers],
    };
  });

  return voucher;
}

/** Puts the demo back to its seeded state. */
export function resetPoints() {
  update(() => seedState);
}

export function usePoints(): PointsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Reads the current state outside React (event handlers, checks, debugging). */
export function getPointsSnapshot(): PointsState {
  return getSnapshot();
}
