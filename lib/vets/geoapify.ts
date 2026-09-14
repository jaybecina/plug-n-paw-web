type GeoapifyFeature = {
  type: "Feature";
  properties?: {
    place_id?: string;
    name?: string;
    address_line1?: string;
    formatted?: string;
    contact?: {
      phone?: string;
    };
    phone?: string;
  };
  geometry?: {
    type: "Point";
    coordinates?: [number, number];
  };
};

export type GeoapifyFeatureCollection = {
  type: "FeatureCollection";
  features?: GeoapifyFeature[];
};

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly details: { call: "geocode" | "places"; status?: number }
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

const GEOCODING_URL = "https://api.geoapify.com/v1/geocode/search";
const PLACES_URL = "https://api.geoapify.com/v2/places";

async function fetchGeoapify(
  url: URL,
  call: "geocode" | "places",
  timeoutMs: number
) {
  try {
    const response = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new UpstreamError("Geoapify returned a non-2xx response", {
        call,
        status: response.status,
      });
    }

    return (await response.json()) as GeoapifyFeatureCollection;
  } catch (error) {
    if (error instanceof UpstreamError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw error;
    }

    throw new UpstreamError("Geoapify returned an unavailable response", {
      call,
    });
  }
}

export async function geoapifyGeocode(text: string, apiKey: string) {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("text", text);
  url.searchParams.set("limit", "1");
  url.searchParams.set("apiKey", apiKey);

  return fetchGeoapify(url, "geocode", 5000);
}

export async function geoapifyPlaces(
  center: { lat: number; lon: number },
  apiKey: string
) {
  const url = new URL(PLACES_URL);
  url.searchParams.set("categories", "pet.veterinary");
  url.searchParams.set("filter", `circle:${center.lon},${center.lat},20000`);
  url.searchParams.set("bias", `proximity:${center.lon},${center.lat}`);
  url.searchParams.set("limit", "20");
  url.searchParams.set("apiKey", apiKey);

  return fetchGeoapify(url, "places", 6000);
}

