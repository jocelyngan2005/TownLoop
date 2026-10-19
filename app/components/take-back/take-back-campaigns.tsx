"use client";

import { useState } from "react";

import { TakeBackBrandCard } from "@/app/components/take-back/take-back-category";
import type { TakeBackCategory } from "@/lib/take-back-data";

type CategoryFilter = TakeBackCategory["id"] | "all";

export function TakeBackCampaigns({
  categories,
}: {
  categories: TakeBackCategory[];
}) {
  const [selected, setSelected] = useState<CategoryFilter>("all");
  const visibleCategories =
    selected === "all"
      ? categories
      : categories.filter((category) => category.id === selected);
  const visibleBrands = visibleCategories.flatMap((category) => category.brands);

  return (
    <main className="flex flex-col gap-6 pt-3">
      <nav
        aria-label="Filter take-back campaigns"
        className="overflow-x-auto px-5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex w-max snap-x snap-mandatory flex-nowrap gap-2">
          {[
            { id: "all" as const, label: "All" },
            ...categories.map((category) => ({
              id: category.id,
              label: category.title,
            })),
          ].map((filter) => (
            <li key={filter.id}>
              <button
                type="button"
                aria-pressed={selected === filter.id}
                onClick={() => setSelected(filter.id)}
                className={`snap-start whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium transition ${
                  selected === filter.id
                    ? "bg-leaf-800 text-white"
                    : "bg-white text-leaf-700 ring-1 ring-leaf-100"
                }`}
              >
                {filter.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="divide-y divide-leaf-200 px-5">
        {visibleBrands.map((brand) => (
          <TakeBackBrandCard key={brand.id} brand={brand} />
        ))}
      </ul>

      <p className="px-5 text-[10px] leading-relaxed text-leaf-700/60">
        Programme terms, rewards and participating outlets are set by each
        retailer and may change. Check the brand&apos;s own page before you
        travel.
      </p>
    </main>
  );
}
