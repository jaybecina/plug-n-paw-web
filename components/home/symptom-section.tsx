import { SectionHeading } from "@/components/section-heading";
import { SymptomTeaser } from "@/components/home/symptom-teaser";

export function SymptomSection() {
  return (
    <section className="container-page grid items-center gap-10 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
      <div>
        <SectionHeading
          title="Not sure if it is serious?"
          description="Pick a symptom to see where it starts on the scale. The full check asks about warning signs and how long it has lasted, then tells you what to do next."
        />
        <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground">
          Our rules lean toward caution. They are not reviewed by a
          veterinarian and never replace a vet&apos;s advice.
        </p>
      </div>
      <div>
        <SymptomTeaser />
      </div>
    </section>
  );
}
