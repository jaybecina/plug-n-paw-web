import { SectionHeading } from "@/components/section-heading";
import { FoodLookup } from "@/components/home/food-lookup";

export function FoodSection() {
  return (
    <section className="bg-tint-sage/60 py-20 sm:py-24">
      <div className="container-page">
        <div>
          <SectionHeading
            title="Can my pet eat that?"
            description="Your dog just ate something off the floor. Look it up for dogs and cats before you panic."
          />
        </div>
        <div className="mt-8">
          <FoodLookup />
        </div>
      </div>
    </section>
  );
}
