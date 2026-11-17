import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { VerdictBadge } from "@/components/food/verdict-badge";
import { JsonLd } from "@/components/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { getFood, getFoods, getRelatedFoods } from "@/lib/foods";
import { siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getFoods().map((food) => ({ slug: food.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/food-safety/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const food = getFood(slug);
  if (!food) return {};
  return {
    title: `Can dogs and cats eat ${food.name.toLowerCase()}?`,
    description: food.summary,
    alternates: { canonical: `/food-safety/${food.slug}` },
  };
}

export default async function FoodPage({
  params,
}: PageProps<"/food-safety/[slug]">) {
  const { slug } = await params;
  const food = getFood(slug);
  if (!food) notFound();

  const related = getRelatedFoods(food, 3);
  const title = `Can dogs and cats eat ${food.name.toLowerCase()}?`;

  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: title,
              acceptedAnswer: {
                "@type": "Answer",
                text: `${food.summary} Dogs: ${food.dog}. Cats: ${food.cat}. ${food.whatToDo}`,
              },
            },
          ],
        }}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/food-safety", label: "Food safety" },
          { label: food.name },
        ]}
      />

      <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight text-balance text-secondary sm:text-5xl">
        {title}
      </h1>
      <div className="mt-5 flex flex-wrap gap-2">
        <VerdictBadge verdict={food.dog} species="dog" className="text-sm" />
        <VerdictBadge verdict={food.cat} species="cat" className="text-sm" />
      </div>

      <p className="mt-6 text-lg leading-8">{food.summary}</p>

      <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
        {food.details.map((d) => (
          <p key={d}>{d}</p>
        ))}
      </div>

      {food.servingTips && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-secondary">How to serve it</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {food.servingTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {food.warningSigns && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-secondary">Signs to watch for</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {food.warningSigns.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <section
        className={
          food.dog === "toxic" || food.cat === "toxic"
            ? "mt-8 rounded-3xl bg-sev-emergency/10 p-6"
            : "mt-8 rounded-3xl bg-tint-teal p-6"
        }
      >
        <h2 className="font-heading text-xl font-semibold text-secondary">What to do</h2>
        <p className="mt-2 leading-7">{food.whatToDo}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/find-vet?locate=1" className={buttonVariants({ size: "lg", className: "h-11 rounded-full px-5" })}>
            Find a vet near me
          </Link>
          <Link href="/emergency" className="inline-flex h-11 items-center rounded-full border border-border bg-card px-5 text-sm font-medium hover:bg-muted">
            Poison hotlines
          </Link>
        </div>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">{siteConfig.disclaimer}</p>

      <section className="mt-12">
        <h2 className="font-heading text-xl font-semibold text-secondary">Related foods</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {related.map((f) => (
            <li key={f.slug}>
              <Link
                href={`/food-safety/${f.slug}`}
                className="block h-full rounded-2xl border border-border bg-card p-4 hover:shadow-(--shadow-soft)"
              >
                <p className="font-heading font-semibold">{f.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <VerdictBadge verdict={f.dog} species="dog" />
                  <VerdictBadge verdict={f.cat} species="cat" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
