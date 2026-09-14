import { haversineKm, roundCoordinate, roundDistanceKm } from "@/lib/vets/distance";
import {
  geoapifyGeocode,
  geoapifyPlaces,
  type GeoapifyFeatureCollection,
} from "@/lib/vets/geoapify";
import type { SearchResponse, VetResult } from "@/lib/vets/types";

const RADIUS_KM = 20 as const;

type SearchInput =
  | { type: "query"; q: string }
  | { type: "location"; lat: number; lon: number };

export async function searchVets(
  input: SearchInput,
  apiKey: string
): Promise<SearchResponse> {
  const resolved = await resolveSearchCenter(input, apiKey);

  if (!resolved.center) {
    return {
      query: resolved.query,
      center: null,
      results: [],
      meta: {
        searchType: "place",
        radiusKm: RADIUS_KM,
        locationNotFound: true,
      },
    };
  }

  const places = await geoapifyPlaces(resolved.center, apiKey);
  const results = orderResults(
    mapVetResults(places, resolved.center),
    resolved.searchType,
    resolved.query
  );

  return {
    query: resolved.query,
    center: resolved.center,
    results,
    meta: {
      searchType: resolved.searchType,
      radiusKm: RADIUS_KM,
    },
  };
}

async function resolveSearchCenter(input: SearchInput, apiKey: string): Promise<{
  query: string;
  searchType: "location" | "place";
  center: { lat: number; lon: number; label?: string } | null;
}> {
  if (input.type === "location") {
    return {
      query: "your location",
      searchType: "location",
      center: {
        lat: roundCoordinate(input.lat),
        lon: roundCoordinate(input.lon),
      },
    };
  }

  const geocode = await geoapifyGeocode(input.q, apiKey);
  const feature = geocode.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!coordinates) {
    return {
      query: input.q,
      searchType: "place",
      center: null,
    };
  }

  return {
    query: input.q,
    searchType: "place",
    center: {
      lat: roundCoordinate(coordinates[1]),
      lon: roundCoordinate(coordinates[0]),
      label: feature.properties?.formatted,
    },
  };
}

function mapVetResults(
  places: GeoapifyFeatureCollection,
  center: { lat: number; lon: number }
): VetResult[] {
  return (places.features ?? [])
    .map<VetResult | null>((feature, index) => {
      const coordinates = feature.geometry?.coordinates;
      const properties = feature.properties;

      if (!coordinates || !properties) {
        return null;
      }

      const [lon, lat] = coordinates;
      const name = properties.name ?? properties.address_line1;
      const address = properties.formatted;

      if (!name || !address) {
        return null;
      }

      const phone = properties.contact?.phone ?? properties.phone;

      return {
        id: properties.place_id ?? `${lat}:${lon}:${index}`,
        name,
        address,
        lat,
        lon,
        ...(phone ? { phone } : {}),
        distanceKm: roundDistanceKm(haversineKm(center, { lat, lon })),
      };
    })
    .filter((result): result is VetResult => result !== null);
}

function orderResults(
  results: VetResult[],
  searchType: "location" | "place",
  query: string
) {
  const byDistance = (a: VetResult, b: VetResult) =>
    (a.distanceKm ?? Number.POSITIVE_INFINITY) -
    (b.distanceKm ?? Number.POSITIVE_INFINITY);

  if (searchType === "location") {
    return [...results].sort(byDistance);
  }

  const normalizedQuery = normalizeName(query);
  const matches: VetResult[] = [];
  const misses: VetResult[] = [];

  for (const result of results) {
    const normalizedName = normalizeName(result.name);
    const isNameMatch =
      normalizedName.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedName);

    if (isNameMatch) {
      matches.push(result);
    } else {
      misses.push(result);
    }
  }

  // Final ordering is application-defined: name-match-then-distance for text
  // search, pure distance for location search, not Geoapify relevance ranking.
  return [...matches.sort(byDistance), ...misses.sort(byDistance)];
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}
