import type { Metadata } from "next";
import { EmergencyBand } from "@/components/home/emergency-band";
import { Faq } from "@/components/home/faq";
import { FinalCta } from "@/components/home/final-cta";
import { FoodSection } from "@/components/home/food-section";
import { GuidesPreview } from "@/components/home/guides-preview";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PlusTeaser } from "@/components/home/plus-teaser";
import { SymptomSection } from "@/components/home/symptom-section";
import { ToolsBento } from "@/components/home/tools-bento";
import { TrustStrip } from "@/components/home/trust-strip";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — find a vet, check symptoms, food safety` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
              email: siteConfig.email,
            },
            {
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.url,
              description: siteConfig.description,
            },
          ],
        }}
      />
      <Hero />
      <TrustStrip />
      <ToolsBento />
      <HowItWorks />
      <SymptomSection />
      <FoodSection />
      <GuidesPreview />
      <EmergencyBand />
      <PlusTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
