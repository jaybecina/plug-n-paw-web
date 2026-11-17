import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const whenToSeeAVet: Guide = {
  slug: "when-to-see-a-vet",
  title: "When to see a vet and when you can wait",
  excerpt: "A plain guide to urgent, soon and routine care.",
  category: "Health",
  species: ["dog", "cat"],
  image: images.terrier,
  updated: "2026-10-12",
  body: [
    { type: "p", text: "Pets cannot tell you what is wrong, so it helps to know which signs matter most. When you are not sure, call your vet. They would rather hear from you early." },
    { type: "h2", id: "go-now", text: "Go now" },
    { type: "ul", items: ["Trouble breathing, blue or pale gums", "Collapse, seizures, or cannot stand", "Suspected poison or something toxic eaten", "Hit by a car or a major fall", "A hard, swollen belly with retching", "A male cat straining to pee with little or nothing coming out"] },
    { type: "h2", id: "see-a-vet-soon", text: "See a vet soon" },
    { type: "ul", items: ["Vomiting or diarrhea for more than a day", "Not eating for more than a day (cats) or two (dogs)", "Limping that does not improve in a day or two", "A cut that is deep, or an eye that is red or held shut"] },
    { type: "h2", id: "routine-care", text: "Routine care" },
    { type: "p", text: "Yearly check-ups, vaccines, parasite prevention and dental checks keep small problems small." },
    { type: "callout", tone: "info", text: "Not sure which group your pet's symptoms belong in? Try the symptom checker, then find a vet near you." },
  ],
};
