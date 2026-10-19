import Image from "next/image";

import { ExternalLinkIcon } from "@/app/components/icons";
import type { TakeBackBrand } from "@/lib/take-back-data";

export function TakeBackBrandCard({ brand }: { brand: TakeBackBrand }) {
  const logoMark = brand.name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <li className="flex gap-3 py-4">
      <div
        aria-hidden="true"
        className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl ${
          brand.logoSrc
            ? ""
            : "bg-white text-xs font-semibold text-leaf-700 ring-1 ring-leaf-200"
        }`}
      >
        {brand.logoSrc ? (
          <Image
            src={brand.logoSrc}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        ) : (
          logoMark
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <h3 className="text-sm font-semibold text-leaf-900">{brand.name}</h3>
          <span className="rounded-full bg-leaf-50 px-2.5 py-1 text-[10px] font-semibold text-leaf-800">
            {brand.reward}
          </span>
        </div>

        <p className="mt-1.5 text-[11px] leading-relaxed text-leaf-700/80">
          {brand.details}
        </p>

        <a
          href={brand.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-orchard-500 px-3.5 text-[11px] font-semibold text-white transition hover:bg-orchard-600 active:scale-95"
        >
          Visit programme
          <ExternalLinkIcon className="h-3.5 w-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </li>
  );
}
