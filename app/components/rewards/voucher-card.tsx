import { CheckIcon, TicketIcon } from "@/app/components/icons";
import type { Voucher } from "@/lib/rewards-data";

export function VoucherCard({
  voucher,
  highlighted = false,
}: {
  voucher: Voucher;
  highlighted?: boolean;
}) {
  const used = voucher.status === "used";

  return (
    <li
      className={`py-4 ${highlighted ? "bg-leaf-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-orchard-500">
            {voucher.partner}
          </p>
          <h3
            className={`mt-0.5 text-sm font-semibold ${
              used ? "text-leaf-700/60" : "text-leaf-900"
            }`}
          >
            {voucher.title}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            used ? "bg-leaf-100 text-leaf-700/70" : "bg-leaf-500 text-white"
          }`}
        >
          {used ? <CheckIcon className="h-3 w-3" /> : <TicketIcon className="h-3 w-3" />}
          {used ? "Used" : "Active"}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-leaf-200 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-leaf-700/60">
            Code
          </p>
          <p
            className={`font-mono text-sm font-semibold tracking-[0.12em] ${
              used ? "text-leaf-700/55 line-through" : "text-leaf-900"
            }`}
          >
            {voucher.code}
          </p>
        </div>
        <p className="text-right text-[10px] leading-tight text-leaf-700/70">
          {voucher.value}
          <br />
          {used ? "Used on" : "Valid until"} {voucher.expiresOn}
        </p>
      </div>
    </li>
  );
}
