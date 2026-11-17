"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { VerdictBadge } from "@/components/food/verdict-badge";
import { getFoods, searchFoods } from "@/lib/foods";

export function FoodLookup() {
  const [query, setQuery] = useState("");
  const foods = useMemo(() => getFoods(), []);
  const trimmed = query.trim();

  const results = useMemo(() => {
    const list = trimmed
      ? searchFoods(foods, { query: trimmed })
      : foods.filter((f) => f.popular);
    return list.slice(0, 6);
  }, [foods, trimmed]);

  return (
    <div>
      <div className="relative max-w-md">
        <label htmlFor="food-query" className="sr-only">
          Search foods
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="food-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try grapes, chocolate, apples…"
          autoComplete="off"
          className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-base shadow-(--shadow-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
        {trimmed
          ? results.length
            ? `${results.length} ${results.length === 1 ? "match" : "matches"}`
            : "No foods match. Browse the full list instead."
          : "Popular lookups"}
      </p>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((food) => (
          <li key={food.slug}>
            <Link
              href={`/food-safety/${food.slug}`}
              className="block h-full rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-(--shadow-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <p className="font-heading text-lg font-semibold">{food.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <VerdictBadge verdict={food.dog} species="dog" />
                <VerdictBadge verdict={food.cat} species="cat" />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/food-safety"
        className="mt-6 inline-block rounded-md text-sm font-semibold text-secondary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Browse all {foods.length} foods
      </Link>
    </div>
  );
}
