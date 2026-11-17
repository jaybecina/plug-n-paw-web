"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { SeverityBadge } from "@/components/severity-badge";
import { assessSymptoms } from "@/lib/triage/rules";
import { SYMPTOMS, type SymptomId } from "@/lib/triage/symptoms";
import type { Species } from "@/content/types";
import { cn } from "@/lib/utils";

export function SymptomTeaser() {
  const [species, setSpecies] = useState<Species>("dog");
  const [symptom, setSymptom] = useState<SymptomId>("vomiting");

  const result = assessSymptoms({
    species,
    symptom,
    flags: [],
    duration: "lt24h",
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-(--shadow-soft) sm:p-8">
      <fieldset>
        <legend className="text-sm font-medium text-muted-foreground">
          My pet is a
        </legend>
        <div className="mt-2 flex gap-2">
          {(["dog", "cat"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={species === s}
              onClick={() => setSpecies(s)}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                species === s
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border bg-background hover:bg-muted"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label
          htmlFor="teaser-symptom"
          className="text-sm font-medium text-muted-foreground"
        >
          Main symptom
        </label>
        <select
          id="teaser-symptom"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value as SymptomId)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {SYMPTOMS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-2xl bg-muted p-4" aria-live="polite">
        <p className="text-xs font-medium text-muted-foreground">
          Starting point, before warning-sign questions
        </p>
        <SeverityBadge severity={result.severity} className="mt-2" />
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {result.advice}
        </p>
      </div>

      <Link
        href={`/symptom-checker?species=${species}&symptom=${symptom}`}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Get the full check
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
