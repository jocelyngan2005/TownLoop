import { Card, Section } from "@/app/components/home/ui";
import type { ProfileDetails } from "@/lib/profile-data";

export function AccountDetails({ details }: { details: ProfileDetails }) {
  const rows = [
    { label: "Email", value: details.email },
    { label: "Phone", value: details.phone },
    { label: "Household", value: `${details.householdSize} residents` },
    { label: "Member since", value: details.memberSince },
    { label: "Membership ID", value: details.membershipId },
  ];

  return (
    <Section title="Details">
      <Card>
        <dl className="divide-y divide-leaf-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <dt className="text-xs text-leaf-700/75">{row.label}</dt>
              <dd className="truncate text-xs font-medium text-leaf-900">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </Section>
  );
}
