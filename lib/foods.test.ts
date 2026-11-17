import { describe, expect, it } from "vitest";
import { getFood, getFoods, getRelatedFoods, searchFoods } from "@/lib/foods";

const foods = getFoods();

describe("searchFoods", () => {
  it("matches case-insensitively and ignores surrounding spaces", () => {
    const result = searchFoods(foods, { query: "  GRAPE" });
    expect(result.map((f) => f.slug)).toContain("grapes-and-raisins");
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchFoods(foods, { query: "zzzz" })).toEqual([]);
  });

  it("filters by species and verdict", () => {
    const result = searchFoods(foods, {
      query: "",
      species: "cat",
      verdict: "toxic",
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((f) => f.cat === "toxic")).toBe(true);
  });
});

describe("food content", () => {
  it("has 20 foods with unique kebab-case slugs", () => {
    expect(foods).toHaveLength(20);
    const slugs = foods.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("marks the classic dog toxins as toxic", () => {
    for (const slug of [
      "chocolate",
      "grapes-and-raisins",
      "xylitol-gum",
      "onions",
    ]) {
      expect(getFood(slug)?.dog).toBe("toxic");
    }
  });

  it("getRelatedFoods never returns the food itself", () => {
    const apple = getFood("apples")!;
    const related = getRelatedFoods(apple, 3);
    expect(related).toHaveLength(3);
    expect(related.some((f) => f.slug === apple.slug)).toBe(false);
  });
});
