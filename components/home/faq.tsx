import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "@/components/json-ld";
import { SectionHeading } from "@/components/section-heading";
import { homeFaq } from "@/content/faq";

export function Faq() {
  return (
    <section className="bg-card py-20 sm:py-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: homeFaq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          title="Questions people ask"
          description="Short, honest answers about what this site is and is not."
        />
        <Accordion className="w-full">
          {homeFaq.map((item, i) => (
            <AccordionItem key={item.q} value={i}>
              <AccordionTrigger className="text-base font-medium">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
