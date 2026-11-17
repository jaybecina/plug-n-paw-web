import { guides } from "@/content/guides";
import type { Guide } from "@/content/types";

export function getGuides(): Guide[] {
  return [...guides].sort((a, b) => b.updated.localeCompare(a.updated));
}

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}

export function readMinutes(guide: Guide): number {
  const words = guide.body
    .map((block) => {
      if (block.type === "ul") return block.items.join(" ");
      return block.text;
    })
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function guideToc(guide: Guide): { id: string; text: string }[] {
  return guide.body.flatMap((block) =>
    block.type === "h2" ? [{ id: block.id, text: block.text }] : []
  );
}

export function getRelatedGuides(guide: Guide, count = 3): Guide[] {
  const others = getGuides().filter((g) => g.slug !== guide.slug);
  const same = others.filter((g) => g.category === guide.category);
  const rest = others.filter((g) => g.category !== guide.category);
  return [...same, ...rest].slice(0, count);
}
