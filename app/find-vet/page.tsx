import type { Metadata } from "next";
import { VetSearch } from "@/components/find-vet/vet-search";

export const metadata: Metadata = {
  title: "Find a Vet Near You | Plug N Paw",
  description:
    "Search nearby veterinary clinics by address, city, clinic name, or your current location.",
};

export default function FindVetPage() {
  return <VetSearch />;
}

