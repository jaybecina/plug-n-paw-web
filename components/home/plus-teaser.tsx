import Link from "next/link";
import { Check } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const free = [
  "Find a vet worldwide",
  "Symptom checker",
  "Food safety lookup",
  "All care guides",
];
const plus = [
  "Everything in Free",
  "Saved pet profiles",
  "Vet visit and vaccine reminders",
  "24/7 chat with a vet team",
];

export function PlusTeaser() {
  return (
    <section className="container-page py-20 sm:py-24">
      <div>
        <SectionHeading
          title="Free today. Plus is coming."
          description="The tools stay free. Plug N Paw Plus is a planned membership for owners who want more help over time."
        />
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div>
          <div className="h-full rounded-3xl border border-border bg-card p-8">
            <h3 className="font-heading text-xl font-semibold text-secondary">Free</h3>
            <p className="mt-1 text-3xl font-semibold">$0</p>
            <ul className="mt-6 space-y-3">
              {free.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="size-5 text-sev-routine-fg" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="h-full rounded-3xl bg-tint-clay p-8 ring-2 ring-primary/30">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-semibold text-secondary">Plus</h3>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-3xl font-semibold">
              $6<span className="text-base font-normal text-muted-foreground"> /month, planned</span>
            </p>
            <ul className="mt-6 space-y-3">
              {plus.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="size-5 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/plus"
              className="mt-8 inline-flex rounded-full bg-secondary px-6 py-3 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              See what is planned
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
