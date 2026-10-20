import type { BinId } from "@/lib/scan-data";

export type StationKind = "on-site" | "neighbourhood" | "centre";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type DropOffStation = {
  id: string;
  name: string;
  operator: string;
  address: string;
  distanceKm: number;
  kind: StationKind;
  accepts: BinId[];
  hours: string;
  alwaysOpen: boolean;
  mapsQuery: string;
  coordinates: Coordinates;
  note?: string;
};

export const stationKindLabel: Record<StationKind, string> = {
  "on-site": "In your block",
  neighbourhood: "Nearby",
  centre: "Recycling centre",
};

/** Registered block of the resident, used as the origin for distances. */
export const homeLocation: Coordinates = { lat: 3.0744, lng: 101.5856 };

export const dropOffStations: DropOffStation[] = [
  {
    id: "block-c-bay",
    name: "Block C Recycling Bay",
    operator: "Management office",
    address: "Jalan SS 15/4, Block C, 47500 Subang Jaya",
    distanceKm: 0.08,
    kind: "on-site",
    accepts: ["paper", "plastics", "glass", "metals"],
    hours: "Open 24 hours",
    alwaysOpen: true,
    mapsQuery: "Jalan SS 15/4, Subang Jaya, Selangor",
    coordinates: { lat: 3.07442, lng: 101.58565 },
    note: "Scan the bin QR after sorting to log your points.",
  },
  {
    id: "block-c-textiles",
    name: "Lobby Textile Box",
    operator: "Management office",
    address: "Block C lobby, beside the lift area",
    distanceKm: 0.1,
    kind: "on-site",
    accepts: ["textiles"],
    hours: "Open 24 hours",
    alwaysOpen: true,
    mapsQuery: "Jalan SS 15/4, Subang Jaya, Selangor",
    coordinates: { lat: 3.07451, lng: 101.5855 },
    note: "Bag your clothing so it stays dry in transit.",
  },
  {
    id: "block-c-ewaste",
    name: "Guardhouse E-Waste Cage",
    operator: "Management office",
    address: "Guardhouse beside the parcel room, Block C",
    distanceKm: 0.12,
    kind: "on-site",
    accepts: ["e-waste"],
    hours: "07:00 – 22:00 daily",
    alwaysOpen: false,
    mapsQuery: "Jalan SS 15/4, Subang Jaya, Selangor",
    coordinates: { lat: 3.07432, lng: 101.58546 },
    note: "Hand batteries to the guard on duty — never leave them outside.",
  },
  {
    id: "ss15-compost",
    name: "SS15 Composting Corner",
    operator: "Residents' committee",
    address: "SS15 Community Park, Jalan SS 15/8",
    distanceKm: 0.35,
    kind: "neighbourhood",
    accepts: ["organic"],
    hours: "07:00 – 19:00 daily",
    alwaysOpen: false,
    mapsQuery: "SS15 Community Park, Subang Jaya, Selangor",
    coordinates: { lat: 3.0772, lng: 101.5848 },
  },
  {
    id: "speedmart-ss15",
    name: "99 Speedmart SS15 Carton Point",
    operator: "99 Speedmart",
    address: "Jalan SS 15/5A, 47500 Subang Jaya",
    distanceKm: 0.55,
    kind: "neighbourhood",
    accepts: ["paper"],
    hours: "09:00 – 22:00 daily",
    alwaysOpen: false,
    mapsQuery: "99 Speedmart SS15, Subang Jaya, Selangor",
    coordinates: { lat: 3.0704, lng: 101.5886 },
    note: "Cartons only — flatten them and leave them inside the cage.",
  },
  {
    id: "pasar-segar",
    name: "Pasar Segar SS15 Recycling Point",
    operator: "Pasar Segar SS15",
    address: "Jalan SS 15/4B, 47500 Subang Jaya",
    distanceKm: 0.9,
    kind: "neighbourhood",
    accepts: ["paper", "plastics", "glass", "metals"],
    hours: "08:00 – 21:00 daily",
    alwaysOpen: false,
    mapsQuery: "Pasar Segar SS15, Subang Jaya, Selangor",
    coordinates: { lat: 3.073, lng: 101.593 },
  },
  {
    id: "kloth-ss16",
    name: "Kloth Fabric Bin @ Shell SS16",
    operator: "Kloth Circularity",
    address: "Shell station, Jalan SS 16/1, 47500 Subang Jaya",
    distanceKm: 1.05,
    kind: "neighbourhood",
    accepts: ["textiles"],
    hours: "Open 24 hours",
    alwaysOpen: true,
    mapsQuery: "Shell SS16 Subang Jaya, Selangor",
    coordinates: { lat: 3.0764, lng: 101.5948 },
    note: "Fabric only — clothes, curtains, bedsheets and shoes in pairs.",
  },
  {
    id: "klean-rvm",
    name: "Klean Reverse Vending Machine",
    operator: "Klean Malaysia",
    address: "Ground floor, Subang Parade, Jalan SS 16/1",
    distanceKm: 1.25,
    kind: "neighbourhood",
    accepts: ["plastics", "metals"],
    hours: "10:00 – 22:00 daily",
    alwaysOpen: false,
    mapsQuery: "Subang Parade, Subang Jaya, Selangor",
    coordinates: { lat: 3.0856, lng: 101.5852 },
    note: "PET bottles and aluminium cans only, fed in one at a time.",
  },
  {
    id: "erth-kiosk",
    name: "ERTH E-Waste Kiosk",
    operator: "ERTH",
    address: "Level 1 concourse, Subang Parade, Jalan SS 16/1",
    distanceKm: 1.3,
    kind: "neighbourhood",
    accepts: ["e-waste"],
    hours: "10:00 – 22:00 daily",
    alwaysOpen: false,
    mapsQuery: "Subang Parade, Subang Jaya, Selangor",
    coordinates: { lat: 3.086, lng: 101.586 },
    note: "Phones and laptops are data-wiped on site before dismantling.",
  },
  {
    id: "tzuchi-ss14",
    name: "Tzu Chi Recycling Point SS14",
    operator: "Tzu Chi Malaysia",
    address: "Jalan SS 14/2, 47500 Subang Jaya",
    distanceKm: 1.6,
    kind: "neighbourhood",
    accepts: ["paper", "plastics", "glass", "metals", "textiles", "e-waste"],
    hours: "Sat & Sun, 08:00 – 17:00",
    alwaysOpen: false,
    mapsQuery: "Tzu Chi Recycling Point SS14, Subang Jaya, Selangor",
    coordinates: { lat: 3.061, lng: 101.59 },
    note: "Volunteers help you separate items on the spot.",
  },
  {
    id: "ss18-glass-bank",
    name: "SS18 Glass Bank",
    operator: "SS18 Residents Association",
    address: "Dewan Komuniti SS18, Jalan SS 18/6, 47500 Subang Jaya",
    distanceKm: 2.0,
    kind: "neighbourhood",
    accepts: ["glass"],
    hours: "Open 24 hours",
    alwaysOpen: true,
    mapsQuery: "Dewan Komuniti SS18, Subang Jaya, Selangor",
    coordinates: { lat: 3.0884, lng: 101.5741 },
    note: "Bottles and jars only — no mirrors, ceramics or light bulbs.",
  },
  {
    id: "mpsj-centre",
    name: "MPSJ Recycling Centre",
    operator: "Majlis Bandaraya Subang Jaya",
    address: "Jalan Kewajipan, SS13, 47500 Subang Jaya",
    distanceKm: 2.4,
    kind: "centre",
    accepts: ["paper", "plastics", "glass", "metals", "textiles", "e-waste"],
    hours: "Mon – Sat, 08:30 – 17:30",
    alwaysOpen: false,
    mapsQuery: "MPSJ Recycling Centre, Jalan Kewajipan, Subang Jaya, Selangor",
    coordinates: { lat: 3.054, lng: 101.594 },
    note: "Bulk drop-offs above 20 kg are weighed at the counter.",
  },
  {
    id: "mbsj-garden-waste",
    name: "MBSJ Garden Waste Yard",
    operator: "Majlis Bandaraya Subang Jaya",
    address: "Jalan Perusahaan, Taman Perindustrian Subang",
    distanceKm: 2.6,
    kind: "centre",
    accepts: ["organic"],
    hours: "Mon – Sat, 08:00 – 16:00",
    alwaysOpen: false,
    mapsQuery: "Jalan Perusahaan, Taman Perindustrian Subang, Selangor",
    coordinates: { lat: 3.0534, lng: 101.5961 },
    note: "Garden waste and palm fronds only — no cooked food or meat.",
  },
  {
    id: "usj1-scrap-yard",
    name: "Kitar Logam Scrap Yard USJ 1",
    operator: "Kitar Logam Enterprise",
    address: "Jalan USJ 1/6B, 47600 Subang Jaya",
    distanceKm: 3.2,
    kind: "centre",
    accepts: ["metals"],
    hours: "Mon – Sat, 08:30 – 18:00",
    alwaysOpen: false,
    mapsQuery: "Jalan USJ 1/6B, Subang Jaya, Selangor",
    coordinates: { lat: 3.0464, lng: 101.5791 },
    note: "Metal is weighed at the gate and paid out in cash per kilo.",
  },
  {
    id: "alamflora-usj9",
    name: "Alam Flora 3R Centre USJ 9",
    operator: "Alam Flora",
    address: "Jalan USJ 9/5Q, 47620 Subang Jaya",
    distanceKm: 3.8,
    kind: "centre",
    accepts: ["paper", "plastics", "glass", "metals", "e-waste", "organic"],
    hours: "Mon – Sat, 09:00 – 18:00",
    alwaysOpen: false,
    mapsQuery: "Alam Flora 3R Centre USJ 9, Subang Jaya, Selangor",
    coordinates: { lat: 3.0405, lng: 101.588 },
    note: "Accepts large appliances if you book a slot by phone first.",
  },
];

export function formatDistance(distanceKm: number) {
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`;
}
