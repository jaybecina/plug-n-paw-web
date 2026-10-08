import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";

const siteLinks = [
  { href: "/", label: "Home" },
  { href: "/find-vet", label: "Find a vet" },
];

const KOFI_URL = "https://ko-fi.com/jaybecina";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="max-w-sm">
            <SiteLogo />
            <p className="mt-4 text-sm leading-6 text-secondary-foreground/70">
              A faster way to find veterinary care near you — search by
              address, city, or clinic name and see what&apos;s closest.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-sm font-semibold">Site</h2>
            <ul className="mt-4 space-y-3">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-foreground/70 transition-colors hover:text-secondary-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-sm font-semibold">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <a
                  href="mailto:hello@plugnpaw.com"
                  className="transition-colors hover:text-secondary-foreground"
                >
                  hello@plugnpaw.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>Serving clinics near you</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse items-center gap-4 border-t border-secondary-foreground/15 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-secondary-foreground/60">
            &copy; {year} Plug N Paw. All rights reserved.
          </p>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 rounded-sm text-xs text-secondary-foreground/70 transition-colors hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-foreground"
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
