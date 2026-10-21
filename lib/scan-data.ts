export type BinId =
  | "paper"
  | "plastics"
  | "glass"
  | "metals"
  | "organic"
  | "e-waste"
  | "textiles"
  | "residual";

export type Verdict =
  | "recyclable"
  | "prep-required"
  | "special"
  | "not-recyclable";

export type ScanItem = {
  id: string;
  name: string;
  material: string;
  verdict: Verdict;
  binId: BinId;
  points: number;
  summary: string;
  prepSteps: string[];
  note?: string;
};

export type RecyclingBin = {
  id: BinId;
  label: string;
  color: string;
  qrCode: string;
  location: string;
  accepts: string;
  rejects: string;
};

export const verdictMeta: Record<
  Verdict,
  { label: string; headline: string; badgeClass: string; dotClass: string }
> = {
  recyclable: {
    label: "Recyclable",
    headline: "Good to drop off",
    badgeClass: "bg-leaf-100 text-leaf-800",
    dotClass: "bg-leaf-500",
  },
  "prep-required": {
    label: "Recyclable after prep",
    headline: "Clean it first",
    badgeClass: "bg-sun-300/40 text-leaf-900",
    dotClass: "bg-sun-400",
  },
  special: {
    label: "Special drop-off",
    headline: "Needs a dedicated point",
    badgeClass: "bg-orchard-500/15 text-orchard-600",
    dotClass: "bg-orchard-500",
  },
  "not-recyclable": {
    label: "Not recyclable",
    headline: "Goes to general waste",
    badgeClass: "bg-clay-500/15 text-clay-600",
    dotClass: "bg-clay-500",
  },
};

export const recyclingBins: RecyclingBin[] = [
  {
    id: "paper",
    label: "Paper & cardboard",
    color: "#2f9d63",
    qrCode: "TL-BIN-PAPER-C12",
    location: "Block C recycling bay, Subang Jaya",
    accepts: "Flattened boxes, newspapers, office paper, paper bags",
    rejects: "Greasy, waxed or laminated paper",
  },
  {
    id: "plastics",
    label: "Plastics",
    color: "#e2721f",
    qrCode: "TL-BIN-PLASTIC-C12",
    location: "Block C recycling bay, Subang Jaya",
    accepts: "Rinsed PET bottles, HDPE containers, clean tubs and caps",
    rejects: "Plastic bags, film wrap, polystyrene foam",
  },
  {
    id: "glass",
    label: "Glass",
    color: "#5aa4c5",
    qrCode: "TL-BIN-GLASS-C12",
    location: "Block C recycling bay, Subang Jaya",
    accepts: "Bottles and jars of any colour, lids removed",
    rejects: "Mirrors, ceramics, light bulbs, tempered glass",
  },
  {
    id: "metals",
    label: "Metals",
    color: "#f0b72f",
    qrCode: "TL-BIN-METAL-C12",
    location: "Block C recycling bay, Subang Jaya",
    accepts: "Aluminium cans, steel food tins, clean foil, empty aerosols",
    rejects: "Paint tins, gas canisters, scrap with food residue",
  },
  {
    id: "organic",
    label: "Organic / biomatter",
    color: "#7e9f3a",
    qrCode: "TL-BIN-ORGANIC-C12",
    location: "Community composting area, Subang Jaya",
    accepts: "Fruit and vegetable scraps, coffee grounds, garden trimmings",
    rejects: "Meat, dairy, oil, compostable-labelled plastics",
  },
  {
    id: "e-waste",
    label: "E-waste cage",
    color: "#64778b",
    qrCode: "TL-BIN-EWASTE-C12",
    location: "Guardhouse beside the parcel room, Block C",
    accepts: "Phones, cables, chargers, batteries, small appliances",
    rejects: "Swollen batteries, large appliances, CRT screens",
  },
  {
    id: "textiles",
    label: "Textiles & clothing",
    color: "#d986aa",
    qrCode: "TL-BIN-TEXTILE-C12",
    location: "Lobby collection box, Block C",
    accepts: "Dry clothing, bed linen, shoes tied in pairs",
    rejects: "Wet, mouldy or oil-stained fabric",
  },
  {
    id: "residual",
    label: "General waste",
    color: "#8a8f8c",
    qrCode: "TL-BIN-GENERAL-C12",
    location: "Block C refuse room, Subang Jaya",
    accepts: "Non-recyclable leftovers after sorting",
    rejects: "Anything a recycling stream still accepts",
  },
];

export const scanItems: ScanItem[] = [
  {
    id: "cardboard-box",
    name: "Cardboard box",
    material: "Paper and cardboard",
    verdict: "recyclable",
    binId: "paper",
    points: 12,
    summary:
      "Clean corrugated cardboard is one of the easiest materials to reprocess.",
    prepSteps: [
      "Remove tape, labels and plastic film",
      "Flatten the box so it stacks neatly",
    ],
  },
  {
    id: "pet-bottle",
    name: "PET drink bottle",
    material: "Plastics",
    verdict: "prep-required",
    binId: "plastics",
    points: 10,
    summary: "PET is widely recycled once the bottle is empty and rinsed.",
    prepSteps: [
      "Empty and rinse the bottle",
      "Squash it flat and screw the cap back on",
    ],
  },
  {
    id: "plastic-bag",
    name: "Plastic carrier bag",
    material: "Film plastic",
    verdict: "not-recyclable",
    binId: "residual",
    points: 0,
    summary:
      "Soft film jams the sorting machinery at the local recycling facility.",
    prepSteps: [
      "Reuse the bag as long as you can",
      "Return clean film to a supermarket collection point if available",
    ],
  },
  {
    id: "aluminium-can",
    name: "Aluminium can",
    material: "Metals",
    verdict: "recyclable",
    binId: "metals",
    points: 15,
    summary:
      "Recycling aluminium uses about 5% of the energy needed for new metal.",
    prepSteps: ["Pour out any liquid", "Leave the can whole or lightly crushed"],
  },
  {
    id: "old-phone",
    name: "Old mobile phone",
    material: "E-waste",
    verdict: "special",
    binId: "e-waste",
    points: 40,
    summary:
      "Contains recoverable gold, copper and a battery that must not be crushed.",
    prepSteps: [
      "Factory reset and remove the SIM card",
      "Hand it to the e-waste cage, never a normal bin",
    ],
    note: "Retailer take-back programmes may also reward you for this item.",
  },
  {
    id: "battery",
    name: "Household battery",
    material: "E-waste",
    verdict: "special",
    binId: "e-waste",
    points: 18,
    summary: "Batteries are a fire risk in collection trucks and bins.",
    prepSteps: [
      "Tape the terminals of lithium cells",
      "Drop it in the battery tube at the e-waste cage",
    ],
  },
  {
    id: "cotton-shirt",
    name: "Cotton t-shirt",
    material: "Textiles and clothing",
    verdict: "recyclable",
    binId: "textiles",
    points: 20,
    summary: "Wearable clothing is redistributed before it is shredded.",
    prepSteps: ["Make sure it is clean and dry", "Bag it to keep it dry in transit"],
  },
];

/** Hex colours are compared against the captured frame to pick a likely stream. */
const binColorRgb = recyclingBins.map((bin) => ({
  id: bin.id,
  rgb: hexToRgb(bin.color),
}));

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function getBin(id: BinId) {
  const bin = recyclingBins.find((entry) => entry.id === id);
  if (!bin) throw new Error(`Unknown bin: ${id}`);
  return bin;
}

export function findBinByCode(rawCode: string) {
  const normalized = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) return undefined;

  return recyclingBins.find(
    (bin) => normalized === bin.qrCode || normalized.includes(bin.qrCode),
  );
}

export type ItemMatch = {
  item: ScanItem;
  confidence: number;
};

/** Returns items in scanItems order; frame color only affects confidence. */
export function identifyFromFrame(
  averageColor: { r: number; g: number; b: number },
  previouslySeenIds: string[] = [],
): ItemMatch {
  const item = scanItems[previouslySeenIds.length % scanItems.length];
  const itemBin = binColorRgb.find((candidate) => candidate.id === item.binId)!;
  const colorDistance =
    (itemBin.rgb.r - averageColor.r) ** 2 +
    (itemBin.rgb.g - averageColor.g) ** 2 +
    (itemBin.rgb.b - averageColor.b) ** 2;

  // 0 distance -> 0.96 confidence, far away -> ~0.68.
  const normalizedDistance = Math.min(1, Math.sqrt(colorDistance) / 441);
  const confidence = Math.round((0.96 - normalizedDistance * 0.28) * 100) / 100;

  return { item, confidence };
}
