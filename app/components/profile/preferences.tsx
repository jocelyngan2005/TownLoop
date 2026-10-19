"use client";

import { useState } from "react";

import { Card, Section } from "@/app/components/home/ui";
import type { PreferenceSetting } from "@/lib/profile-data";

export function Preferences({ settings }: { settings: PreferenceSetting[] }) {
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(settings.map((item) => [item.id, item.enabled])),
  );

  return (
    <Section title="Notifications & privacy">
      <Card>
        <ul className="divide-y divide-leaf-100">
          {settings.map((setting) => {
            const isOn = enabled[setting.id];

            return (
              <li
                key={setting.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-leaf-900">
                    {setting.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-leaf-700/70">
                    {setting.description}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={setting.label}
                  onClick={() =>
                    setEnabled((current) => ({
                      ...current,
                      [setting.id]: !current[setting.id],
                    }))
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    isOn ? "bg-leaf-500" : "bg-leaf-100"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                      isOn ? "left-[1.375rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </Section>
  );
}
