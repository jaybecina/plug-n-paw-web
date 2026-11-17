"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { ResultCard } from "@/components/symptom-checker/result-card";
import { assessSymptoms, parseTriageParams } from "@/lib/triage/rules";
import {
  DURATION_OPTIONS,
  GLOBAL_RED_FLAGS,
  SYMPTOMS,
  getSymptom,
  type Duration,
  type SymptomId,
} from "@/lib/triage/symptoms";
import type { Species } from "@/content/types";
import { cn } from "@/lib/utils";

type Step = "species" | "symptom" | "flags" | "duration" | "result";
const STEPS: Step[] = ["species", "symptom", "flags", "duration", "result"];

const choice =
  "rounded-2xl border px-4 py-3 text-left font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function SymptomChecker() {
  const searchParams = useSearchParams();
  const [initial] = useState(() => parseTriageParams(searchParams));

  const [species, setSpecies] = useState<Species | undefined>(initial.species);
  const [symptomId, setSymptomId] = useState<SymptomId | undefined>(
    initial.symptom && initial.species ? initial.symptom : undefined
  );
  const [flags, setFlags] = useState<string[]>([]);
  const [duration, setDuration] = useState<Duration | undefined>();
  const [step, setStep] = useState<Step>(
    initial.species ? (initial.symptom ? "flags" : "symptom") : "species"
  );

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const symptom = symptomId ? getSymptom(symptomId) : undefined;
  const stepIndex = STEPS.indexOf(step);

  const flagOptions = useMemo(
    () =>
      symptom
        ? [
            ...symptom.redFlags,
            ...(symptom.urgentFlags ?? []),
            ...GLOBAL_RED_FLAGS,
          ]
        : [],
    [symptom]
  );

  const result =
    step === "result" && species && symptom && duration
      ? assessSymptoms({ species, symptom: symptom.id, flags, duration })
      : null;

  function reset() {
    setSpecies(undefined);
    setSymptomId(undefined);
    setFlags([]);
    setDuration(undefined);
    setStep("species");
  }

  function back() {
    const prev = STEPS[Math.max(0, stepIndex - 1)];
    setStep(prev);
  }

  function toggleFlag(id: string) {
    setFlags((current) =>
      current.includes(id) ? current.filter((f) => f !== id) : [...current, id]
    );
  }

  const headings: Record<Step, string> = {
    species: "Is your pet a dog or a cat?",
    symptom: "What is the main problem?",
    flags: "Do any of these apply right now?",
    duration: "How long has this been going on?",
    result: "Your result",
  };

  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length - 1}
        aria-valuenow={Math.min(stepIndex + 1, STEPS.length - 1)}
        aria-label="Progress"
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-8 font-heading text-2xl font-semibold text-secondary outline-none sm:text-3xl"
      >
        {headings[step]}
      </h2>

      <div className="mt-6">
        {step === "species" && (
          <div className="grid max-w-md grid-cols-2 gap-3">
            {(["dog", "cat"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSpecies(s);
                  setStep("symptom");
                }}
                className={cn(
                  choice,
                  "border-border bg-card py-6 text-center text-lg capitalize hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {step === "symptom" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {SYMPTOMS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSymptomId(s.id);
                  setFlags([]);
                  setStep("flags");
                }}
                className={cn(choice, "border-border bg-card hover:bg-muted")}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {step === "flags" && (
          <div>
            <p className="text-muted-foreground">
              Tick everything that applies. Leave all unticked if none do.
            </p>
            <ul className="mt-4 space-y-2">
              {flagOptions.map((flag) => (
                <li key={flag.id}>
                  <label
                    className={cn(
                      choice,
                      "flex cursor-pointer items-center gap-3",
                      flags.includes(flag.id)
                        ? "border-sev-emergency bg-sev-emergency/10"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={flags.includes(flag.id)}
                      onChange={() => toggleFlag(flag.id)}
                      className="size-5 accent-[var(--sev-emergency)]"
                    />
                    {flag.question}
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setStep("duration")}
              className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Continue
            </button>
          </div>
        )}

        {step === "duration" && (
          <div className="grid max-w-md gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setDuration(option.id);
                  setStep("result");
                }}
                className={cn(choice, "border-border bg-card hover:bg-muted")}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {step === "result" && result && (
          <div aria-live="polite">
            <ResultCard result={result} />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {step !== "species" && step !== "result" && (
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
          </button>
        )}
        {step === "result" && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Start over
          </button>
        )}
      </div>
    </div>
  );
}
