import type { Species } from "@/content/types";
import type { TriageSeverity } from "@/lib/triage/types";

export type { Species };
export type Duration = "lt24h" | "1to3d" | "gt3d";

export type SymptomId =
  | "vomiting"
  | "diarrhea"
  | "not-eating"
  | "lethargy"
  | "limping"
  | "coughing"
  | "itching"
  | "eye-problem"
  | "breathing-trouble"
  | "ate-toxic"
  | "urinary-trouble"
  | "seizure";

export type Flag = { id: string; question: string };

export type Symptom = {
  id: SymptomId;
  label: string;
  base: Record<Species, TriageSeverity>;
  /** Any of these answered yes → emergency. */
  redFlags: Flag[];
  /** Any of these answered yes → at least urgent. */
  urgentFlags?: Flag[];
  /** Cat/dog is at least urgent once the problem has lasted this long. */
  urgentIfDuration?: Partial<Record<Species, Duration[]>>;
};

export const DURATION_OPTIONS: { id: Duration; label: string }[] = [
  { id: "lt24h", label: "Less than a day" },
  { id: "1to3d", label: "1 to 3 days" },
  { id: "gt3d", label: "More than 3 days" },
];

export const GLOBAL_RED_FLAGS: Flag[] = [
  { id: "pale-gums", question: "Gums are pale, white, blue or grey" },
  { id: "collapse", question: "Collapsed, or cannot stand up" },
  {
    id: "swollen-belly-retching",
    question: "Hard, swollen belly, or retching with nothing coming up",
  },
  { id: "heavy-bleeding", question: "Heavy bleeding that will not stop" },
  {
    id: "major-trauma",
    question: "Hit by a car, a bad fall, or another major injury",
  },
];

export const SYMPTOMS: Symptom[] = [
  {
    id: "vomiting",
    label: "Vomiting",
    base: { dog: "soon", cat: "soon" },
    redFlags: [
      { id: "blood-in-vomit", question: "There is blood in the vomit" },
      { id: "cant-keep-water-down", question: "Cannot keep even water down" },
    ],
  },
  {
    id: "diarrhea",
    label: "Diarrhea",
    base: { dog: "soon", cat: "soon" },
    redFlags: [
      {
        id: "blood-or-black-stool",
        question: "There is blood, or the stool is black and tarry",
      },
    ],
  },
  {
    id: "not-eating",
    label: "Not eating",
    base: { dog: "routine", cat: "soon" },
    redFlags: [],
    urgentIfDuration: { cat: ["1to3d", "gt3d"] },
  },
  {
    id: "lethargy",
    label: "Very tired or low energy",
    base: { dog: "soon", cat: "soon" },
    redFlags: [{ id: "unresponsive", question: "Hard to wake or unresponsive" }],
  },
  {
    id: "limping",
    label: "Limping",
    base: { dog: "routine", cat: "routine" },
    redFlags: [
      { id: "no-weight", question: "Will not put any weight on the leg" },
      {
        id: "open-wound-or-break",
        question: "There is an open wound, or the leg looks broken",
      },
    ],
  },
  {
    id: "coughing",
    label: "Coughing",
    base: { dog: "routine", cat: "routine" },
    redFlags: [
      {
        id: "laboured-breathing",
        question: "Coughing along with hard or fast breathing",
      },
    ],
  },
  {
    id: "itching",
    label: "Scratching or itching",
    base: { dog: "routine", cat: "routine" },
    redFlags: [
      {
        id: "face-swelling-hives",
        question: "Sudden swelling of the face or muzzle, or hives",
      },
    ],
  },
  {
    id: "eye-problem",
    label: "Eye problem",
    base: { dog: "soon", cat: "soon" },
    redFlags: [],
    urgentFlags: [
      {
        id: "eye-bulging-injured",
        question: "Eye is bulging, injured, or held shut and painful",
      },
    ],
  },
  {
    id: "breathing-trouble",
    label: "Trouble breathing",
    base: { dog: "urgent", cat: "urgent" },
    redFlags: [
      {
        id: "open-mouth-breathing",
        question: "Breathing with the mouth open, or very fast at rest",
      },
    ],
  },
  {
    id: "ate-toxic",
    label: "Ate something toxic",
    base: { dog: "urgent", cat: "urgent" },
    redFlags: [
      { id: "signs-showing", question: "Already showing signs of being unwell" },
    ],
  },
  {
    id: "urinary-trouble",
    label: "Trouble urinating",
    base: { dog: "soon", cat: "urgent" },
    redFlags: [
      {
        id: "straining-nothing",
        question: "Straining, with little or nothing coming out",
      },
    ],
  },
  {
    id: "seizure",
    label: "Seizure",
    base: { dog: "urgent", cat: "urgent" },
    redFlags: [
      { id: "seizure-over-5-min", question: "The seizure lasted over 5 minutes" },
      { id: "repeat-seizures", question: "More than one seizure in 24 hours" },
    ],
  },
];

export function getSymptom(id: string): Symptom | undefined {
  return SYMPTOMS.find((s) => s.id === id);
}
