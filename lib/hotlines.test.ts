import { describe, expect, it } from "vitest";
import { COUNTRY_OPTIONS, getHotlineRegion } from "@/lib/hotlines";

describe("getHotlineRegion", () => {
  it("returns the two US hotlines for US, case-insensitively", () => {
    expect(getHotlineRegion("US").lines).toHaveLength(2);
    expect(getHotlineRegion("us").code).toBe("US");
  });

  it("returns country-specific lines for GB, AU and NZ", () => {
    expect(getHotlineRegion("GB").lines[0].phone).toBe("01202 509000");
    expect(getHotlineRegion("AU").lines[0].phone).toBe("1300 869 738");
    expect(getHotlineRegion("NZ").lines[0].phone).toBe("0800 869 738");
  });

  it("falls back to a no-number region for unknown, empty or missing codes", () => {
    for (const code of ["PH", "xx", "", undefined, null]) {
      const region = getHotlineRegion(code);
      expect(region.code).toBe("OTHER");
      expect(region.lines).toEqual([]);
      expect(region.note).toMatch(/local vet/i);
    }
  });

  it("only uses dialable tel: links and lists every region once", () => {
    for (const option of COUNTRY_OPTIONS) {
      for (const line of getHotlineRegion(option.code).lines) {
        expect(line.tel).toMatch(/^tel:\+?\d+$/);
      }
    }
    const codes = COUNTRY_OPTIONS.map((o) => o.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain("OTHER");
  });
});
