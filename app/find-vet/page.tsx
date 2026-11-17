import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VetSearch } from "@/components/find-vet/vet-search";

export const metadata: Metadata = {
  title: "Find a vet near you",
  alternates: { canonical: "/find-vet" },
  description:
    "Search nearby veterinary clinics by address, city, clinic name, or your current location.",
};

export default function FindVetPage() {
  return (
    <Suspense
      fallback={<Skeleton className="h-[calc(100dvh-4rem)] w-full rounded-none" />}
    >
      <VetSearch />
    </Suspense>
  );
}

