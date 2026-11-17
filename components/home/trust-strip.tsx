import { Apple, Globe, HeartHandshake, Smartphone, Stethoscope } from "lucide-react";
import { getFoods } from "@/lib/foods";
import { SYMPTOMS } from "@/lib/triage/symptoms";

export function TrustStrip() {
  const items = [
    { icon: HeartHandshake, label: "Free, no sign-up" },
    { icon: Globe, label: "Clinic search worldwide" },
    { icon: Apple, label: `${getFoods().length} foods checked` },
    { icon: Stethoscope, label: `${SYMPTOMS.length} symptoms covered` },
    { icon: Smartphone, label: "Built for your phone" },
  ];
  return (
    <section aria-label="At a glance" className="border-y border-border bg-card">
      <ul className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2 text-sm font-medium text-secondary"
          >
            <Icon className="size-4 text-primary" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
