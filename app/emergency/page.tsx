import type { Metadata } from "next";
import Link from "next/link";
import { Ban, Car, Phone, Siren } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pet emergency: signs, first steps and hotlines",
  description:
    "Warning signs that mean go to an emergency vet now, what to do on the way, and US poison hotlines.",
  alternates: { canonical: "/emergency" },
};

const signs = [
  "Any trouble breathing, or open-mouth breathing in a cat",
  "Gums that are pale, white, blue or grey",
  "Collapse, or cannot stand up",
  "A seizure longer than 5 minutes, or more than one in a day (after any single short seizure, call a vet today)",
  "Suspected poison or toxic food: call a vet or a poison hotline right now",
  "A hard, swollen belly, or retching with nothing coming up",
  "Straining to pee with little or nothing coming out (especially a male cat)",
  "Hit by a car, a bad fall, or heavy bleeding",
  "Heatstroke: heavy panting, drooling, weakness in hot weather",
];

const doNow = [
  "Call the nearest emergency vet and tell them you are on your way.",
  "Keep your pet warm, calm and as still as you can. Use a towel or blanket.",
  "Press a clean cloth on any bleeding wound.",
  "Bring the packaging of anything your pet may have eaten.",
  "Ask someone else to drive if you can, so you can stay with your pet.",
];

const dontDo = [
  "Do not make your pet vomit unless a vet or poison hotline tells you to.",
  "Do not give human medicines, including ibuprofen and acetaminophen.",
  "Do not wait to see if it passes when you see the signs above.",
  "Do not use ice-cold water on a pet with heatstroke. Use cool water.",
];

export default function EmergencyPage() {
  return (
    <div>
      <section className="bg-sev-emergency text-sev-emergency-fg">
        <div className="container-page py-12 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-sev-emergency-fg/15 px-3 py-1 text-sm font-semibold">
            <Siren className="size-4" aria-hidden="true" /> Emergency
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-tight text-balance sm:text-5xl">
            If your pet is in danger now, call a vet and go
          </h1>
          <p className="mt-4 max-w-2xl text-lg opacity-95">
            Call your nearest emergency vet and head there. Do not wait for
            more signs. This page tells you what to look for and what to do
            on the way.
          </p>
          <Link
            href="/find-vet?locate=1"
            className={buttonVariants({
              size: "lg",
              className:
                "mt-8 h-12 rounded-full bg-sev-emergency-fg px-6 text-base text-sev-emergency hover:bg-sev-emergency-fg/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sev-emergency-fg",
            })}
          >
            Find an emergency vet near me
          </Link>
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 sm:py-16 lg:grid-cols-2">
        <section>
          <SectionHeading title="Go to an emergency vet now if…" />
          <ul className="mt-6 space-y-3">
            {signs.map((sign) => (
              <li
                key={sign}
                className="flex gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <Siren
                  className="mt-0.5 size-5 shrink-0 text-sev-emergency"
                  aria-hidden="true"
                />
                {sign}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-12">
          <section>
            <SectionHeading title="On the way" />
            <ul className="mt-6 space-y-3">
              {doNow.map((item) => (
                <li key={item} className="flex gap-3">
                  <Car className="mt-1 size-5 shrink-0 text-secondary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading title="What not to do" />
            <ul className="mt-6 space-y-3">
              {dontDo.map((item) => (
                <li key={item} className="flex gap-3">
                  <Ban className="mt-1 size-5 shrink-0 text-sev-emergency" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="bg-tint-teal py-14">
        <div className="container-page">
          <SectionHeading
            title="Poison hotlines"
            description="US services. Fees may apply. Outside the US, call your local vet or emergency clinic."
          />
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {siteConfig.hotlines.map((h) => (
              <li key={h.tel}>
                <a
                  href={h.tel}
                  className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-(--shadow-soft) transition-shadow hover:shadow-(--shadow-lift) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm text-muted-foreground">{h.name}</span>
                    <span className="block font-heading text-xl font-semibold text-secondary">
                      {h.phone}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
            {siteConfig.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
