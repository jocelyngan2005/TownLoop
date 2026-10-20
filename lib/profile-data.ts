export type ProfileDetails = {
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  address: string;
  householdSize: number;
  memberSince: string;
  membershipId: string;
};

export type ProfileStat = {
  id: string;
  label: string;
  value: string;
};

export type PreferenceSetting = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type AccountLink = {
  id: string;
  label: string;
  hint: string;
};

export const profileDetails: ProfileDetails = {
  fullName: "Nur Aisyah Rahman",
  initials: "NA",
  email: "nur.aisyah@example.com",
  phone: "+60 12-345 6789",
  address: "Jalan SS 15/4, Block C, 47500 Subang Jaya, Selangor",
  householdSize: 3,
  memberSince: "March 2024",
  membershipId: "TL-884-2291",
};

export const profileStats: ProfileStat[] = [
  { id: "lifetime", label: "Lifetime points", value: "8,650" },
  { id: "weight", label: "Verified kg", value: "146.2" },
  { id: "drop-offs", label: "Drop-offs", value: "92" },
  { id: "rank", label: "Block rank", value: "#18" },
];

export const preferenceSettings: PreferenceSetting[] = [
  {
    id: "collection-reminders",
    label: "Collection reminders",
    description: "Evening reminder before your street's pickup day",
    enabled: true,
  },
  {
    id: "challenge-updates",
    label: "Challenge updates",
    description: "Progress and results for challenges you joined",
    enabled: true,
  },
  {
    id: "reward-alerts",
    label: "Reward alerts",
    description: "New partner offers and vouchers about to expire",
    enabled: true,
  },
  {
    id: "leaderboard-visibility",
    label: "Show me on the leaderboard",
    description: "Your first name and block are visible to neighbours",
    enabled: false,
  },
];

export const accountLinks: AccountLink[] = [
  { id: "household", label: "Household & address", hint: "3 residents" },
  { id: "collection", label: "Collection schedule", hint: "Tue & Fri" },
  { id: "privacy", label: "Privacy & data", hint: "Export or delete data" },
  { id: "support", label: "Help & support", hint: "FAQ and contact" },
];
