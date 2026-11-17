import type { Metadata } from "next";
import { Suspense } from "react";
import { SymptomChecker } from "@/components/symptom-checker/checker";
import { SectionHeading } from "@/components/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pet symptom checker: how urgent is it?",
  description:
    "Answer a few questions about your dog or cat and see whether it is routine, worth a vet visit soon, urgent, or an emergency.",
  alternates: { canonical: "/symptom-checker" },
};

export default function SymptomCheckerPage() {
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <SectionHeading
        as="h1"
        title="Pet symptom checker"
        description="Answer a few questions to see how urgent your pet's symptom is."
      />
      <p className="mt-4 rounded-2xl bg-tint-butter p-4 text-sm leading-6">
        {siteConfig.disclaimer} These rules lean toward caution and have not
        been reviewed by a veterinarian. If you are worried, call a vet.
        Nothing you enter here is saved.
      </p>
      <div className="mt-10">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <SymptomChecker />
        </Suspense>
      </div>
    </div>
  );
}
