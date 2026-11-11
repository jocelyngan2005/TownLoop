export type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  block: string;
  seasonPoints: number;
  verifiedKg: number;
  isCurrentUser?: boolean;
};

export type LeaderboardSeason = {
  /** Human label for the scoring window, e.g. "November 2026". */
  label: string;
  /** Short label used inside buttons and receipts, e.g. "November". */
  shortLabel: string;
  endsOn: string;
  daysLeft: number;
  communitySize: number;
  /** Residents ranked at or above this position may claim a township reward. */
  eligibleRankCutoff: number;
  /** Date the next claim window opens, shown once a resident has claimed. */
  resetsOn: string;
};

export type TownshipRewardId =
  | "parking-pass"
  | "maintenance-discount"
  | "parcel-locker"
  | "admin-fee-discount";

export type TownshipReward = {
  id: TownshipRewardId;
  title: string;
  /** Township department that honours the reward. */
  issuer: string;
  description: string;
  /** Headline monetary worth, shown on the card. */
  value: string;
  /** How the benefit reaches the resident once claimed. */
  fulfilment: string;
  validityLabel: string;
};

export type TownshipClaim = {
  rewardId: TownshipRewardId;
  reference: string;
  claimedOn: string;
  seasonLabel: string;
};

export const leaderboardSeason: LeaderboardSeason = {
  label: "November 2026",
  shortLabel: "November",
  endsOn: "30 Nov 2026",
  daysLeft: 18,
  communitySize: 284,
  eligibleRankCutoff: 10,
  resetsOn: "1 Dec 2026",
};

/**
 * Season standings for the resident's community, highest score first.
 * Every resident in this list is eligible for a township reward.
 */
export const leaderboardTopTen: LeaderboardEntry[] = [
  {
    id: "nurul-hidayah",
    rank: 1,
    name: "Nurul Hidayah",
    block: "Block A · Unit 07",
    seasonPoints: 3480,
    verifiedKg: 41.2,
  },
  {
    id: "tan-wei-ming",
    rank: 2,
    name: "Tan Wei Ming",
    block: "Block D · Unit 21",
    seasonPoints: 3215,
    verifiedKg: 38.6,
  },
  {
    id: "ravi-kumaran",
    rank: 3,
    name: "Ravi Kumaran",
    block: "Block B · Unit 15",
    seasonPoints: 2960,
    verifiedKg: 35.1,
  },
  {
    id: "aisyah",
    rank: 4,
    name: "Aisyah (you)",
    block: "Block C · Unit 12",
    seasonPoints: 2740,
    verifiedKg: 32.4,
    isCurrentUser: true,
  },
  {
    id: "siti-rahayu",
    rank: 5,
    name: "Siti Rahayu",
    block: "Block A · Unit 33",
    seasonPoints: 2615,
    verifiedKg: 30.9,
  },
  {
    id: "lim-jia-hui",
    rank: 6,
    name: "Lim Jia Hui",
    block: "Block E · Unit 04",
    seasonPoints: 2480,
    verifiedKg: 29.7,
  },
  {
    id: "haziq-danial",
    rank: 7,
    name: "Haziq Danial",
    block: "Block C · Unit 28",
    seasonPoints: 2310,
    verifiedKg: 27.8,
  },
  {
    id: "priya-devi",
    rank: 8,
    name: "Priya Devi",
    block: "Block B · Unit 09",
    seasonPoints: 2155,
    verifiedKg: 25.6,
  },
  {
    id: "chong-kah-wai",
    rank: 9,
    name: "Chong Kah Wai",
    block: "Block D · Unit 17",
    seasonPoints: 2040,
    verifiedKg: 24.3,
  },
  {
    id: "farah-nabila",
    rank: 10,
    name: "Farah Nabila",
    block: "Block E · Unit 22",
    seasonPoints: 1925,
    verifiedKg: 23.1,
  },
];

/**
 * Perks funded by the township council rather than the partner catalog.
 * They are unlocked by finishing in the top 10, not bought with points —
 * one claim per resident per season.
 */
export const townshipRewards: TownshipReward[] = [
  {
    id: "parking-pass",
    title: "Monthly resident parking pass",
    issuer: "MPSJ Parking Unit",
    description:
      "Unlimited parking at all township resident bays and the SS15 multi-storey car park for one month.",
    value: "RM120",
    fulfilment: "Pass is linked to your registered vehicle plate within 3 working days.",
    validityLabel: "Covers December 2026",
  },
  {
    id: "maintenance-discount",
    title: "15% off your maintenance fee",
    issuer: "Township Management Office",
    description:
      "A one-off rebate applied to the monthly maintenance invoice for your unit.",
    value: "RM45 avg",
    fulfilment: "Rebate appears on your next invoice — no counter visit needed.",
    validityLabel: "Applied to the December invoice",
  },
  {
    id: "parcel-locker",
    title: "Free parcel locker for 3 months",
    issuer: "TownLoop Logistics Hub",
    description:
      "A reserved medium locker at your block's parcel station with the monthly rental waived.",
    value: "RM75",
    fulfilment: "Locker is assigned to your resident ID at the block station.",
    validityLabel: "Dec 2026 – Feb 2027",
  },
  {
    id: "admin-fee-discount",
    title: "50% off administrative fees",
    issuer: "Township Admin Counter",
    description:
      "Covers one application: renovation permit, access card, visitor sticker or letter of support.",
    value: "Up to RM60",
    fulfilment: "Show the claim reference at the admin counter in Block A.",
    validityLabel: "Valid 90 days from claim",
  },
];
