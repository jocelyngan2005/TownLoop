import { Icon } from "./icons";

export function PageHeader({ eyebrow, title, description, action = "Export report" }: { eyebrow: string; title: string; description: string; action?: string }) {
  return <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-medium text-[#67917b]">{eyebrow}</p><h1 className="mt-1 text-[30px] font-bold tracking-[-0.04em] text-[#173328]">{title}</h1><p className="mt-1 text-sm text-[#789186]">{description}</p></div><button type="button" className="flex w-fit items-center gap-2 rounded-xl bg-[#173f30] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#245842]"><Icon name="download" size={15} /> {action}</button></div>;
}
