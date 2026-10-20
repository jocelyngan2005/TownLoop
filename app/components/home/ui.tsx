import type { ReactNode } from "react";

export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-5 ${className}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-leaf-900">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`motion-card rounded-3xl bg-white p-4 shadow-[0_8px_24px_-16px_rgba(16,40,29,0.45)] ring-1 ring-leaf-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  trackClassName = "bg-leaf-100",
  barClassName = "bg-leaf-500",
}: {
  value: number;
  max: number;
  label: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`h-2 w-full overflow-hidden rounded-full ${trackClassName}`}
    >
      <div
        className={`h-full rounded-full ${barClassName}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Stat({
  value,
  label,
  className = "",
}: {
  value: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-leaf-50 px-3 py-2.5 ${className}`}>
      <p className="text-lg font-semibold leading-tight text-leaf-900">{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-leaf-700/80">{label}</p>
    </div>
  );
}
