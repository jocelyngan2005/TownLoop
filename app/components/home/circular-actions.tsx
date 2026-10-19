import { BoxReturnIcon, RecycleIcon } from "@/app/components/icons";
import { Section } from "@/app/components/home/ui";
import type { CircularActions } from "@/lib/home-data";

export function CircularActionsSection({
  actions,
}: {
  actions: CircularActions;
}) {
  const items = [
    {
      value: actions.reusedRepairedDonated,
      label: "Reused, repaired or donated",
      Icon: RecycleIcon,
    },
    {
      value: actions.returnedToRetailers,
      label: "Returned to retailers",
      Icon: BoxReturnIcon,
    },
  ];

  return (
    <Section title="Circular actions">
      <div className="rounded-3xl bg-white p-4 ring-1 ring-leaf-100">
        <ul className="grid grid-cols-2">
          {items.map(({ value, label, Icon }, index) => (
            <li
              key={label}
              className={`min-w-0 ${index === 1 ? "border-l border-leaf-100 pl-4" : "pr-4"}`}
            >
              <Icon className="h-6 w-6 text-orchard-500" />
              <p className="mt-3 text-2xl font-bold leading-none text-leaf-900">
                {value}
              </p>
              <p className="mt-1 text-[11px] leading-tight text-leaf-700/75">
                {label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
