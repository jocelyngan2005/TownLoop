"use client";

import { useMemo, useState } from "react";
import { collectionTrucks, hotspots } from "@/lib/admin-dashboard-data";
import { Icon } from "./icons";

type Shift = "Morning" | "Afternoon";

export function RoutePlanner() {
  const [truckId, setTruckId] = useState<string>(collectionTrucks[0].id);
  const [shift, setShift] = useState<Shift>("Morning");
  const [optimized, setOptimized] = useState(false);
  const [included, setIncluded] = useState<string[]>(hotspots.map((spot) => spot.name));

  const truck = collectionTrucks.find((item) => item.id === truckId) ?? collectionTrucks[0];
  const stops = useMemo(() => {
    const selected = hotspots.filter((spot) => included.includes(spot.name));
    return [...selected].sort((a, b) => b.capacity - a.capacity);
  }, [included]);
  const estimatedWeight = stops.reduce((total, spot) => total + spot.bins * 42, 0);
  const routeDistance = stops.length === 3 ? (optimized ? 18 : 25) : stops.length === 2 ? 14 : 8;
  const routeDuration = stops.length === 3 ? (optimized ? "1h 42m" : "2h 18m") : stops.length === 2 ? "1h 16m" : "42m";

  function toggleStop(name: string) {
    setIncluded((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
    setOptimized(false);
  }

  return <section className="overflow-hidden rounded-2xl border border-[#dceadf] bg-white shadow-[0_8px_28px_-22px_rgba(23,51,40,.55)]">
    <div className="flex flex-col justify-between gap-4 border-b border-[#edf2ee] bg-[#f6fbf5] px-5 py-5 md:flex-row md:items-center">
      <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dcefd9] text-[#398153]"><Icon name="route" size={18} /></span><div><h2 className="text-[16px] font-bold">Organise a truck route</h2><p className="mt-1 text-xs text-[#789186]">Prioritise collection stops from live township capacity.</p></div></div></div>
      <span className="rounded-full bg-[#e7f4e8] px-2.5 py-1 text-[10px] font-bold text-[#398153]">Capacity-based planning</span>
    </div>
    <div className="grid lg:grid-cols-[1fr_280px]">
      <div className="p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[11px] font-semibold text-[#527365]">Truck and driver<select value={truckId} onChange={(event) => setTruckId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dfe9e1] bg-white px-3 py-2.5 text-xs font-medium text-[#173328] outline-none"><option value={collectionTrucks[0].id}>TL-07 · R. Kumar · 2.4 t</option><option value={collectionTrucks[1].id}>TL-12 · S. Lim · 3.0 t</option><option value={collectionTrucks[2].id}>TL-03 · N. Farah · 1.8 t</option></select></label>
          <label className="text-[11px] font-semibold text-[#527365]">Collection shift<select value={shift} onChange={(event) => setShift(event.target.value as Shift)} className="mt-2 w-full rounded-lg border border-[#dfe9e1] bg-white px-3 py-2.5 text-xs font-medium text-[#173328] outline-none"><option>Morning</option><option>Afternoon</option></select></label>
        </div>
        <div className="mt-6 flex items-center justify-between"><div><p className="text-xs font-bold">Priority stops</p><p className="mt-1 text-[11px] text-[#8ba095]">Stops are ranked by bin capacity and demand.</p></div><button type="button" onClick={() => setIncluded(hotspots.map((spot) => spot.name))} className="text-[11px] font-bold text-[#398153]">Select all</button></div>
        <div className="mt-3 space-y-2">{stops.map((spot, index) => <div key={spot.name} className="flex items-center gap-3 rounded-xl border border-[#e7efe8] px-3 py-3"><button type="button" onClick={() => toggleStop(spot.name)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#78a982] bg-[#e7f4e8] text-[10px] font-bold text-[#398153]" aria-label={`Remove ${spot.name} from route`}>✓</button><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eff7ee] text-[11px] font-bold text-[#398153]">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold">{spot.name}</p><p className="mt-0.5 text-[10px] text-[#8ba095]">{spot.bins} bins · {spot.capacity}% full · {spot.nextCollection}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${spot.capacity >= 75 ? "bg-[#fff0e7] text-[#c26945]" : "bg-[#fff5dc] text-[#aa7620]"}`}>{spot.capacity}%</span></div>)}</div>
        {stops.length === 0 && <p className="mt-3 rounded-xl bg-[#fff8e9] p-4 text-xs text-[#aa7620]">Select at least one township to build a route.</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-[#789186]">The planner will sequence the highest-demand stop first and reduce backtracking.</p><button type="button" disabled={stops.length === 0} onClick={() => setOptimized(true)} className="flex items-center gap-2 rounded-lg bg-[#173f30] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#245842] disabled:cursor-not-allowed disabled:opacity-40"><Icon name="route" size={14} /> {optimized ? "Route optimized" : "Optimize route"}</button></div>
      </div>
      <div className="border-t border-[#edf2ee] bg-[#fbfdfb] p-5 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8ba095]">{optimized ? "Recommended route" : "Route estimate"}</p><h3 className="mt-2 text-lg font-bold">{shift} collection</h3><p className="mt-1 text-[11px] text-[#789186]">{truck.id} · {truck.driver} · {truck.capacity}</p><div className="mt-6 space-y-4"><div className="flex justify-between text-xs"><span className="text-[#789186]">Stops</span><strong>{stops.length} townships</strong></div><div className="flex justify-between text-xs"><span className="text-[#789186]">Estimated weight</span><strong>{estimatedWeight} kg</strong></div><div className="flex justify-between text-xs"><span className="text-[#789186]">Distance</span><strong>{routeDistance} km</strong></div><div className="flex justify-between text-xs"><span className="text-[#789186]">Driving time</span><strong>{routeDuration}</strong></div></div><div className="mt-6 rounded-xl bg-[#e7f4e8] p-3"><p className="text-[10px] font-bold text-[#398153]">{optimized ? "Low-carbon route selected" : "Potential route saving"}</p><p className="mt-1 text-[11px] leading-relaxed text-[#527365]">{optimized ? "This sequence removes 7 km of unnecessary travel compared with the current route." : "Optimize the route to calculate a lower-carbon sequence."}</p></div>{optimized && <button type="button" onClick={() => setOptimized(false)} className="mt-4 w-full rounded-lg border border-[#cfe0d2] py-2 text-[11px] font-bold text-[#398153]">Edit route</button>}</div>
    </div>
  </section>;
}
