import { foods } from "@/content/foods";
import type { Food, Species, Verdict } from "@/content/types";

export function getFoods(): Food[] {
  return foods;
}

export function getFood(slug: string): Food | undefined {
  return foods.find((food) => food.slug === slug);
}

export function searchFoods(
  list: Food[],
  options: { query: string; species?: Species; verdict?: Verdict }
): Food[] {
  const query = options.query.trim().toLowerCase();
  return list.filter((food) => {
    if (query && !food.name.toLowerCase().includes(query)) return false;
    if (options.verdict) {
      const species: Species[] = options.species
        ? [options.species]
        : ["dog", "cat"];
      if (!species.some((s) => food[s] === options.verdict)) return false;
    }
    return true;
  });
}

export function getRelatedFoods(food: Food, count = 3): Food[] {
  const others = foods.filter((f) => f.slug !== food.slug);
  const sameCategory = others.filter((f) => f.category === food.category);
  const rest = others.filter((f) => f.category !== food.category);
  return [...sameCategory, ...rest].slice(0, count);
}
