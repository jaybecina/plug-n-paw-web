import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GuideList } from "@/components/guides/guide-list";
import { SectionHeading } from "@/components/section-heading";
import { getGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Pet care guides",
  description:
    "Plain-language guides for dog and cat owners: new pet checklists, vaccines, dental care, hot weather, first aid, and when to see a vet.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Guides" }]} />
      <SectionHeading
        as="h1"
        className="mt-6"
        title="Pet care guides"
        description="Practical answers in plain language, from the first week with a new pet to knowing when a vet visit cannot wait."
      />
      <div className="mt-10">
        <GuideList guides={getGuides()} />
      </div>
    </div>
  );
}
