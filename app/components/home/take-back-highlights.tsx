import Image from "next/image";

import { ArrowRightIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { TakeBackCategory } from "@/lib/take-back-data";

export function TakeBackHighlights({
  categories,
}: {
  categories: TakeBackCategory[];
}) {
  const featured = categories.flatMap((category) =>
    category.brands
      .slice(0, 2)
      .map((brand) => ({ category, brand })),
  );

  return (
    <Section
      title="Take-back campaigns"
      action={
        <a
          href="/take-back"
          className="inline-flex items-center gap-1 text-xs font-medium text-leaf-600"
        >
          See all
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </a>
      }
    >
      <ul
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {featured.map(({ category, brand }) => (
          <li
            key={brand.id}
            className="w-40 shrink-0 snap-start rounded-2xl bg-white p-3.5 ring-1 ring-inset ring-leaf-100"
          >
            {brand.logoSrc && (
              <div className="relative h-8 w-full">
                <Image
                  src={brand.logoSrc}
                  alt={`${brand.name} logo`}
                  fill
                  sizes="160px"
                  className="object-contain object-left"
                />
              </div>
            )}
            <p className={`text-sm font-semibold leading-snug text-leaf-900 ${brand.logoSrc ? "mt-3" : ""}`}>
              {brand.name}
            </p>
            <p className="mt-0.5 text-[11px] text-leaf-700/70">
              {category.title}
            </p>
            <span className="mt-3 inline-block rounded-full bg-leaf-50 px-2.5 py-1 text-[10px] font-semibold text-leaf-800">
              {brand.reward}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
