import { HeroSearch } from "@/components/home/hero-search";

export function FinalCta() {
  return (
    <section className="container-page py-20 text-center sm:py-24">
      <h2 className="font-heading text-3xl font-semibold leading-tight text-balance text-secondary sm:text-5xl">
        Find a vet near you, right now
      </h2>
      <div className="mx-auto mt-8 flex max-w-xl justify-center text-left">
        <HeroSearch id="cta-search" />
      </div>
    </section>
  );
}
