import { financialTrend } from "@/lib/admin-dashboard-data";

export function FinanceChart() {
  const max = Math.max(...financialTrend.revenue);
  return <div><div className="flex h-64 items-end gap-2 border-b border-l border-[#dfe9e1] px-3 pt-4">{financialTrend.revenue.map((revenue, index) => <div key={financialTrend.labels[index]} className="group flex h-full flex-1 items-end gap-1"><div title={`Revenue RM ${revenue}k`} className="w-1/2 rounded-t bg-[#4d9c6c] transition-all group-hover:bg-[#245842]" style={{ height: `${(revenue / max) * 100}%` }} /><div title={`Cost RM ${financialTrend.cost[index]}k`} className="w-1/2 rounded-t bg-[#b9dfbd]" style={{ height: `${(financialTrend.cost[index] / max) * 100}%` }} /></div>)}</div><div className="mt-3 flex justify-between pl-3 text-[9px] text-[#9aae9f]">{financialTrend.labels.map((label) => <span key={label}>{label}</span>)}</div></div>;
}
