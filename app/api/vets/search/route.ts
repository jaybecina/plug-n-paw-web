import { z } from "zod";
import { getGeoapifyApiKey } from "@/lib/vets/config";
import { UpstreamError } from "@/lib/vets/geoapify";
import { searchVets } from "@/lib/vets/search";
import type { SearchErrorResponse } from "@/lib/vets/types";

type ErrorCode = SearchErrorResponse["error"]["code"];

const coordinateSchema = z.coerce.number();

const querySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    lat: coordinateSchema.min(-90).max(90).optional(),
    lon: coordinateSchema.min(-180).max(180).optional(),
  })
  .superRefine((value, ctx) => {
    const hasQuery = Boolean(value.q);
    const hasLat = value.lat !== undefined;
    const hasLon = value.lon !== undefined;
    const hasLocation = hasLat || hasLon;

    if (hasQuery === hasLocation) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either q or lat/lon.",
        path: ["q"],
      });
    }

    if (hasLocation && (!hasLat || !hasLon)) {
      ctx.addIssue({
        code: "custom",
        message: "Latitude and longitude must be provided together.",
        path: ["lat"],
      });
    }
  });

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let status = 200;
  let searchType: "location" | "place" | undefined;

  try {
    const apiKey = getGeoapifyApiKey();
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      lat: url.searchParams.get("lat") ?? undefined,
      lon: url.searchParams.get("lon") ?? undefined,
    });

    if (!parsed.success) {
      status = 400;
      return jsonError(
        "VALIDATION_ERROR",
        "Search needs a valid place or location.",
        requestId,
        status
      );
    }

    const input = parsed.data.q
      ? { type: "query" as const, q: parsed.data.q }
      : {
          type: "location" as const,
          lat: parsed.data.lat as number,
          lon: parsed.data.lon as number,
        };

    searchType = input.type === "query" ? "place" : "location";
    const data = await searchVets(input, apiKey);
    status = 200;

    return Response.json(data, { status });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      status = 504;
      return jsonError(
        "UPSTREAM_TIMEOUT",
        "Search is taking too long. Try again.",
        requestId,
        status
      );
    }

    if (error instanceof UpstreamError) {
      status = 502;
      return jsonError(
        "UPSTREAM_UNAVAILABLE",
        "Search is temporarily unavailable.",
        requestId,
        status
      );
    }

    status = 500;
    return jsonError(
      "CONFIG_ERROR",
      "Search is temporarily unavailable.",
      requestId,
      status
    );
  } finally {
    console.info(
      JSON.stringify({
        scope: "vets.search",
        requestId,
        searchType,
        provider: "geoapify",
        durationMs: Date.now() - startedAt,
        status,
      })
    );
  }
}

function jsonError(
  code: ErrorCode,
  message: string,
  requestId: string,
  status: number
) {
  return Response.json(
    {
      error: {
        code,
        message,
        requestId,
      },
    } satisfies SearchErrorResponse,
    { status }
  );
}

