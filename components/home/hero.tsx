import Image from "next/image";
import Link from "next/link";
import { Apple, MapPin, Siren, Stethoscope } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { SeverityBadge } from "@/components/severity-badge";
import { VerdictBadge } from "@/components/food/verdict-badge";
import { images } from "@/content/images";
import { siteConfig } from "@/lib/site";

const chips = [
  { href: "/symptom-checker", label: "Check a symptom", icon: Stethoscope },
  { href: "/food-safety", label: "Can my pet eat…?", icon: Apple },
  { href: "/emergency", label: "Emergency help", icon: Siren, danger: true },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-tint-clay blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 top-40 size-[26rem] rounded-full bg-tint-teal blur-3xl"
      />

      <div className="container-page relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24">
        <div>
          <h1 className="font-heading text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-[1.02] tracking-tight text-balance text-secondary">
            {siteConfig.tagline}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
            Find a vet nearby, check how urgent a symptom is, and see what is
            safe to feed. Free, with no sign-up.
          </p>

          <div className="mt-8">
            <HeroSearch />
          </div>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {chips.map(({ href, label, icon: Icon, danger }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    danger
                      ? "inline-flex items-center gap-2 rounded-full bg-sev-emergency/10 px-4 py-2 text-sm font-medium text-sev-emergency transition-colors hover:bg-sev-emergency/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      : "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  }
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative mx-auto aspect-[4/5] w-[82%] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] bg-tint-teal shadow-(--shadow-lift) lg:w-[78%]">
            <Image
              src={images.heroDog.src}
              alt={images.heroDog.alt}
              fill
              priority
              sizes="(min-width: 1024px) 36vw, 80vw"
              className="object-cover"
            />
          </div>

          <div className="float-slow absolute -left-1 top-[58%] w-60 rounded-2xl border border-border bg-card p-4 shadow-(--shadow-lift) sm:-left-6">
            <p className="text-xs font-medium text-muted-foreground">
              Example result
            </p>
            <p className="mt-1 font-heading text-base font-semibold">
              Nearest clinic
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              0.7 km away · open in Maps
            </p>
          </div>

          <div className="float-slower absolute -right-1 top-[10%] w-56 rounded-2xl border border-border bg-card p-4 shadow-(--shadow-lift) sm:-right-4">
            <p className="text-xs font-medium text-muted-foreground">
              Symptom check
            </p>
            <p className="mt-1 text-sm font-medium">Cat not eating, 2 days</p>
            <SeverityBadge severity="urgent" className="mt-2 text-xs" />
          </div>

          <div className="absolute bottom-3 right-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-(--shadow-soft) sm:right-6">
            <span className="text-sm font-medium">Grapes</span>
            <VerdictBadge verdict="toxic" species="dog" />
          </div>
        </div>
      </div>
    </section>
  );
}
