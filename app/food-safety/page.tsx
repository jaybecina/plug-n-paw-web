import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FoodExplorer } from "@/components/food/food-explorer";
import { SectionHeading } from "@/components/section-heading";
import { getFoods } from "@/lib/foods";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Can my dog or cat eat it? Pet food safety",
  description:
    "Look up common foods for dogs and cats: safe, use caution, or toxic, with warning signs and what to do if your pet already ate it.",
  alternates: { canonical: "/food-safety" },
};

export default function FoodSafetyPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Food safety" }]} />
      <SectionHeading
        as="h1"
        className="mt-6"
        title="Can my dog or cat eat that?"
        description="Look up common foods. If your pet already ate something toxic, call your vet or a poison hotline right away."
      />
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{siteConfig.disclaimer}</p>
      <div className="mt-10">
        <FoodExplorer foods={getFoods()} />
      </div>
    </div>
  );
}
