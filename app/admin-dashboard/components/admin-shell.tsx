"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { dashboardNavigation } from "@/lib/admin-dashboard-data";
import { Icon } from "./icons";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#f6f8f6] text-[#173328]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-[#12382b] px-5 py-6 text-[#dcebe2] lg:flex">
        <Link href="/admin-dashboard" className="flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#bde86c] text-[#173328]"><Icon name="activity" size={23} strokeWidth={2.4} /></span>
          <span><span className="block text-[17px] font-bold tracking-tight text-white">TownLoop</span><span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9bb9a5]">Developers dashboard</span></span>
        </Link>
        <div className="mt-12"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#789a87]">Workspace</p><nav className="mt-3 space-y-1.5" aria-label="Dashboard sections">{dashboardNavigation.map((item) => { const active = item.href === "/admin-dashboard" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium ${active ? "bg-[#bde86c] text-[#173328]" : "text-[#b0c9b8] hover:bg-white/10 hover:text-white"}`}><Icon name={item.label === "Overview" ? "grid" : item.label === "Township hotspot" ? "map" : item.label === "Collections" ? "box" : item.label === "Financial performance" ? "bar" : "users"} size={18} />{item.label}</Link>; })}</nav></div>
        <div className="mt-auto"><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-white">Data sync</p><span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#bde86c]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#bde86c]" /> LIVE</span></div><p className="mt-2 text-[11px] leading-relaxed text-[#9bb9a5]">Bin sensor data is synced every 5 minutes.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[78%] rounded-full bg-[#bde86c]" /></div><p className="mt-2 text-[10px] text-[#789a87]">Last synced 2 min ago</p></div><div className="mt-5 flex items-center gap-3 border-t border-white/10 px-2 pt-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3bc70] text-xs font-bold text-[#633e1c]">AM</span><span><span className="block text-xs font-semibold text-white">Aisha Malik</span><span className="block text-[10px] text-[#789a87]">Operations lead</span></span></div></div>
      </aside>
      <main className="lg:pl-[248px]"><header className="flex min-h-[82px] items-center justify-between border-b border-[#e4ebe6] bg-white px-6 py-4 md:px-10"><Link href="/admin-dashboard" className="flex items-center gap-2 text-xs text-[#7b9588]"><span>TownLoop</span><span>/</span><span className="font-semibold text-[#173328]">{dashboardNavigation.find((item) => item.href === pathname)?.label ?? "Dashboard"}</span></Link><div className="flex items-center gap-3"><div className="relative hidden items-center md:flex"><Icon name="search" size={17} /><input aria-label="Search dashboard" placeholder="Search anything" className="ml-2 w-40 bg-transparent text-xs outline-none placeholder:text-[#9aae9f]" /></div><button type="button" className="relative rounded-xl p-2.5 text-[#527365] hover:bg-[#f0f5f0]" aria-label="Notifications"><Icon name="bell" size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f06d4f]" /></button><div className="h-8 w-px bg-[#e4ebe6]" /><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3bc70] text-xs font-bold text-[#633e1c]">AM</span></div></header>{children}</main>
    </div>
  );
}
