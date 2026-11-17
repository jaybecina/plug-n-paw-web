import { SectionHeading } from "@/components/section-heading";

const steps = [
  {
    title: "Tell us what is going on",
    body: "Pick your pet and the main symptom. Answer a few yes or no questions about warning signs.",
  },
  {
    title: "See how urgent it is",
    body: "Get a clear answer: routine, see a vet soon, urgent, or emergency, with plain next steps.",
  },
  {
    title: "Find care nearby",
    body: "Open the map, see clinics ranked by distance, and get directions in one tap.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-card py-20 sm:py-24">
      <div className="container-page">
        <div>
          <SectionHeading
            title="From worried to a plan in three steps"
            description="No account, no waiting room."
          />
        </div>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step.title}>
              <div>
                <span className="flex size-12 items-center justify-center rounded-full bg-primary font-heading text-xl font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold text-secondary">
                  {step.title}
                </h3>
                <p className="mt-2 leading-7 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
