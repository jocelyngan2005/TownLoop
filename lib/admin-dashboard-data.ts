export const dashboardNavigation = [
  { label: "Overview", href: "/admin-dashboard" },
  { label: "Township hotspot", href: "/admin-dashboard/township-hotspot" },
  { label: "Collections", href: "/admin-dashboard/collections" },
  { label: "Financial performance", href: "/admin-dashboard/financial-performance" },
  { label: "Partners & rewards", href: "/admin-dashboard/partners-rewards" },
] as const;

export const dashboardKpis = [
  { label: "Total recyclables", value: "12,480", unit: "kg", change: "+18.6%", note: "vs previous period", icon: "box", tone: "green" },
  { label: "Collection efficiency", value: "87.4", unit: "%", change: "+4.2%", note: "above target", icon: "route", tone: "blue" },
  { label: "Net revenue", value: "RM 48.2k", unit: "", change: "+12.8%", note: "vs previous period", icon: "trend", tone: "amber" },
  { label: "Carbon avoided", value: "8.6", unit: "tCO₂e", change: "+21.4%", note: "this period", icon: "co2", tone: "purple" },
] as const;

export const hotspots = [
  { name: "Taman Bukit Indah", capacity: 82, bins: 8, lastCollection: "Today, 08:42", nextCollection: "In 4 hours", latitude: 31, longitude: 26 },
  { name: "Bandar Baru", capacity: 68, bins: 12, lastCollection: "Today, 09:18", nextCollection: "In 7 hours", latitude: 27, longitude: 57 },
  { name: "Kampung Mutiara", capacity: 41, bins: 6, lastCollection: "Yesterday, 16:10", nextCollection: "Tomorrow, 09:00", latitude: 65, longitude: 48 },
] as const;

export const collectionTrucks = [
  { id: "TL-07", driver: "R. Kumar", capacity: "2.4 t", availability: "Available" },
  { id: "TL-12", driver: "S. Lim", capacity: "3.0 t", availability: "Available" },
  { id: "TL-03", driver: "N. Farah", capacity: "1.8 t", availability: "On route" },
] as const;

export const collectionTrend = {
  labels: ["1 Oct", "3 Oct", "5 Oct", "7 Oct", "9 Oct", "11 Oct", "13 Oct", "15 Oct", "17 Oct", "19 Oct", "21 Oct"],
  collected: [620, 780, 710, 940, 870, 1050, 920, 1120, 1010, 1210, 1180],
  target: [700, 740, 760, 800, 840, 880, 920, 960, 1000, 1040, 1080],
} as const;

export const collectionRecords = [
  { date: "21 Oct 2026", route: "North loop", township: "Taman Bukit Indah", material: "Mixed recyclables", weight: "486 kg", status: "Completed", driver: "R. Kumar" },
  { date: "21 Oct 2026", route: "Central loop", township: "Bandar Baru", material: "Plastic", weight: "328 kg", status: "In transit", driver: "S. Lim" },
  { date: "20 Oct 2026", route: "South loop", township: "Kampung Mutiara", material: "Paper & cardboard", weight: "214 kg", status: "Completed", driver: "N. Farah" },
  { date: "20 Oct 2026", route: "East loop", township: "Taman Bukit Indah", material: "Glass", weight: "172 kg", status: "Completed", driver: "A. Wong" },
] as const;

export const partners = [
  { name: "EcoMart", category: "Retail partner", campaigns: 12, sales: "RM 84.2k", score: 94, badge: "Top partner", initials: "EM" },
  { name: "GreenCycle", category: "Recycling partner", campaigns: 8, sales: "RM 61.8k", score: 87, badge: "Impact leader", initials: "GC" },
  { name: "Bumi Living", category: "Retail partner", campaigns: 6, sales: "RM 42.5k", score: 76, badge: "Rising star", initials: "BL" },
  { name: "Refill Co.", category: "Campaign partner", campaigns: 4, sales: "RM 28.9k", score: 69, badge: "New partner", initials: "RC" },
] as const;

export const financialTrend = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
  revenue: [42, 46, 44, 51, 55, 60, 58, 67, 71, 76],
  cost: [25, 26, 24, 27, 29, 31, 30, 32, 34, 28],
} as const;
