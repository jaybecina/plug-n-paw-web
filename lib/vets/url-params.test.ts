import { describe, expect, it } from "vitest";
import { parseFindVetParams } from "@/lib/vets/url-params";

const parse = (qs: string) => parseFindVetParams(new URLSearchParams(qs));

describe("parseFindVetParams", () => {
  it("ignores an empty or whitespace q", () => {
    expect(parse("q=%20%20")).toEqual({ locate: false });
    expect(parse("q=")).toEqual({ locate: false });
  });

  it("trims q and caps it at 100 characters", () => {
    expect(parse("q=%20Manila%20")).toEqual({ q: "Manila", locate: false });
    expect(parse(`q=${"a".repeat(150)}`).q).toHaveLength(100);
  });

  it("treats only locate=1 as true", () => {
    expect(parse("locate=1")).toEqual({ locate: true });
    expect(parse("locate=yes").locate).toBe(false);
    expect(parse("locate=0").locate).toBe(false);
  });

  it("prefers locate over q when both are present", () => {
    expect(parse("q=Manila&locate=1")).toEqual({ q: "Manila", locate: true });
  });
});
