import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { siteConfig } from "@/lib/site";

const columns = [
  {
    title: "Tools",
    links: [
      { href: "/find-vet", label: "Find a vet" },
      { href: "/symptom-checker", label: "Symptom checker" },
      { href: "/food-safety", label: "Food safety" },
      { href: "/emergency", label: "Emergency help" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/guides", label: "Care guides" },
      { href: "/guides/when-to-see-a-vet", label: "When to see a vet" },
      { href: "/guides/pet-first-aid-kit", label: "Pet first-aid kit" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/plus", label: "Plug N Paw Plus" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="grain bg-secondary text-secondary-foreground">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <SiteLogo />
            <p className="mt-4 text-sm leading-6 text-secondary-foreground/75">
              Free tools for worried pet owners: find a vet, check how urgent
              a symptom is, and look up what&apos;s safe to feed.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-secondary-foreground/75">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-secondary-foreground"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <Link href="/emergency" className="hover:text-secondary-foreground">
                  Poison hotlines for your country
                </Link>
              </li>
            </ul>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="font-heading text-sm font-semibold">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-secondary-foreground/75 transition-colors hover:text-secondary-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 max-w-3xl border-t border-secondary-foreground/15 pt-6 text-xs leading-5 text-secondary-foreground/65">
          {siteConfig.disclaimer} If your pet is in danger, call your nearest
          emergency vet now. Poison hotline numbers depend on your country and
          may charge a fee.
        </p>

        <div className="mt-6 flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-secondary-foreground/60">
            &copy; {year} Plug N Paw. All rights reserved.
          </p>
          <a
            href={siteConfig.kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-sm text-xs text-secondary-foreground/75 transition-colors hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-foreground"
          >
            Help me buy a coffee
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            >
              👉
            </span>
            <span className="font-medium text-secondary-foreground underline decoration-secondary-foreground/40 underline-offset-4 group-hover:decoration-secondary-foreground">
              ko-fi.com/jaybecina
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
