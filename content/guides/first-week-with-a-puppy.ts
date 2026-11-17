import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const firstWeekWithAPuppy: Guide = {
  slug: "first-week-with-a-puppy",
  title: "Your first week with a puppy: a simple checklist",
  excerpt: "What to buy, what to schedule, and what to expect in the first seven days.",
  category: "New pet",
  species: ["dog"],
  image: images.puppy,
  updated: "2026-10-02",
  body: [
    { type: "p", text: "The first week sets the routine for everything that follows. You do not need perfect training yet. You need a safe space, a schedule, and a vet visit booked." },
    { type: "h2", id: "before-they-come-home", text: "Before they come home" },
    { type: "ul", items: ["A crate or playpen, a bed, and a few chew toys", "Puppy food: ask the breeder or shelter what they were eating", "Collar, ID tag, leash and poop bags", "Puppy-proof the floor: cords, shoes, plants and trash"] },
    { type: "h2", id: "the-first-days", text: "The first days" },
    { type: "ul", items: ["Keep the same food at first. Change it slowly over about a week.", "Take them out after sleeping, eating and playing, and every hour or two.", "Reward in the right spot, right away.", "Plan short naps. Puppies need a lot of sleep."] },
    { type: "h2", id: "book-the-vet", text: "Book the vet" },
    { type: "p", text: "Book a check-up in the first few days. Bring any vaccine and deworming records. Your vet will set up a schedule for vaccines, parasite prevention and, later, spay or neuter." },
    { type: "callout", tone: "warning", text: "Call a vet the same day if your puppy is vomiting repeatedly, has bloody diarrhea, is very tired, or will not eat. Young puppies get sick quickly." },
  ],
};
