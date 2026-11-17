"use client";

import { useState } from "react";
import { GuideCard } from "@/components/guides/guide-card";
import type { Guide } from "@/content/types";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Health", "Nutrition", "Behavior", "New pet"] as const;

export function GuideList({ guides }: { guides: Guide[] }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const present = CATEGORIES.filter(
    (c) => c === "All" || guides.some((g) => g.category === c)
  );
  const shown = guides.filter((g) => category === "All" || g.category === category);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {present.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              category === c
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-border bg-card hover:bg-muted"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((guide) => (
          <li key={guide.slug}>
            <GuideCard guide={guide} />
          </li>
        ))}
      </ul>
    </div>
  );
}
