import { describe, expect, it } from "vitest";
import { haversineKm, roundDistanceKm } from "@/lib/vets/distance";

describe("distance", () => {
  it("is 0 for identical points", () => {
    const p = { lat: 14.6, lon: 120.98 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("measures Manila to Quezon City as roughly 5-15 km", () => {
    const km = haversineKm(
      { lat: 14.6, lon: 120.98 },
      { lat: 14.68, lon: 121.04 }
    );
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(15);
  });

  it("rounds to one decimal", () => {
    expect(roundDistanceKm(1.2345)).toBe(1.2);
  });
});
