import {
  GLOBAL_RED_FLAGS,
  getSymptom,
  type Duration,
  type Species,
  type SymptomId,
} from "@/lib/triage/symptoms";
import {
  TRIAGE_DISCLAIMER,
  type TriageResult,
  type TriageSeverity,
} from "@/lib/triage/types";

export type TriageInput = {
  species: Species;
  symptom: SymptomId;
  flags: string[];
  duration: Duration;
};

const ORDER: TriageSeverity[] = ["routine", "soon", "urgent", "emergency"];
const rank = (s: TriageSeverity) => ORDER.indexOf(s);
const maxSeverity = (a: TriageSeverity, b: TriageSeverity) =>
  rank(a) >= rank(b) ? a : b;

const ADVICE: Record<TriageSeverity, string> = {
  routine:
    "This is often not urgent, but book a regular visit if it continues or you are worried. Watch for any change.",
  soon: "Book a vet visit in the next day or two. Call sooner if things get worse.",
  urgent:
    "Call a vet today. If you cannot reach yours, find an urgent or emergency clinic near you.",
  emergency:
    "Go to the nearest emergency vet now. Call ahead on the way if you can. Do not wait to see if it passes.",
};

export function assessSymptoms(input: TriageInput): TriageResult {
  const symptom = getSymptom(input.symptom);
  if (!symptom) throw new Error(`Unknown symptom: ${input.symptom}`);

  const picked = new Set(input.flags);
  const redFlags = [...GLOBAL_RED_FLAGS, ...symptom.redFlags].filter((f) =>
    picked.has(f.id)
  );
  const reasons: string[] = redFlags.map((f) => f.question);

  let severity: TriageSeverity;

  if (redFlags.length > 0) {
    severity = "emergency";
  } else {
    severity = symptom.base[input.species];

    const urgent = (symptom.urgentFlags ?? []).filter((f) => picked.has(f.id));
    if (urgent.length > 0) {
      severity = maxSeverity(severity, "urgent");
      reasons.push(...urgent.map((f) => f.question));
    }

    if (input.duration === "1to3d" && severity === "routine") {
      severity = "soon";
      reasons.push("It has lasted more than a day");
    } else if (input.duration === "gt3d") {
      const next = ORDER[Math.min(rank(severity) + 1, rank("urgent"))];
      if (next !== severity) reasons.push("It has lasted more than 3 days");
      severity = maxSeverity(severity, next);
    }

    if (
      symptom.urgentIfDuration?.[input.species]?.includes(input.duration) &&
      rank(severity) < rank("urgent")
    ) {
      severity = "urgent";
      reasons.push(
        `A ${input.species} that has not eaten for over a day needs a vet`
      );
    }
  }

  if (reasons.length === 0) {
    reasons.push(
      symptom.id === "breathing-trouble"
        ? "Trouble breathing is always treated as an emergency"
        : `${symptom.label} with no warning signs reported`
    );
  }

  return {
    severity,
    advice:
      symptom.id === "ate-toxic" && severity === "urgent"
        ? "Call your vet or a pet poison hotline right now, even if your pet seems fine. Do not make your pet vomit unless they tell you to."
        : ADVICE[severity],
    reasons,
    suggestedQuery: severity === "emergency" ? "emergency vet" : "veterinary clinic",
    disclaimer: TRIAGE_DISCLAIMER,
  };
}

export function parseTriageParams(sp: URLSearchParams): {
  species?: Species;
  symptom?: SymptomId;
} {
  const out: { species?: Species; symptom?: SymptomId } = {};
  const species = sp.get("species");
  if (species === "dog" || species === "cat") out.species = species;
  const symptom = sp.get("symptom");
  if (symptom && getSymptom(symptom)) out.symptom = symptom as SymptomId;
  return out;
}

