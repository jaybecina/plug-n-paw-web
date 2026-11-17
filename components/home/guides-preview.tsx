import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GuideCard } from "@/components/guides/guide-card";
import { SectionHeading } from "@/components/section-heading";
import { getGuides } from "@/lib/guides";

export function GuidesPreview() {
  const guides = getGuides().slice(0, 4);
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionHeading
            title="Care guides, in plain language"
            description="Practical answers from the first week with a new pet to when a vet visit cannot wait."
          />
        </div>
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 rounded-md font-semibold text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          All guides <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <div className="h-full">
              <GuideCard guide={guide} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
