export type VetResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  phone?: string;
  distanceKm?: number;
  openNow?: boolean;
  /** Raw opening-hours string as provided by the source (e.g. OSM), shown as-is — not parsed or evaluated. */
  hours?: string;
};

export type SearchResponse = {
  query: string;
  center: { lat: number; lon: number; label?: string } | null;
  results: VetResult[];
  meta: {
    searchType: "location" | "place";
    radiusKm: 20;
    locationNotFound?: true;
  };
};

export type SearchErrorResponse = {
  error: {
    code:
      | "VALIDATION_ERROR"
      | "UPSTREAM_UNAVAILABLE"
      | "UPSTREAM_TIMEOUT"
      | "CONFIG_ERROR";
    message: string;
    requestId: string;
  };
};

