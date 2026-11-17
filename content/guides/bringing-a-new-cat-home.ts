import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const bringingANewCatHome: Guide = {
  slug: "bringing-a-new-cat-home",
  title: "Bringing a new cat home without the stress",
  excerpt: "Set up a quiet room, go slowly, and let your cat set the pace.",
  category: "New pet",
  species: ["cat"],
  image: images.tabby,
  updated: "2026-09-28",
  body: [
    { type: "p", text: "Cats like routine and a place to hide. A calm start makes the first week much easier for everyone." },
    { type: "h2", id: "start-with-one-small-room", text: "Start with one small room" },
    { type: "ul", items: ["Food, water, litter box and a bed, all in one quiet room", "Keep the litter box away from food and water", "Add a cardboard box or covered bed so they can hide", "Leave the carrier open so it feels safe"] },
    { type: "h2", id: "go-slowly", text: "Go slowly" },
    { type: "p", text: "Let your cat come out on their own. Sit quietly, talk softly, and offer treats. Many cats take days to relax, and some take weeks." },
    { type: "h2", id: "meeting-other-pets", text: "Meeting other pets" },
    { type: "p", text: "Swap bedding first so they learn each other's scent. Then try short visits through a baby gate. Do not force face-to-face meetings." },
    { type: "callout", tone: "info", text: "Book a vet visit in the first week for a check-up, and ask about vaccines, parasite prevention and microchipping." },
    { type: "callout", tone: "warning", text: "A cat that hides and refuses food for more than a day, or strains in the litter box, needs a vet. Do not wait." },
  ],
};
