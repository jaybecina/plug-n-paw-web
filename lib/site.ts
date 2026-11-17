export type NavItem = {
  href: string;
  label: string;
  emphasis?: "emergency";
};

export const siteConfig = {
  name: "Plug N Paw",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Care for your pet, the moment you need it.",
  description:
    "Free pet-health tools: find a vet near you, check how urgent a symptom is, see which foods are safe for dogs and cats, and read plain-language care guides.",
  email: "hello@plugnpaw.com",
  kofiUrl: "https://ko-fi.com/jaybecina",
  disclaimer:
    "General information only — not a substitute for advice from a veterinarian.",
  nav: [
    { href: "/find-vet", label: "Find a vet" },
    { href: "/symptom-checker", label: "Symptom checker" },
    { href: "/food-safety", label: "Food safety" },
    { href: "/guides", label: "Guides" },
    { href: "/emergency", label: "Emergency", emphasis: "emergency" },
  ] satisfies NavItem[],
} as const;
