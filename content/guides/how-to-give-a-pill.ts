import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const howToGiveAPill: Guide = {
  slug: "how-to-give-a-pill",
  title: "How to give a pet a pill",
  excerpt: "Calm, quick steps that work for most dogs and cats.",
  category: "Health",
  species: ["dog", "cat"],
  image: images.orangeCat,
  updated: "2026-08-08",
  body: [
    { type: "p", text: "Always check with your vet or pharmacist first. Some pills must be given with food, and some must not be crushed." },
    { type: "h2", id: "easy-way:-hide-it", text: "Easy way: hide it" },
    { type: "ul", items: ["Use a pill pocket or a small bit of food your vet says is safe", "Do not use peanut butter that contains xylitol", "Give a plain treat first, then the pill treat, then another plain treat"] },
    { type: "h2", id: "hands-on-way", text: "Hands-on way" },
    { type: "ul", items: ["Hold the head gently from above and tilt it back", "Open the mouth with your other hand", "Place the pill far back on the tongue", "Close the mouth, stroke the throat, and wait for a swallow", "Follow with a small sip of water or a lick of wet food"] },
    { type: "callout", tone: "info", text: "Ask your vet if the medicine comes as a liquid or a chew. These are often easier." },
    { type: "callout", tone: "warning", text: "If a pill is coughed up, do not give another dose without asking your vet. If your pet shows signs of choking, call a vet right away." },
  ],
};
