import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Plug N Paw Plus (coming soon)",
  description:
    "The tools stay free. Plus is a planned membership with saved pet profiles, reminders and vet chat.",
  alternates: { canonical: "/plus" },
};

const rows = [
  { feature: "Find a vet worldwide", free: true, plus: true },
  { feature: "Symptom checker", free: true, plus: true },
  { feature: "Food safety lookup and care guides", free: true, plus: true },
  { feature: "Saved pet profiles", free: false, plus: true },
  { feature: "Vet visit and vaccine reminders", free: false, plus: true },
  { feature: "24/7 chat with a vet team", free: false, plus: true },
];

const faq = [
  {
    q: "Can I sign up for Plus today?",
    a: "Not yet. Plus is planned, not built. Email us and we will tell you if it launches.",
  },
  {
    q: "Will the free tools stay free?",
    a: "Yes. Find a vet, the symptom checker, food safety and guides are meant to stay free for everyone.",
  },
  {
    q: "Is the price final?",
    a: "No. $6 a month is a planned price and may change.",
  },
];

const mailto = `mailto:${siteConfig.email}?subject=${encodeURIComponent("Plug N Paw Plus waitlist")}`;

export default function PlusPage() {
  return (
    <div className="container-page max-w-4xl py-12 sm:py-16">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Plus" }]} />
      <SectionHeading
        as="h1"
        className="mt-6"
        title="Plug N Paw Plus"
        description="A planned membership for owners who want more help over time. Not available yet."
      />

      <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card">
        <table className="w-full text-left">
          <caption className="sr-only">Free compared with Plus</caption>
          <thead className="bg-muted text-sm">
            <tr>
              <th scope="col" className="p-4 font-semibold">Feature</th>
              <th scope="col" className="p-4 font-semibold">Free · $0</th>
              <th scope="col" className="p-4 font-semibold">Plus · $6/month planned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t border-border">
                <th scope="row" className="p-4 font-medium">{row.feature}</th>
                {[row.free, row.plus].map((on, i) => (
                  <td key={i} className="p-4">
                    {on ? (
                      <>
                        <Check className="size-5 text-sev-routine-fg" aria-hidden="true" />
                        <span className="sr-only">Included</span>
                      </>
                    ) : (
                      <>
                        <Minus className="size-5 text-muted-foreground" aria-hidden="true" />
                        <span className="sr-only">Not included</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-3xl bg-tint-clay p-8">
        <h2 className="font-heading text-2xl font-semibold text-secondary">Want to hear if it launches?</h2>
        <p className="mt-2 text-muted-foreground">
          Send us a quick email. We do not collect addresses on this site.
        </p>
        <a
          href={mailto}
          className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Email us to join the list
        </a>
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold text-secondary">Questions</h2>
        <dl className="mt-4 space-y-5">
          {faq.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
