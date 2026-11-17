import { z } from "zod";

export const TriageSeveritySchema = z.enum([
  "routine",
  "soon",
  "urgent",
  "emergency",
]);
export type TriageSeverity = z.infer<typeof TriageSeveritySchema>;

export const TRIAGE_DISCLAIMER =
  "General information only — not a substitute for advice from a veterinarian.";

export const TriageResponseSchema = z.object({
  severity: TriageSeveritySchema,
  advice: z.string(),
  reasons: z.array(z.string()).optional(),
  suggestedQuery: z.string().trim().min(1).max(100),
  disclaimer: z.string(),
});
export type TriageResult = z.infer<typeof TriageResponseSchema>;

export const SEVERITY_LABEL: Record<TriageSeverity, string> = {
  routine: "Routine veterinary attention",
  soon: "See a vet soon",
  urgent: "Urgent veterinary attention",
  emergency: "Emergency — seek immediate care",
};
