import { Card, Section } from "@/app/components/home/ui";
import type { MonthlyImpact, WasteSource } from "@/lib/home-data";

function WastePieChart({ sources }: { sources: WasteSource[] }) {
  const totalWeight = sources.reduce((total, source) => total + source.weightKg, 0);
  const outerRadius = 70;
  const innerRadius = 47;
  const center = 80;
  const { slices } = sources.reduce<{
    startAngle: number;
    slices: Array<WasteSource & { path: string }>;
  }>(
    (result, source) => {
      const sweepAngle = (source.weightKg / totalWeight) * 360;
      const endAngle = result.startAngle + sweepAngle;
      const startRadians = (result.startAngle * Math.PI) / 180;
      const endRadians = (endAngle * Math.PI) / 180;
      const startOuterX = center + outerRadius * Math.cos(startRadians);
      const startOuterY = center + outerRadius * Math.sin(startRadians);
      const endOuterX = center + outerRadius * Math.cos(endRadians);
      const endOuterY = center + outerRadius * Math.sin(endRadians);
      const endInnerX = center + innerRadius * Math.cos(endRadians);
      const endInnerY = center + innerRadius * Math.sin(endRadians);
      const startInnerX = center + innerRadius * Math.cos(startRadians);
      const startInnerY = center + innerRadius * Math.sin(startRadians);
      const largeArc = sweepAngle > 180 ? 1 : 0;
      const path = `M ${startOuterX} ${startOuterY} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuterX} ${endOuterY} L ${endInnerX} ${endInnerY} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInnerX} ${startInnerY} Z`;

      return {
        startAngle: endAngle,
        slices: [...result.slices, { ...source, path }],
      };
    },
    { startAngle: -90, slices: [] },
  );

  return (
    <div
      role="img"
      aria-label={`Verified waste: ${totalWeight.toFixed(1)} kilograms total. ${sources
        .map((source) => `${source.name}, ${source.weightKg.toFixed(1)} kilograms`)
        .join("; ")}`}
      className="relative mx-auto h-40 w-40 shrink-0"
    >
      <svg viewBox="0 0 160 160" aria-hidden="true" className="h-full w-full">
        {slices.map((slice) => (
          <path
            key={slice.id}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none text-leaf-900">
          {totalWeight.toFixed(1)} kg
        </span>
        <span className="mt-1 text-[10px] text-leaf-700/75">verified</span>
      </div>
    </div>
  );
}

export function MonthlyImpactSection({ impact }: { impact: MonthlyImpact }) {
  return (
    <div id="activity" className="scroll-mt-5">
      <Section
        title="This month's impact"
        action={
          <span className="text-xs font-medium text-leaf-700/70">
            {impact.monthLabel}
          </span>
        }
      >
        <Card>
        <div>
          <h3 className="mb-3 text-xs font-semibold text-leaf-800">
            Verified by waste source
          </h3>
          <WastePieChart sources={impact.wasteSources} />
          <ul className="mt-3 divide-y divide-leaf-100">
            {impact.wasteSources.map((source) => (
              <li key={source.id} className="py-1.5">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-leaf-900">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: source.color }}
                      />
                      <span>{source.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-leaf-700">
                      {source.weightKg.toFixed(1)} kg
                    </span>
                  </summary>
                  <p className="pb-1 pt-2 pl-[18px] text-[11px] leading-relaxed text-leaf-700/75">
                    {source.description}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>

        </Card>
      </Section>
    </div>
  );
}
