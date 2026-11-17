import Link from "next/link";
import { ArrowRight, MapPin, Siren, Stethoscope, Apple } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";

const tile =
  "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6 transition-shadow hover:shadow-(--shadow-lift) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-8";

export function ToolsBento() {
  return (
    <section className="container-page py-20 sm:py-24">
      <div>
        <SectionHeading
          title="Everything you need, in one place"
          description="Four free tools for the moments when you are not sure what to do next."
        />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-6">
        <div className="lg:col-span-4">
          <Link href="/find-vet" className={cn(tile, "bg-tint-teal min-h-64")}>
            <div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-2xl font-semibold text-secondary">
                Find a vet near you
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Search by city, address or clinic name, or use your location.
                See clinics on a map, ranked by distance.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-secondary">
              Search clinics
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 200 120"
              className="pointer-events-none absolute -right-4 bottom-0 hidden h-40 text-secondary/20 sm:block"
              fill="none"
            >
              <path d="M5 100 C 50 90, 60 40, 110 40 S 170 20, 195 8" stroke="currentColor" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        <div className="lg:col-span-2">
          <Link href="/emergency" className={cn(tile, "bg-sev-emergency text-sev-emergency-fg min-h-64")}>
            <div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sev-emergency-fg/15">
                <Siren className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-2xl font-semibold">
                Emergency help
              </h3>
              <p className="mt-2 opacity-90">
                Warning signs, what to do on the way, and poison hotlines.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold">
              Read now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        </div>

        <div className="lg:col-span-2">
          <Link href="/symptom-checker" className={cn(tile, "bg-tint-clay min-h-64")}>
            <div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Stethoscope className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-2xl font-semibold text-secondary">
                Symptom checker
              </h3>
              <p className="mt-2 text-muted-foreground">
                Answer a few questions and see how urgent it is.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-secondary">
              Start the check
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        </div>

        <div className="lg:col-span-4">
          <Link href="/food-safety" className={cn(tile, "bg-tint-sage min-h-64")}>
            <div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-sev-routine-fg text-sev-routine">
                <Apple className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-heading text-2xl font-semibold text-secondary">
                Can my pet eat this?
              </h3>
              <p className="mt-2 max-w-md text-muted-foreground">
                Look up common foods for dogs and cats: safe, use caution, or
                toxic, with what to do if your pet already ate it.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-secondary">
              Look up a food
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
