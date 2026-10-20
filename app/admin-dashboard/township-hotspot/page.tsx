import { PageHeader } from "../components/page-header";
import { HotspotMap } from "../components/hotspot-map";
import { hotspots } from "@/lib/admin-dashboard-data";
import { RoutePlanner } from "../components/route-planner";

export default function TownshipHotspotPage() {
  return <div className="mx-auto max-w-[1536px] px-6 py-8 md:px-10"><PageHeader eyebrow="Operations / Township hotspot" title="Township hotspot" description="Monitor bin loads, identify capacity gaps, and plan lower-carbon collection routes." action="Export hotspot report" /><div className="mt-8"><HotspotMap /></div><div className="mt-6"><RoutePlanner /></div><div className="mt-6 grid gap-4 md:grid-cols-3">{hotspots.map((spot) => <div key={spot.name} className="rounded-2xl border border-[#e6eee8] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-bold">{spot.name}</p><p className="mt-1 text-[11px] text-[#8ba095]">{spot.bins} bins monitored</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${spot.capacity >= 75 ? "bg-[#fff0e7] text-[#c26945]" : "bg-[#edf7e9] text-[#398153]"}`}>{spot.capacity >= 75 ? "Needs attention" : "Healthy"}</span></div><p className="mt-6 text-2xl font-bold">{spot.capacity}%</p><p className="mt-1 text-[11px] text-[#789186]">average capacity used</p></div>)}</div></div>;
}
