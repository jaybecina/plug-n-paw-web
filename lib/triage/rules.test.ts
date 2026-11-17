import { describe, expect, it } from "vitest";
import { assessSymptoms, parseTriageParams } from "@/lib/triage/rules";
import { SYMPTOMS } from "@/lib/triage/symptoms";
import { TriageResponseSchema } from "@/lib/triage/types";
import type { Species } from "@/content/types";

const species: Species[] = ["dog", "cat"];
const base = { flags: [] as string[], duration: "lt24h" as const };

describe("assessSymptoms", () => {
  it("rates a new itch in a dog as routine and escalates with duration", () => {
    expect(
      assessSymptoms({ ...base, species: "dog", symptom: "itching" }).severity
    ).toBe("routine");
    expect(
      assessSymptoms({
        ...base,
        species: "dog",
        symptom: "itching",
        duration: "gt3d",
      }).severity
    ).toBe("soon");
  });

  it("treats urinary trouble in cats as urgent but dogs as soon", () => {
    expect(
      assessSymptoms({ ...base, species: "cat", symptom: "urinary-trouble" })
        .severity
    ).toBe("urgent");
    expect(
      assessSymptoms({ ...base, species: "dog", symptom: "urinary-trouble" })
        .severity
    ).toBe("soon");
  });

  it("makes a global red flag an emergency for every symptom", () => {
    for (const s of species) {
      for (const sym of SYMPTOMS) {
        const r = assessSymptoms({
          species: s,
          symptom: sym.id,
          flags: ["pale-gums"],
          duration: "lt24h",
        });
        expect(r.severity).toBe("emergency");
        expect(r.reasons?.length).toBeGreaterThan(0);
      }
    }
  });

  it("makes a seizure lasting over 5 minutes an emergency", () => {
    expect(
      assessSymptoms({
        ...base,
        species: "dog",
        symptom: "seizure",
        flags: ["seizure-over-5-min"],
      }).severity
    ).toBe("emergency");
  });

  it("treats any breathing trouble as an emergency", () => {
    for (const s of species)
      expect(
        assessSymptoms({ ...base, species: s, symptom: "breathing-trouble" })
          .severity
      ).toBe("emergency");
  });

  it("tells owners of a pet that ate something toxic to call a vet or hotline now", () => {
    const r = assessSymptoms({ ...base, species: "dog", symptom: "ate-toxic" });
    expect(r.severity).toBe("urgent");
    expect(r.advice).toMatch(/poison/i);
  });

  it("rates a cat that has not eaten for over a day as urgent", () => {
    expect(
      assessSymptoms({
        ...base,
        species: "cat",
        symptom: "not-eating",
        duration: "1to3d",
      }).severity
    ).toBe("urgent");
  });

  it("never returns routine after more than 3 days", () => {
    for (const s of species)
      for (const sym of SYMPTOMS)
        expect(
          assessSymptoms({
            species: s,
            symptom: sym.id,
            flags: [],
            duration: "gt3d",
          }).severity
        ).not.toBe("routine");
  });

  it("never returns emergency without a red flag, except breathing trouble", () => {
    for (const s of species)
      for (const sym of SYMPTOMS.filter((x) => x.id !== "breathing-trouble"))
        for (const d of ["lt24h", "1to3d", "gt3d"] as const)
          expect(
            assessSymptoms({ species: s, symptom: sym.id, flags: [], duration: d })
              .severity
          ).not.toBe("emergency");
  });

  it("ignores flags that do not belong to the symptom", () => {
    expect(
      assessSymptoms({
        ...base,
        species: "dog",
        symptom: "itching",
        flags: ["blood-in-vomit", "not-a-flag"],
      }).severity
    ).toBe("routine");
  });

  it("returns a result that passes the response schema", () => {
    const r = assessSymptoms({ ...base, species: "cat", symptom: "vomiting" });
    expect(() => TriageResponseSchema.parse(r)).not.toThrow();
  });
});

describe("parseTriageParams", () => {
  it("drops invalid values", () => {
    expect(
      parseTriageParams(new URLSearchParams("species=fish&symptom=xyz"))
    ).toEqual({});
  });

  it("keeps valid values", () => {
    expect(
      parseTriageParams(new URLSearchParams("species=cat&symptom=vomiting"))
    ).toEqual({ species: "cat", symptom: "vomiting" });
  });
});
