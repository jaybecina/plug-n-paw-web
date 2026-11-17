import { describe, expect, it } from "vitest";
import {
  getGuide,
  getGuides,
  getRelatedGuides,
  guideToc,
  readMinutes,
} from "@/lib/guides";

const guides = getGuides();

describe("guides content", () => {
  it("has 8 guides with unique slugs", () => {
    expect(guides).toHaveLength(8);
    expect(new Set(guides.map((g) => g.slug)).size).toBe(8);
  });

  it("every guide has an image alt and unique heading ids", () => {
    for (const g of guides) {
      expect(g.image.alt.length).toBeGreaterThan(5);
      const ids = guideToc(g).map((h) => h.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("readMinutes is at least 1", () => {
    for (const g of guides) expect(readMinutes(g)).toBeGreaterThanOrEqual(1);
  });

  it("returns newest first", () => {
    const dates = guides.map((g) => g.updated);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("getGuide finds by slug and getRelatedGuides excludes itself", () => {
    const g = getGuide("when-to-see-a-vet")!;
    expect(g).toBeDefined();
    const related = getRelatedGuides(g, 3);
    expect(related).toHaveLength(3);
    expect(related.some((r) => r.slug === g.slug)).toBe(false);
  });
});
