import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const petVaccinationBasics: Guide = {
  slug: "pet-vaccination-basics",
  title: "Pet vaccination basics: what and when",
  excerpt: "Core vaccines, boosters, and why timing matters. Your vet sets the exact schedule.",
  category: "Health",
  species: ["dog", "cat"],
  image: images.beagle,
  updated: "2026-09-15",
  body: [
    { type: "p", text: "Vaccines protect your pet from serious, sometimes deadly diseases. Schedules differ by age, area and lifestyle, so your vet will tailor yours." },
    { type: "h2", id: "core-vaccines", text: "Core vaccines" },
    { type: "p", text: "Core vaccines are recommended for almost every pet. For dogs, these usually protect against distemper, parvovirus, adenovirus and rabies. For cats, they usually include feline panleukopenia, herpesvirus, calicivirus and rabies." },
    { type: "h2", id: "puppies-and-kittens", text: "Puppies and kittens" },
    { type: "p", text: "Young animals get a series of shots over several weeks, because the protection they get from their mother fades at different times. Finishing the full series matters." },
    { type: "h2", id: "adults-and-boosters", text: "Adults and boosters" },
    { type: "ul", items: ["Some vaccines are boosted every year, others every three years", "Rabies vaccination is required by law in many places", "Lifestyle vaccines, like kennel cough, depend on how your pet lives"] },
    { type: "callout", tone: "info", text: "Keep your pet's vaccine record somewhere you can find it. Boarding, grooming and travel often ask for it." },
    { type: "callout", tone: "warning", text: "Call your vet if your pet has facial swelling, hives, repeated vomiting or trouble breathing after a vaccine. These are rare, but need fast care." },
  ],
};
