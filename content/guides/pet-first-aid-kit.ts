import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const petFirstAidKit: Guide = {
  slug: "pet-first-aid-kit",
  title: "What to put in a pet first-aid kit",
  excerpt: "A small kit you keep at home and take on trips.",
  category: "Health",
  species: ["dog", "cat"],
  image: images.retriever,
  updated: "2026-07-30",
  body: [
    { type: "p", text: "A first-aid kit helps you stabilize your pet while you get to a vet. It does not replace a vet visit." },
    { type: "h2", id: "the-basics", text: "The basics" },
    { type: "ul", items: ["Your vet's number, the nearest emergency clinic, and a poison hotline", "Gauze, non-stick pads, and self-adhesive bandage (not sticky tape on fur)", "Saline eye wash, blunt-tip scissors and tweezers", "A digital thermometer and water-based lubricant", "Clean towel or blanket, and a muzzle or soft cloth for a hurt pet"] },
    { type: "h2", id: "medicines", text: "Medicines" },
    { type: "p", text: "Do not give human medicines unless a vet tells you to. Many, such as ibuprofen and acetaminophen, are dangerous to pets." },
    { type: "h2", id: "keep-it-ready", text: "Keep it ready" },
    { type: "ul", items: ["Check expiry dates twice a year", "Keep a copy of your pet's medical records", "Put a small kit in the car"] },
    { type: "callout", tone: "warning", text: "Do not make your pet vomit unless a vet or poison hotline tells you to." },
  ],
};
