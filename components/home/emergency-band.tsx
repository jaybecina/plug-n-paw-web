import Link from "next/link";
import { Siren } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HotlineList } from "@/components/emergency/hotline-list";

const signs = [
  "Trouble breathing, or gums that are pale, blue or grey",
  "Collapse, a long or repeated seizure, or cannot stand",
  "Suspected poison: call a vet or a poison hotline now",
  "A hard, swollen belly, or retching with nothing coming up",
  "Hit by a car, or heavy bleeding",
];

export function EmergencyBand() {
  return (
    <section className="grain bg-secondary text-secondary-foreground">
      <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-sev-emergency px-3 py-1 text-sm font-semibold text-sev-emergency-fg">
            <Siren className="size-4" aria-hidden="true" /> Emergency
          </p>
          <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-balance sm:text-4xl">
            If any of these are happening, go now
          </h2>
          <ul className="mt-6 space-y-3">
            {signs.map((sign) => (
              <li key={sign} className="flex gap-3 text-secondary-foreground/90">
                <span
                  aria-hidden="true"
                  className="mt-2 size-2 shrink-0 rounded-full bg-sev-emergency"
                />
                {sign}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/find-vet?locate=1"
              className={buttonVariants({
                size: "lg",
                className: "h-12 rounded-full px-6 text-base",
              })}
            >
              Find an emergency vet near me
            </Link>
            <Link
              href="/emergency"
              className="inline-flex h-12 items-center rounded-full border border-secondary-foreground/30 px-6 font-medium transition-colors hover:bg-secondary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-foreground"
            >
              Read the full guide
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-secondary-foreground/10 p-6 sm:p-8">
          <h3 className="font-heading text-xl font-semibold">
            Think your pet ate poison?
          </h3>
          <HotlineList variant="band" className="mt-4" />
        </div>
      </div>
    </section>
  );
}
