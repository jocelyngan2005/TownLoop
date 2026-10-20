import { Icon, type IconName } from "./icons";

const toneClasses = { green: "bg-[#e3f3e6] text-[#278153]", blue: "bg-[#e4eef9] text-[#4e83b8]", amber: "bg-[#f8edd9] text-[#bb7b22]", purple: "bg-[#eee6f7] text-[#7957a6]" };
export function KpiCard({ label, value, unit, change, note, icon, tone }: { label: string; value: string; unit: string; change: string; note: string; icon: IconName; tone: keyof typeof toneClasses }) {
  return <div className="rounded-2xl border border-[#e6eee8] bg-white p-5 shadow-[0_5px_20px_-18px_rgba(23,51,40,.45)]"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}><Icon name={icon} size={19} /></div><span className="flex items-center gap-1 text-[11px] font-bold text-[#3b9a62]"><Icon name="trend" size={13} />{change}</span></div><p className="mt-4 text-xs font-medium text-[#789186]">{label}</p><p className="mt-1 text-[25px] font-bold tracking-[-0.04em] text-[#173328]">{value}<span className="ml-1 text-sm font-semibold text-[#789186]">{unit}</span></p><p className="mt-1 text-[11px] text-[#9aae9f]">{note}</p></div>;
}
