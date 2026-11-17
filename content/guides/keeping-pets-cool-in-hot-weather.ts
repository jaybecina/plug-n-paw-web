import type { Guide } from "@/content/types";
import { images } from "@/content/images";

export const keepingPetsCoolInHotWeather: Guide = {
  slug: "keeping-pets-cool-in-hot-weather",
  title: "Keeping pets cool in hot weather",
  excerpt: "Heatstroke can happen fast. Know the signs and how to prevent it.",
  category: "Health",
  species: ["dog", "cat"],
  image: images.husky,
  updated: "2026-08-20",
  body: [
    { type: "p", text: "Pets cannot sweat like people. Dogs cool down by panting, and that stops working well in heat and humidity." },
    { type: "h2", id: "how-to-prevent-heatstroke", text: "How to prevent heatstroke" },
    { type: "ul", items: ["Never leave a pet in a parked car, even for a minute", "Walk early in the morning or late in the evening", "Give shade and fresh water all day", "Avoid hot pavement. If it is too hot for your hand, it is too hot for paws.", "Take extra care with flat-faced breeds, older pets and overweight pets"] },
    { type: "h2", id: "signs-of-heatstroke", text: "Signs of heatstroke" },
    { type: "ul", items: ["Heavy panting and drooling", "Bright red or pale gums", "Weakness, stumbling or collapse", "Vomiting or diarrhea"] },
    { type: "callout", tone: "warning", text: "If you think your pet has heatstroke, move them to shade or air conditioning, offer small sips of cool water, and call a vet right away. Do not use ice-cold water or ice baths." },
  ],
};
