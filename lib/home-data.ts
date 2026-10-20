export type Resident = {
  firstName: string;
  block: string;
  unreadNotifications: number;
};

export type LevelSummary = {
  level: number;
  levelName: string;
  nextLevelName: string;
  redeemablePoints: number;
  lifetimePoints: number;
  levelStartsAt: number;
  nextLevelAt: number;
};

export type QuickAction = {
  id: "scan" | "qr-scan" | "drop-off" | "rewards" | "take-back";
  label: string;
  hint: string;
  href?: string;
};

export type MonthlyImpact = {
  monthLabel: string;
  verifiedWeightKg: number;
  wasteSources: WasteSource[];
};

export type WasteSource = {
  id: string;
  name: string;
  description: string;
  weightKg: number;
  color: string;
};

export type CircularActions = {
  reusedRepairedDonated: number;
  returnedToRetailers: number;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  earned: boolean;
};

export type Goals = {
  sortingStreakDays: number;
  bestStreakDays: number;
  badges: Badge[];
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  unit: string;
  current: number;
  target: number;
  daysLeft: number;
};

export type CommunitySnapshot = {
  challengeId: string;
  participants: number;
  userContribution: number;
};

export type CommunityLeaderboard = {
  rank: number;
  communitySize: number;
};

export type Insight = {
  id: string;
  headline: string;
  detail: string;
  tone: "positive" | "neutral" | "warning";
};

export const resident: Resident = {
  firstName: "Aisyah",
  block: "Block C · Unit 12",
  unreadNotifications: 3,
};

export const levelSummary: LevelSummary = {
  level: 3,
  levelName: "Sorter",
  nextLevelName: "Recycler",
  redeemablePoints: 1240,
  lifetimePoints: 8650,
  levelStartsAt: 7500,
  nextLevelAt: 9000,
};

export const quickActions: QuickAction[] = [
  {
    id: "scan",
    label: "Scan an item",
    hint: "Check how to sort it",
    href: "/scan",
  },
  {
    id: "qr-scan",
    label: "Scan a QR code",
    hint: "Check in at the bin",
    href: "/scan#qr",
  },
  {
    id: "drop-off",
    label: "Find a drop-off",
    hint: "15 points nearby",
    href: "/drop-off",
  },
  {
    id: "rewards",
    label: "Claim rewards",
    hint: "1,240 pts ready",
    href: "/rewards",
  },
  {
    id: "take-back",
    label: "Take-back",
    hint: "6 open campaigns",
    href: "/take-back",
  },
];

export const monthlyImpact: MonthlyImpact = {
  monthLabel: "October",
  verifiedWeightKg: 14.6,
  wasteSources: [
    {
      id: "paper",
      name: "Paper and Cardboard",
      description:
        "Office paper, newspapers, magazines, shipping boxes and food delivery cartons. Clean fibres can be reprocessed multiple times.",
      weightKg: 3.8,
      color: "#2f9d63",
    },
    {
      id: "plastics",
      name: "Plastics",
      description:
        "Plastic waste varies widely by resin type and usually needs to be rinsed clean.",
      weightKg: 2.9,
      color: "#e2721f",
    },
    {
      id: "glass",
      name: "Glass",
      description:
        "Clear or coloured bottles and food storage jars can be melted down repeatedly without losing quality.",
      weightKg: 2.3,
      color: "#5aa4c5",
    },
    {
      id: "metals",
      name: "Metals",
      description:
        "Aluminium beverage cans, steel food cans, coffee tins and aerosol cans.",
      weightKg: 1.9,
      color: "#f0b72f",
    },
    {
      id: "organic",
      name: "Organic / Biomatter",
      description:
        "Food scraps, garden waste and clean wood managed through composting or biological processing.",
      weightKg: 1.7,
      color: "#7e9f3a",
    },
    {
      id: "e-waste",
      name: "E-Waste",
      description:
        "Batteries, mobile phones, cables and small appliances that require specialised collection centres.",
      weightKg: 1.1,
      color: "#64778b",
    },
    {
      id: "textiles",
      name: "Textiles and Clothing",
      description:
        "Clothing and textiles collected through apparel take-back programs.",
      weightKg: 0.9,
      color: "#d986aa",
    },
  ],
};

export const circularActions: CircularActions = {
  reusedRepairedDonated: 6,
  returnedToRetailers: 3,
};

export const goals: Goals = {
  sortingStreakDays: 12,
  bestStreakDays: 18,
  badges: [
    {
      id: "first-drop",
      name: "First Drop",
      description: "Complete your first verified drop-off",
      earned: true,
    },
    {
      id: "clean-sorter",
      name: "Clean Sorter",
      description: "20 cleanly separated items in a month",
      earned: true,
    },
    {
      id: "streak-10",
      name: "Ten in a Row",
      description: "Sort correctly 10 days in a row",
      earned: true,
    },
    {
      id: "repair-hero",
      name: "Repair Hero",
      description: "Repair or donate 10 items",
      earned: false,
    },
    {
      id: "e-waste",
      name: "E-Waste Guard",
      description: "Return 5 devices to a retailer",
      earned: false,
    },
    {
      id: "block-leader",
      name: "Block Leader",
      description: "Top contributor in your block",
      earned: false,
    },
  ],
};

export const challenges: Challenge[] = [
  {
    id: "glass-week",
    title: "Subang Jaya Glass Drive",
    description: "Collect 500 kg of clean glass together",
    unit: "kg",
    current: 312,
    target: 500,
    daysLeft: 6,
  },
  {
    id: "battery-drive",
    title: "Battery Drive",
    description: "Return 1,000 used batteries to drop-off points",
    unit: "batteries",
    current: 640,
    target: 1000,
    daysLeft: 11,
  },
  {
    id: "textile-loop",
    title: "Textile Loop",
    description: "Give 300 garments a second life",
    unit: "garments",
    current: 88,
    target: 300,
    daysLeft: 21,
  },
];

export const communitySnapshot: CommunitySnapshot = {
  challengeId: "glass-week",
  participants: 284,
  userContribution: 7.8,
};

export const communityLeaderboard: CommunityLeaderboard = {
  rank: 18,
  communitySize: 284,
};

export const insights: Insight[] = [
  {
    id: "glass-up",
    headline: "Your glass drop-offs doubled",
    detail:
      "You verified 8 glass items this month against 4 in September. Keep lids separated to stay at 100% clean.",
    tone: "positive",
  },
  {
    id: "plastic-mix",
    headline: "3 plastic items were mixed",
    detail:
      "Rinse food containers before dropping them off — mixed items are not counted toward your sorting rate.",
    tone: "warning",
  },
  {
    id: "weekend",
    headline: "You drop off mostly on Saturdays",
    detail: "The SS15 recycling point is quietest before 10:00.",
    tone: "neutral",
  },
];
