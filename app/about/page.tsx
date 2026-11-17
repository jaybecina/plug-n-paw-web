import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SectionHeading } from "@/components/section-heading";
import { images } from "@/content/images";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Plug N Paw",
  description:
    "Why Plug N Paw exists, how the tools work, where the data comes from, and what it is built with.",
  alternates: { canonical: "/about" },
};

const stack = [
  "Next.js App Router with statically generated content pages",
  "TypeScript, Tailwind CSS v4 and shadcn/ui",
  "Leaflet map with a server-side Route Handler that keeps the Geoapify key private and caches results for 15 minutes",
  "Rule-based symptom triage as a pure, unit-tested function",
  "Vitest, ESLint and GitHub Actions CI",
];

export default function AboutPage() {
  const credited = Array.from(new Set(Object.values(images).map((i) => i.credit)));

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About" }]} />
      <SectionHeading
        as="h1"
        className="mt-6"
        title="About Plug N Paw"
        description="Free tools for worried pet owners."
      />

      <div className="mt-8 space-y-5 text-lg leading-8">
        <p>
          When something is wrong with your pet, you want three answers fast:
          is this serious, what can I do right now, and where is the nearest
          vet. Plug N Paw puts those answers in one place, with no sign-up.
        </p>
        <p>
          It is an independent project. It is not a veterinary practice and
          does not give veterinary advice.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold text-secondary">How the tools work</h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-lg leading-8 marker:text-primary">
          <li>
            <strong>Find a vet</strong> uses Geoapify, built on OpenStreetMap
            data. Listings can be incomplete or out of date, so call before
            you travel.
          </li>
          <li>
            <strong>Symptom checker</strong> follows fixed rules. Warning
            signs always lead to an emergency result. The rules are cautious
            and have not been reviewed by a veterinarian.
          </li>
          <li>
            <strong>Food safety and guides</strong> are written for general
            guidance and kept deliberately conservative.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold text-secondary">Built with</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 marker:text-primary">
          {stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-3xl bg-tint-butter p-6">
        <h2 className="font-heading text-xl font-semibold text-secondary">Medical disclaimer</h2>
        <p className="mt-2 leading-7">
          {siteConfig.disclaimer} If your pet is in danger, call your nearest
          emergency vet now.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold text-secondary">Credits and contact</h2>
        <p className="mt-2 text-muted-foreground">
          Photography: {credited.join(", ")} (Unsplash License). Map tiles ©
          OpenStreetMap contributors. Questions:{" "}
          <a className="underline underline-offset-4" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
