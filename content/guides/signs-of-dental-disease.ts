import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const signsOfDentalDisease: Guide = {
  slug: "signs-of-dental-disease",
  title: "Signs of dental disease in dogs and cats",
  excerpt: "Bad breath is not normal. Here is what to look for and what helps.",
  category: "Health",
  species: ["dog", "cat"],
  image: images.beagle,
  updated: "2026-09-05",
  body: [
    { type: "p", text: "Most dogs and cats show some dental disease by age three. Pets hide pain, so problems are often found late." },
    { type: "h2", id: "what-to-look-for", text: "What to look for" },
    { type: "ul", items: ["Bad breath that does not go away", "Red, swollen or bleeding gums", "Brown or yellow build-up on teeth", "Drooling, dropping food, or chewing on one side", "Pawing at the mouth or pulling away when touched"] },
    { type: "h2", id: "what-helps", text: "What helps" },
    { type: "ul", items: ["Brush teeth daily or a few times a week with pet toothpaste", "Ask your vet about dental chews and diets that have been tested", "Book regular dental check-ups"] },
    { type: "p", text: "Never use human toothpaste. It often contains xylitol or fluoride, which are harmful to pets." },
    { type: "callout", tone: "warning", text: "See a vet soon if your pet will not eat, has a swollen face, or has a very bad smell from the mouth. These can be signs of infection." },
  ],
};
