export type RewardCategory =
  | "groceries"
  | "transport"
  | "repair"
  | "dining"
  | "donation";

export type Reward = {
  id: string;
  partner: string;
  title: string;
  description: string;
  category: RewardCategory;
  costPoints: number;
  value: string;
  stock: number;
  validityDays: number;
};

export type Voucher = {
  id: string;
  partner: string;
  title: string;
  value: string;
  code: string;
  status: "active" | "used";
  expiresOn: string;
};

export type RewardsSummary = {
  pointsExpiringSoon: number;
  expiryLabel: string;
  redeemedThisYear: number;
};

export const rewardCategories: { id: RewardCategory; label: string }[] = [
  { id: "groceries", label: "Groceries" },
  { id: "transport", label: "Transport" },
  { id: "repair", label: "Repair" },
  { id: "dining", label: "Dining" },
  { id: "donation", label: "Donate" },
];

export const rewardsSummary: RewardsSummary = {
  pointsExpiringSoon: 180,
  expiryLabel: "31 December",
  redeemedThisYear: 7,
};

export const rewards: Reward[] = [
  {
    id: "beanloop-coffee",
    partner: "Kopi Kita",
    title: "Free coffee with your own cup",
    description: "Bring a reusable cup to any Kopi Kita outlet in Subang Jaya.",
    category: "dining",
    costPoints: 200,
    value: "1 drink",
    stock: 180,
    validityDays: 45,
  },
  {
    id: "tree-fund",
    partner: "Subang Jaya Tree Fund",
    title: "Plant a tree in SS15 Community Park",
    description: "Your points fund one native sapling planted next season.",
    category: "donation",
    costPoints: 350,
    value: "1 tree",
    stock: 400,
    validityDays: 90,
  },
  {
    id: "coop-refill",
    partner: "Subang Jaya Refill Co-op",
    title: "10% off zero-waste refills",
    description: "Discount on dry goods, detergents and soaps at the refill bar.",
    category: "groceries",
    costPoints: 300,
    value: "10% off",
    stock: 120,
    validityDays: 60,
  },
  {
    id: "greenbasket-5",
    partner: "Pasar Segar SS15",
    title: "RM5 off fresh produce",
    description: "Redeem at checkout on a basket of RM20 or more.",
    category: "groceries",
    costPoints: 450,
    value: "RM5",
    stock: 36,
    validityDays: 60,
  },
  {
    id: "rewear-repair",
    partner: "Jahit Semula Tailors",
    title: "Free garment repair",
    description: "One seam, zip or hem repair on a piece you already own.",
    category: "repair",
    costPoints: 500,
    value: "1 repair",
    stock: 30,
    validityDays: 120,
  },
  {
    id: "loopbike-rides",
    partner: "Kayuh KL",
    title: "3 free bike rentals",
    description: "Up to 45 minutes per ride at any bike dock in Subang Jaya.",
    category: "transport",
    costPoints: 600,
    value: "3 rides",
    stock: 45,
    validityDays: 30,
  },
  {
    id: "harvest-meal",
    partner: "Dapur Kongsi",
    title: "RM8 off a shared meal",
    description: "Surplus-ingredient menu served Thursday through Sunday.",
    category: "dining",
    costPoints: 650,
    value: "RM8",
    stock: 40,
    validityDays: 60,
  },
  {
    id: "fixit-credit",
    partner: "FixIt Café",
    title: "RM10 repair credit",
    description: "Spare parts and workshop time for small appliances.",
    category: "repair",
    costPoints: 750,
    value: "RM10",
    stock: 24,
    validityDays: 90,
  },
  {
    id: "cityride-pass",
    partner: "Transit Kita",
    title: "Free day pass",
    description: "Unlimited local bus and LRT travel for one day.",
    category: "transport",
    costPoints: 800,
    value: "1 day",
    stock: 18,
    validityDays: 45,
  },
  {
    id: "food-rescue",
    partner: "Dapur Kongsi",
    title: "Fund 5 rescued meals",
    description: "Surplus food redistributed to neighbours in your district.",
    category: "donation",
    costPoints: 900,
    value: "5 meals",
    stock: 500,
    validityDays: 90,
  },
];

export const vouchers: Voucher[] = [
  {
    id: "voucher-beanloop",
    partner: "Kopi Kita",
    title: "Free coffee with your own cup",
    value: "1 drink",
    code: "BEAN-7F2K",
    status: "active",
    expiresOn: "30 Nov 2026",
  },
  {
    id: "voucher-greenbasket",
    partner: "Pasar Segar SS15",
    title: "RM5 off fresh produce",
    value: "RM5",
    code: "GREE-X91C",
    status: "active",
    expiresOn: "12 Dec 2026",
  },
  {
    id: "voucher-loopbike",
    partner: "Kayuh KL",
    title: "3 free bike rentals",
    value: "3 rides",
    code: "LOOP-3DQ8",
    status: "used",
    expiresOn: "2 Oct 2026",
  },
];

export const earnPointsTips: { id: string; label: string; points: string }[] = [
  { id: "verified-drop", label: "Verified drop-off", points: "+25 pts" },
  { id: "clean-sorting", label: "Clean sorting bonus", points: "+10 pts" },
  { id: "take-back", label: "Retailer take-back", points: "+40 pts" },
  { id: "challenge", label: "Challenge completion", points: "+150 pts" },
];
