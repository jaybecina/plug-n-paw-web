"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { VerdictBadge } from "@/components/food/verdict-badge";
import type { Food, Species, Verdict } from "@/content/types";
import { searchFoods } from "@/lib/foods";
import { cn } from "@/lib/utils";

const speciesOptions: { id: Species | "all"; label: string }[] = [
  { id: "all", label: "Dogs and cats" },
  { id: "dog", label: "Dogs" },
  { id: "cat", label: "Cats" },
];
const verdictOptions: { id: Verdict | "all"; label: string }[] = [
  { id: "all", label: "Any" },
  { id: "safe", label: "Safe" },
  { id: "caution", label: "Use caution" },
  { id: "toxic", label: "Toxic" },
];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "border-secondary bg-secondary text-secondary-foreground"
          : "border-border bg-card hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export function FoodExplorer({ foods }: { foods: Food[] }) {
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<Species | "all">("all");
  const [verdict, setVerdict] = useState<Verdict | "all">("all");

  const results = useMemo(
    () =>
      searchFoods(foods, {
        query,
        species: species === "all" ? undefined : species,
        verdict: verdict === "all" ? undefined : verdict,
      }),
    [foods, query, species, verdict]
  );

  return (
    <div>
      <div className="relative max-w-md">
        <label htmlFor="food-search" className="sr-only">
          Search foods
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="food-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods, e.g. grapes"
          autoComplete="off"
          className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted-foreground">Pet</legend>
          <div className="flex flex-wrap gap-2">
            {speciesOptions.map((o) => (
              <Pill key={o.id} active={species === o.id} onClick={() => setSpecies(o.id)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted-foreground">Verdict</legend>
          <div className="flex flex-wrap gap-2">
            {verdictOptions.map((o) => (
              <Pill key={o.id} active={verdict === o.id} onClick={() => setVerdict(o.id)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {results.length === 0
          ? "No foods match. Try a different word or clear the filters."
          : `Showing ${results.length} of ${foods.length} foods`}
      </p>

      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((food) => (
          <li key={food.slug}>
            <Link
              href={`/food-safety/${food.slug}`}
              className="block h-full rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-(--shadow-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <p className="font-heading text-lg font-semibold text-secondary">{food.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{food.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <VerdictBadge verdict={food.dog} species="dog" />
                <VerdictBadge verdict={food.cat} species="cat" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
