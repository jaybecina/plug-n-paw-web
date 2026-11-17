export type Verdict = "safe" | "caution" | "toxic";
export type Species = "dog" | "cat";

export type Food = {
  slug: string;
  name: string;
  category: "fruit" | "vegetable" | "protein" | "dairy" | "snack" | "other";
  dog: Verdict;
  cat: Verdict;
  summary: string;
  details: string[];
  servingTips?: string[];
  warningSigns?: string[];
  whatToDo: string;
  popular?: boolean;
};

export type GuideBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; tone: "info" | "warning"; text: string };

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Health" | "Nutrition" | "Behavior" | "New pet";
  species: Species[];
  image: { src: string; alt: string; credit: string };
  updated: string;
  body: GuideBlock[];
};
