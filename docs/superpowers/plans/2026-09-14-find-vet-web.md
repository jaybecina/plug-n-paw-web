# Find-a-Vet (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/find-vet` page — search nearby veterinary clinics by address/city/clinic-name or by browser geolocation, shown as synced map pins + result cards, backed by a Next.js Route Handler that calls Geoapify.

**Architecture:** Browser → `GET /api/vets/search` (Next.js Route Handler, Zod-validated) → `lib/vets/search.ts` (orchestration) → `lib/vets/geoapify.ts` (thin Geoapify fetch wrappers) → Geoapify Geocoding + Places APIs. Frontend is a client-side search experience (`useVetSearch` hook) rendering `react-leaflet` (dynamic, `ssr:false`) + a responsive results list (side panel on desktop, shadcn `Drawer` on mobile).

**Tech Stack:** Next.js 16.3.5 (App Router, this repo's modified build), TypeScript, Tailwind v4, shadcn/ui (`base-nova`), Zod, react-leaflet + Leaflet (OSM tiles), Geoapify (Geocoding + Places APIs, free tier).

**Spec:** `docs/superpowers/specs/2026-09-14-find-vet-web-design.md` (Revision 2) — this plan implements that spec section-by-section; consult it for the *why* behind any decision below.

## Global Constraints

- Web only. Never add React Native/Expo code to this repo (spec §1, Scope).
- No country restriction, no SEO sub-pages beyond a single `/find-vet` page (spec §2).
- No new automated test framework — this repo has none configured (`CLAUDE.md`), and the spec explicitly excludes adding one (spec §2). **Deviation from the writing-plans skill's default TDD step shape**: every task below replaces "write failing test → implement → pass" with "write code → verify manually (curl / browser / throwaway script) → commit." This is a deliberate, spec-approved substitution, not a shortcut.
- No client-controlled `limit`, no pagination, no live-as-you-type search, no opening-hours parsing, no Upstash/rate-limiting infra, no React Query/Zustand/Redux, no generic `PetService` abstraction, no radius auto-escalation (spec §2, §12).
- Category slug is `pet.veterinary` (verified against live Geoapify docs 2026-09-14 — spec §13). Radius fixed at 20km. `limit=20` server-side constant.
- User-facing copy says "veterinary clinics," not "vets." No "best vets" framing — results are nearest-by-distance (+ name-match boost for text search), not quality-ranked (spec §8).
- **Next.js version check already done for this plan**: `next.config.ts` in this repo does NOT have `cacheComponents: true` set, so the *previous* caching/rendering model applies (confirmed against `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` and `.../03-api-reference/04-functions/fetch.md`) — `fetch(url, { next: { revalidate } })` and default-dynamic `GET` Route Handlers behave as in stock Next.js 14/15. The code in this plan assumes that. If a future change enables `cacheComponents`, re-read `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` before touching `route.ts` again.
- `.gitignore` currently has a blanket `.env*` rule, which would also hide `.env.example` from git. Task 1 fixes this with a `!.env.example` negation — don't skip that step or the example file silently won't get committed.

---

## Task 1: Dependencies, Geoapify account, env files

**Files:**
- Modify: `package.json`, `yarn.lock` (via `yarn add`)
- Modify: `.gitignore`
- Create: `.env.example`
- Create (local only, not committed): `.env.local`

**Interfaces:**
- Produces: `GEOAPIFY_API_KEY` available via `process.env` for all later tasks; `zod`, `leaflet`, `react-leaflet` available as imports; shadcn `button`, `input`, `card`, `drawer`, `skeleton` components available under `components/ui/`.

- [ ] **Step 1: Install runtime dependencies**

```bash
yarn add zod leaflet react-leaflet
yarn add -D @types/leaflet
```

- [ ] **Step 2: Add the shadcn components this feature needs**

```bash
npx shadcn add button input card drawer skeleton
```

This writes into `components/ui/` (and pulls in `vaul` as a dependency of `drawer`). If it prompts for overwrite confirmation on any file, keep existing shadcn config (`components.json`) as-is — decline any prompt that would change unrelated existing components.

- [ ] **Step 3: Fix `.gitignore` so `.env.example` is trackable**

Open `.gitignore` and change:
```
# env files (can opt-in for committing if needed)
.env*
```
to:
```
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

- [ ] **Step 4: Create `.env.example`**

```
GEOAPIFY_API_KEY=
```

- [ ] **Step 5: Sign up for a free Geoapify API key**

Go to https://www.geoapify.com/, create a free account (no credit card required), create a project, copy the API key.

- [ ] **Step 6: Create `.env.local` (not committed) with the real key**

```
GEOAPIFY_API_KEY=<the key from Step 5>
```

- [ ] **Step 7: Verify the key + category slug against the real Geoapify API before writing any app code**

Run (replace `YOUR_KEY`, this checks Places API near Manila with a 20km circle, matching the exact category/filter shape this feature will use):

```bash
curl -s "https://api.geoapify.com/v2/places?categories=pet.veterinary&filter=circle:120.9842,14.5995,20000&bias=proximity:120.9842,14.5995&limit=5&apiKey=YOUR_KEY" | head -c 2000
```

Expected: HTTP 200, a JSON body with `"type": "FeatureCollection"` and a non-empty `"features"` array. If you get an auth error, the key isn't active yet (can take a minute after signup) — wait and retry. If `features` is empty, try a different `filter` circle (e.g. a major city you know has vet clinics in OSM data) before concluding something is broken — Places API coverage is OSM-based and can be sparse in some areas.

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock .gitignore .env.example components.json components/ui
git commit -m "chore: add find-vet dependencies, shadcn components, env scaffolding"
```

(`.env.local` is gitignored and must NOT be committed — double check `git status` shows it untracked.)

---

## Task 2: Shared types + haversine distance helper

**Files:**
- Create: `lib/vets/types.ts`
- Create: `lib/vets/distance.ts`

**Interfaces:**
- Produces: `VetResult`, `SearchResponse`, `SearchErrorResponse` types (consumed by every later task); `haversineDistanceKm(a, b): number` and `roundDistanceKm(km): number` (consumed by Task 4).

- [ ] **Step 1: Write `lib/vets/types.ts`**

```ts
export type VetResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  phone?: string;
  distanceKm?: number;
  openNow?: boolean;
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
    code: "VALIDATION_ERROR" | "UPSTREAM_UNAVAILABLE" | "UPSTREAM_TIMEOUT" | "CONFIG_ERROR";
    message: string;
    requestId: string;
  };
};
```

- [ ] **Step 2: Write `lib/vets/distance.ts`**

```ts
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

export function roundDistanceKm(km: number): number {
  return Math.round(km * 10) / 10;
}
```

- [ ] **Step 3: Sanity-check the math with a throwaway script (not committed)**

Create a scratch file (use your scratchpad directory, not the repo) `verify-distance.mjs`:

```js
const EARTH_RADIUS_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

const nyc = { lat: 40.7128, lon: -74.006 };
const la = { lat: 34.0522, lon: -118.2437 };
console.log("NYC-LA km:", haversineKm(nyc, la));

const manila = { lat: 14.5995, lon: 120.9842 };
const qc = { lat: 14.676, lon: 121.0437 };
console.log("Manila-QC km:", haversineKm(manila, qc));
```

Run: `node verify-distance.mjs`

Expected: `NYC-LA km: ~3935.7` and `Manila-QC km: ~10.6` (these are the real great-circle distances — if your numbers are wildly different, the formula was transcribed wrong; re-check against `lib/vets/distance.ts`). Delete the scratch file when done — it's not part of the repo.

- [ ] **Step 4: Type-check**

Run: `yarn lint`
Expected: no errors from the two new files.

- [ ] **Step 5: Commit**

```bash
git add lib/vets/types.ts lib/vets/distance.ts
git commit -m "feat: add vet search types and haversine distance helper"
```

---

## Task 3: Geoapify config + thin fetch wrappers

**Files:**
- Create: `lib/vets/config.ts`
- Create: `lib/vets/geoapify.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (reads `process.env.GEOAPIFY_API_KEY` directly).
- Produces: `getGeoapifyApiKey(): string` (throws if unset); `GeoapifyRequestError` (class, `.kind: "timeout" | "upstream"`); `geoapifyGeocode(text: string): Promise<GeoapifyGeocodeFeature | null>`; `geoapifyPlaces(center: {lat:number; lon:number}): Promise<GeoapifyPlaceFeature[]>`; `GeoapifyPlaceFeature` type — all consumed by Task 4.

- [ ] **Step 1: Write `lib/vets/config.ts`**

```ts
export function getGeoapifyApiKey(): string {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) {
    throw new Error("GEOAPIFY_API_KEY is not configured");
  }
  return key;
}
```

- [ ] **Step 2: Write `lib/vets/geoapify.ts`**

```ts
import { getGeoapifyApiKey } from "./config";

const GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";
const PLACES_URL = "https://api.geoapify.com/v2/places";
const RESULT_LIMIT = 20;
const RADIUS_METERS = 20000;
const GEOCODE_TIMEOUT_MS = 5000;
const PLACES_TIMEOUT_MS = 6000;
const CACHE_REVALIDATE_SECONDS = 900;

export type GeoapifyGeocodeFeature = {
  geometry: { coordinates: [number, number] };
  properties: { formatted?: string };
};

type GeoapifyGeocodeResponse = {
  features: GeoapifyGeocodeFeature[];
};

export type GeoapifyPlaceFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    place_id: string;
    name?: string;
    address_line1?: string;
    formatted: string;
    phone?: string;
    contact?: { phone?: string };
  };
};

type GeoapifyPlacesResponse = {
  features: GeoapifyPlaceFeature[];
};

export class GeoapifyRequestError extends Error {
  public readonly kind: "timeout" | "upstream";

  constructor(message: string, kind: "timeout" | "upstream") {
    super(message);
    this.name = "GeoapifyRequestError";
    this.kind = kind;
  }
}

async function geoapifyFetch(url: string, timeoutMs: number): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: CACHE_REVALIDATE_SECONDS },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new GeoapifyRequestError("Geoapify request timed out", "timeout");
    }
    throw new GeoapifyRequestError("Geoapify request failed", "upstream");
  }

  if (!response.ok) {
    throw new GeoapifyRequestError(
      `Geoapify responded with status ${response.status}`,
      "upstream"
    );
  }

  return response;
}

export async function geoapifyGeocode(
  text: string
): Promise<GeoapifyGeocodeFeature | null> {
  const url = `${GEOCODE_URL}?text=${encodeURIComponent(text)}&limit=1&apiKey=${getGeoapifyApiKey()}`;
  const response = await geoapifyFetch(url, GEOCODE_TIMEOUT_MS);
  const data = (await response.json()) as GeoapifyGeocodeResponse;
  return data.features[0] ?? null;
}

export async function geoapifyPlaces(center: {
  lat: number;
  lon: number;
}): Promise<GeoapifyPlaceFeature[]> {
  const url =
    `${PLACES_URL}?categories=pet.veterinary` +
    `&filter=circle:${center.lon},${center.lat},${RADIUS_METERS}` +
    `&bias=proximity:${center.lon},${center.lat}` +
    `&limit=${RESULT_LIMIT}` +
    `&apiKey=${getGeoapifyApiKey()}`;
  const response = await geoapifyFetch(url, PLACES_TIMEOUT_MS);
  const data = (await response.json()) as GeoapifyPlacesResponse;
  return data.features;
}
```

- [ ] **Step 3: Verify against the real Geoapify API with a throwaway script**

This uses `npx -y tsx` (downloads an ephemeral runner, does not modify `package.json`) so you can execute the TypeScript file directly. Create in your scratchpad directory `verify-geoapify.ts`:

```ts
import { geoapifyGeocode, geoapifyPlaces } from "/absolute/path/to/repo/lib/vets/geoapify";

async function main() {
  const feature = await geoapifyGeocode("Manila, Philippines");
  console.log("geocode result:", feature);

  if (feature) {
    const [lon, lat] = feature.geometry.coordinates;
    const places = await geoapifyPlaces({ lat, lon });
    console.log("places count:", places.length);
    console.log("first place:", places[0]);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run (from the repo root, with `.env.local` loaded — e.g. `set -a && source .env.local && set +a` first, or prefix with `GEOAPIFY_API_KEY=...`):

```bash
npx -y tsx /path/to/scratchpad/verify-geoapify.ts
```

Expected: `geocode result:` prints a feature object with `geometry.coordinates` and `properties.formatted` looking like `"Manila, Philippines"` (or similar); `places count:` is greater than 0. If `geocode result: null`, the text search failed — check the key. Delete the scratch file when done.

- [ ] **Step 4: Type-check**

Run: `yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/vets/config.ts lib/vets/geoapify.ts
git commit -m "feat: add Geoapify config validation and fetch wrappers"
```

---

## Task 4: Search orchestration (center resolution, mapping, name-boost ranking)

**Files:**
- Create: `lib/vets/search.ts`

**Interfaces:**
- Consumes: `geoapifyGeocode`, `geoapifyPlaces`, `GeoapifyRequestError`, `GeoapifyPlaceFeature` from `lib/vets/geoapify.ts` (Task 3); `haversineDistanceKm`, `roundDistanceKm` from `lib/vets/distance.ts` (Task 2); `VetResult`, `SearchResponse` from `lib/vets/types.ts` (Task 2).
- Produces: `SearchParams` type (`{ mode: "location"; lat: number; lon: number } | { mode: "place"; q: string }`); `searchVets(params: SearchParams): Promise<SearchResponse>` — consumed by Task 5's route handler.

- [ ] **Step 1: Write `lib/vets/search.ts`**

```ts
import { geoapifyGeocode, geoapifyPlaces, type GeoapifyPlaceFeature } from "./geoapify";
import { haversineDistanceKm, roundDistanceKm } from "./distance";
import type { SearchResponse, VetResult } from "./types";

const RADIUS_KM = 20;

export type SearchParams =
  | { mode: "location"; lat: number; lon: number }
  | { mode: "place"; q: string };

function roundCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function mapFeatureToVetResult(
  feature: GeoapifyPlaceFeature,
  center: { lat: number; lon: number }
): VetResult {
  const [lon, lat] = feature.geometry.coordinates;

  const result: VetResult = {
    id: feature.properties.place_id,
    name: feature.properties.name ?? feature.properties.address_line1 ?? "Veterinary clinic",
    address: feature.properties.formatted,
    lat,
    lon,
    distanceKm: roundDistanceKm(haversineDistanceKm(center, { lat, lon })),
  };

  const phone = feature.properties.contact?.phone ?? feature.properties.phone;
  if (phone) {
    result.phone = phone;
  }

  return result;
}

function isNameMatch(query: string, result: VetResult): boolean {
  const q = query.trim().toLowerCase();
  const name = result.name.trim().toLowerCase();
  if (!q || !name) return false;
  return name.includes(q) || q.includes(name);
}

function byDistanceAscending(a: VetResult, b: VetResult): number {
  return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
}

function rankResults(results: VetResult[], q: string | null): VetResult[] {
  if (!q) {
    return [...results].sort(byDistanceAscending);
  }

  const matches: VetResult[] = [];
  const rest: VetResult[] = [];
  for (const result of results) {
    (isNameMatch(q, result) ? matches : rest).push(result);
  }

  matches.sort(byDistanceAscending);
  rest.sort(byDistanceAscending);

  return [...matches, ...rest];
}

export async function searchVets(params: SearchParams): Promise<SearchResponse> {
  let center: { lat: number; lon: number };
  let label: string | undefined;

  if (params.mode === "location") {
    center = { lat: roundCoordinate(params.lat), lon: roundCoordinate(params.lon) };
  } else {
    const feature = await geoapifyGeocode(params.q);
    if (!feature) {
      return {
        query: params.q,
        center: null,
        results: [],
        meta: { searchType: "place", radiusKm: RADIUS_KM, locationNotFound: true },
      };
    }
    const [lon, lat] = feature.geometry.coordinates;
    center = { lat: roundCoordinate(lat), lon: roundCoordinate(lon) };
    label = feature.properties.formatted;
  }

  const features = await geoapifyPlaces(center);
  const mapped = features.map((feature) => mapFeatureToVetResult(feature, center));
  const q = params.mode === "place" ? params.q : null;
  const results = rankResults(mapped, q);

  // Final ordering is application-defined: name-match-then-distance for text
  // search, pure distance for location search — not Geoapify's internal
  // relevance ranking (spec §6 Step C).
  return {
    query: params.mode === "place" ? params.q : "",
    center: label ? { ...center, label } : center,
    results,
    meta: { searchType: params.mode, radiusKm: RADIUS_KM },
  };
}
```

- [ ] **Step 2: Verify with a throwaway script**

Extend (or replace) the scratch script from Task 3 in your scratchpad directory as `verify-search.ts`:

```ts
import { searchVets } from "/absolute/path/to/repo/lib/vets/search";

async function main() {
  const byLocation = await searchVets({ mode: "location", lat: 14.5995, lon: 120.9842 });
  console.log("by location — center:", byLocation.center, "count:", byLocation.results.length);
  console.log("first 3 (should be distance-ascending):", byLocation.results.slice(0, 3));

  const byPlace = await searchVets({ mode: "place", q: "Manila" });
  console.log("by place — center:", byPlace.center, "meta:", byPlace.meta);

  const notFound = await searchVets({ mode: "place", q: "asdkfjhaslkdjfhqwoeiruqwoiuadsf" });
  console.log("not found — meta:", notFound.meta, "results:", notFound.results.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run: `npx -y tsx /path/to/scratchpad/verify-search.ts` (with `GEOAPIFY_API_KEY` in the environment as in Task 3).

Expected: `by location` returns a `center` with no `label` and results sorted ascending by `distanceKm`; `by place` returns a `center` with a `label` string containing something like "Manila"; `not found` returns `meta: { searchType: "place", radiusKm: 20, locationNotFound: true }` and `results: 0`. Delete the scratch file when done.

- [ ] **Step 3: Type-check**

Run: `yarn lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/vets/search.ts
git commit -m "feat: add vet search orchestration with name-boost ranking"
```

---

## Task 5: API Route Handler

**Files:**
- Create: `app/api/vets/search/route.ts`

**Interfaces:**
- Consumes: `searchVets`, `SearchParams` from `lib/vets/search.ts` (Task 4); `GeoapifyRequestError` from `lib/vets/geoapify.ts` (Task 3); `SearchErrorResponse` from `lib/vets/types.ts` (Task 2).
- Produces: `GET /api/vets/search` HTTP endpoint — consumed by Task 7's `useVetSearch` hook.

- [ ] **Step 1: Write `app/api/vets/search/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchVets, type SearchParams } from "@/lib/vets/search";
import { GeoapifyRequestError } from "@/lib/vets/geoapify";
import type { SearchErrorResponse } from "@/lib/vets/types";

const querySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lon: z.coerce.number().min(-180).max(180).optional(),
  })
  .refine((value) => {
    const hasLat = value.lat !== undefined;
    const hasLon = value.lon !== undefined;
    if (hasLat !== hasLon) return false; // partial coords, invalid
    const hasCoords = hasLat && hasLon;
    const hasQuery = Boolean(value.q);
    return hasQuery !== hasCoords; // exactly one search mode
  }, { message: "Provide either q, or both lat and lon" });

function errorResponse(
  status: number,
  code: SearchErrorResponse["error"]["code"],
  message: string,
  requestId: string
): NextResponse<SearchErrorResponse> {
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  if (!process.env.GEOAPIFY_API_KEY) {
    console.error(
      JSON.stringify({ scope: "vets.search", requestId, status: 500, errorCode: "CONFIG_ERROR" })
    );
    return errorResponse(500, "CONFIG_ERROR", "Search is temporarily unavailable.", requestId);
  }

  const parsed = querySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    lat: request.nextUrl.searchParams.get("lat") ?? undefined,
    lon: request.nextUrl.searchParams.get("lon") ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid search parameters.", requestId);
  }

  const params: SearchParams = parsed.data.q
    ? { mode: "place", q: parsed.data.q }
    : { mode: "location", lat: parsed.data.lat as number, lon: parsed.data.lon as number };

  try {
    const result = await searchVets(params);
    console.info(
      JSON.stringify({
        scope: "vets.search",
        requestId,
        searchType: params.mode,
        provider: "geoapify",
        durationMs: Date.now() - startedAt,
        resultCount: result.results.length,
        status: 200,
      })
    );
    return NextResponse.json(result);
  } catch (err) {
    const isTimeout = err instanceof GeoapifyRequestError && err.kind === "timeout";
    const status = isTimeout ? 504 : 502;
    const code = isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE";
    console.error(
      JSON.stringify({
        scope: "vets.search",
        requestId,
        searchType: params.mode,
        provider: "geoapify",
        durationMs: Date.now() - startedAt,
        status,
        errorCode: code,
        detail: err instanceof Error ? err.message : "unknown error",
      })
    );
    return errorResponse(status, code, "We couldn't load nearby veterinary clinics.", requestId);
  }
}
```

- [ ] **Step 2: Start the dev server**

Run: `yarn dev` (leave running in a background terminal for the rest of this task)

- [ ] **Step 3: Verify — valid text query**

```bash
curl -s "http://localhost:3000/api/vets/search?q=Manila" | head -c 1000
```

Expected: HTTP 200 (check with `-i` if you want headers), JSON with `center.label` containing something like "Manila", `meta.searchType: "place"`, and `results` an array.

- [ ] **Step 4: Verify — valid location query**

```bash
curl -s "http://localhost:3000/api/vets/search?lat=14.5995&lon=120.9842" | head -c 1000
```

Expected: 200, `center` without a `label`, `meta.searchType: "location"`.

- [ ] **Step 5: Verify — validation errors (400)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/vets/search"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/vets/search?q=Manila&lat=14.5995"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/vets/search?lat=999&lon=0"
```

Expected: `400` for all three (no params; both q and partial coords; out-of-range lat).

- [ ] **Step 6: Verify — location not found (still 200)**

```bash
curl -s "http://localhost:3000/api/vets/search?q=asdkfjhaslkdjfhqwoeiruqwoiuadsf"
```

Expected: 200, `meta.locationNotFound: true`, `results: []`.

- [ ] **Step 7: Verify — config error (500)**

Temporarily stop the dev server, comment out or rename `GEOAPIFY_API_KEY` in `.env.local`, restart `yarn dev`, then:

```bash
curl -s -i "http://localhost:3000/api/vets/search?q=Manila" | head -20
```

Expected: `500`, body `error.code: "CONFIG_ERROR"`. Restore `.env.local` and restart the dev server afterward.

- [ ] **Step 8: Commit**

```bash
git add app/api/vets/search/route.ts
git commit -m "feat: add /api/vets/search route handler"
```

---

## Task 6: `/find-vet` page shell

**Files:**
- Create: `app/find-vet/page.tsx`
- Create: `components/find-vet/vet-search.tsx` (placeholder client root for now — filled in fully by Task 7)

**Interfaces:**
- Produces: `<VetSearch />` client component export from `components/find-vet/vet-search.tsx`, rendered by `app/find-vet/page.tsx` — Task 7 replaces this file's contents, doesn't change its export shape.

- [ ] **Step 1: Write `app/find-vet/page.tsx`**

```tsx
import type { Metadata } from "next";
import { VetSearch } from "@/components/find-vet/vet-search";

export const metadata: Metadata = {
  title: "Find a Vet Near You | Pawvia",
  description:
    "Search for veterinary clinics near you by address, city, or clinic name, or use your current location.",
};

export default function FindVetPage() {
  return <VetSearch />;
}
```

- [ ] **Step 2: Write a placeholder `components/find-vet/vet-search.tsx`**

```tsx
"use client";

export function VetSearch() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Find a Vet</h1>
      <p className="text-muted-foreground">Search coming in the next task.</p>
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run `yarn dev`, open `http://localhost:3000/find-vet`.

Expected: page loads without errors, shows "Find a Vet" heading, browser tab title reads "Find a Vet Near You | Pawvia".

- [ ] **Step 4: Commit**

```bash
git add app/find-vet/page.tsx components/find-vet/vet-search.tsx
git commit -m "feat: add /find-vet page shell"
```

---

## Task 7: `useVetSearch` hook + search bar

**Files:**
- Create: `hooks/use-vet-search.ts`
- Create: `components/find-vet/search-bar.tsx`
- Modify: `components/find-vet/vet-search.tsx`

**Interfaces:**
- Consumes: `SearchResponse` from `lib/vets/types.ts` (Task 2); `GET /api/vets/search` (Task 5).
- Produces: `useVetSearch()` hook returning `{ status, data, errorCode, selectedId, select, searchByQuery, searchByLocation, retry }` — consumed by Task 8 and Task 9. `<SearchBar>` component — consumed by `vet-search.tsx`.

- [ ] **Step 1: Write `hooks/use-vet-search.ts`**

```ts
"use client";

import { useCallback, useRef, useState } from "react";
import type { SearchResponse } from "@/lib/vets/types";

type Status = "idle" | "loading" | "success" | "error";

type ErrorCode = "SEARCH_FAILED" | "LOCATION_PERMISSION_DENIED" | "LOCATION_UNAVAILABLE";

type LastSearch =
  | { type: "query"; q: string }
  | { type: "location"; lat: number; lon: number };

export function useVetSearch() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const lastSearchRef = useRef<LastSearch | null>(null);

  const runSearch = useCallback(async (params: URLSearchParams) => {
    setStatus("loading");
    setErrorCode(null);
    try {
      const response = await fetch(`/api/vets/search?${params.toString()}`);
      if (!response.ok) {
        setStatus("error");
        setErrorCode("SEARCH_FAILED");
        return;
      }
      const json = (await response.json()) as SearchResponse;
      setData(json);
      setSelectedId(null);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorCode("SEARCH_FAILED");
    }
  }, []);

  const searchByQuery = useCallback(
    (q: string) => {
      lastSearchRef.current = { type: "query", q };
      const params = new URLSearchParams({ q });
      void runSearch(params);
    },
    [runSearch]
  );

  const searchByLocation = useCallback(
    (lat: number, lon: number) => {
      lastSearchRef.current = { type: "location", lat, lon };
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
      void runSearch(params);
    },
    [runSearch]
  );

  const retry = useCallback(() => {
    const last = lastSearchRef.current;
    if (!last) return;
    if (last.type === "query") {
      searchByQuery(last.q);
    } else {
      searchByLocation(last.lat, last.lon);
    }
  }, [searchByQuery, searchByLocation]);

  const setLocationError = useCallback((code: "LOCATION_PERMISSION_DENIED" | "LOCATION_UNAVAILABLE") => {
    setErrorCode(code);
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  return {
    status,
    data,
    errorCode,
    selectedId,
    select,
    searchByQuery,
    searchByLocation,
    retry,
    setLocationError,
  };
}

export type UseVetSearch = ReturnType<typeof useVetSearch>;
```

- [ ] **Step 2: Write `components/find-vet/search-bar.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UseVetSearch } from "@/hooks/use-vet-search";

type SearchBarProps = {
  vetSearch: UseVetSearch;
};

export function SearchBar({ vetSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLocationMessage(null);
    vetSearch.searchByQuery(trimmed);
  }

  function handleUseLocation() {
    setLocationMessage(null);
    if (!("geolocation" in navigator)) {
      vetSearch.setLocationError("LOCATION_UNAVAILABLE");
      setLocationMessage("Couldn't get your location. Try searching by address instead.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        vetSearch.searchByLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          vetSearch.setLocationError("LOCATION_PERMISSION_DENIED");
          setLocationMessage("Location access denied. Try searching by address instead.");
        } else {
          vetSearch.setLocationError("LOCATION_UNAVAILABLE");
          setLocationMessage("Couldn't get your location. Try searching by address instead.");
        }
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="vet-search-input" className="sr-only">
          Search by address, city, or clinic name
        </label>
        <Input
          id="vet-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by address, city, or clinic name"
          maxLength={100}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Search</Button>
        <Button type="button" variant="secondary" onClick={handleUseLocation}>
          Use my location
        </Button>
      </div>
      {locationMessage && (
        <p role="status" className="text-sm text-muted-foreground sm:basis-full">
          {locationMessage}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Replace `components/find-vet/vet-search.tsx` with the wired-up version**

```tsx
"use client";

import { useVetSearch } from "@/hooks/use-vet-search";
import { SearchBar } from "@/components/find-vet/search-bar";

export function VetSearch() {
  const vetSearch = useVetSearch();

  return (
    <main className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Find a Vet</h1>
      <SearchBar vetSearch={vetSearch} />

      {vetSearch.status === "idle" && (
        <p className="text-muted-foreground">
          Search by address, city, or clinic name — or use your location.
        </p>
      )}
      {vetSearch.status === "loading" && <p aria-live="polite">Loading veterinary clinics…</p>}
      {vetSearch.status === "error" && (
        <p aria-live="polite" className="text-destructive">
          We couldn't load nearby veterinary clinics. Try again.
        </p>
      )}
      {vetSearch.status === "success" && vetSearch.data && (
        <pre className="overflow-x-auto rounded bg-muted p-4 text-xs">
          {JSON.stringify(vetSearch.data, null, 2)}
        </pre>
      )}
    </main>
  );
}
```

(This `<pre>` JSON dump is a deliberate temporary placeholder for *this task only* — Task 8 replaces it with real result cards. It exists so this task's deliverable — hook + search bar wired to the real API — is independently visible and testable before the UI is built.)

- [ ] **Step 4: Verify in the browser**

Run `yarn dev`, open `http://localhost:3000/find-vet`.

- Type "Manila" and click Search → loading text appears, then a JSON dump with `center.label` and `results`.
- Click "Use my location" → browser permission prompt appears; on Allow, a JSON dump with `meta.searchType: "location"`. On Deny, inline message "Location access denied. Try searching by address instead." appears instead.
- Stop the dev server, temporarily break `GEOAPIFY_API_KEY` in `.env.local`, restart, search again → "We couldn't load nearby veterinary clinics. Try again." appears. Restore the key and restart afterward.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-vet-search.ts components/find-vet/search-bar.tsx components/find-vet/vet-search.tsx
git commit -m "feat: add useVetSearch hook and search bar"
```

---

## Task 8: Result cards + responsive list (side panel / drawer)

**Files:**
- Create: `components/find-vet/vet-card.tsx`
- Create: `components/find-vet/vet-results.tsx`
- Modify: `components/find-vet/vet-search.tsx`

**Interfaces:**
- Consumes: `UseVetSearch` from `hooks/use-vet-search.ts` (Task 7); `VetResult` from `lib/vets/types.ts` (Task 2).
- Produces: `<VetResults vetSearch={...} />` — consumed by `vet-search.tsx` now, and by Task 9 (map needs the same `selectedId`/`select` from `vetSearch`, passed as a sibling).

- [ ] **Step 1: Write `components/find-vet/vet-card.tsx`**

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { VetResult } from "@/lib/vets/types";
import { cn } from "@/lib/utils";

type VetCardProps = {
  result: VetResult;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function VetCard({ result, selected, onSelect }: VetCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(result.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(result.id);
        }
      }}
      className={cn(
        "cursor-pointer transition-colors",
        selected && "border-primary ring-1 ring-primary"
      )}
    >
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="font-medium">{result.name}</span>
        <span className="text-sm text-muted-foreground">{result.address}</span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {result.distanceKm !== undefined && <span>{result.distanceKm} km</span>}
          {result.phone && <span>{result.phone}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Write `components/find-vet/vet-results.tsx`**

```tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { VetCard } from "@/components/find-vet/vet-card";
import type { UseVetSearch } from "@/hooks/use-vet-search";

type VetResultsProps = {
  vetSearch: UseVetSearch;
};

function ResultsBody({ vetSearch }: VetResultsProps) {
  if (vetSearch.status === "idle") {
    return (
      <p className="p-4 text-muted-foreground">
        Search by address, city, or clinic name — or use your location.
      </p>
    );
  }

  if (vetSearch.status === "loading") {
    return (
      <div className="flex flex-col gap-3 p-4" aria-live="polite">
        <span className="sr-only">Loading veterinary clinics…</span>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (vetSearch.status === "error") {
    return (
      <div className="flex flex-col gap-2 p-4" aria-live="polite">
        <p className="text-destructive">We couldn't load nearby veterinary clinics. Try again.</p>
        <button
          type="button"
          onClick={vetSearch.retry}
          className="w-fit text-sm underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const data = vetSearch.data;
  if (!data) return null;

  if (data.meta.locationNotFound) {
    return (
      <p className="p-4 text-muted-foreground" aria-live="polite">
        We couldn't find that location. Try a city, address, or clinic name.
      </p>
    );
  }

  if (data.results.length === 0) {
    return (
      <p className="p-4 text-muted-foreground" aria-live="polite">
        No veterinary clinics found within {data.meta.radiusKm}km of &quot;{data.query}&quot;. Try
        a different search.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {data.center?.label && (
        <p className="text-sm text-muted-foreground">Searching near {data.center.label}</p>
      )}
      <p className="sr-only" aria-live="polite">
        {data.results.length} veterinary clinics found
      </p>
      {data.results.map((result) => (
        <VetCard
          key={result.id}
          result={result}
          selected={vetSearch.selectedId === result.id}
          onSelect={vetSearch.select}
        />
      ))}
    </div>
  );
}

export function VetResults({ vetSearch }: VetResultsProps) {
  return (
    <>
      {/* Desktop / tablet: fixed-width side panel */}
      <div className="hidden w-96 shrink-0 overflow-y-auto border-l md:block">
        <ResultsBody vetSearch={vetSearch} />
      </div>

      {/* Mobile: results render below the map for now — Task 9 upgrades this
          to a draggable shadcn/vaul Drawer once the map exists to drag over. */}
      <div className="overflow-y-auto md:hidden">
        <ResultsBody vetSearch={vetSearch} />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire `<VetResults>` into `components/find-vet/vet-search.tsx`**

Replace the file's contents:

```tsx
"use client";

import { useVetSearch } from "@/hooks/use-vet-search";
import { SearchBar } from "@/components/find-vet/search-bar";
import { VetResults } from "@/components/find-vet/vet-results";

export function VetSearch() {
  const vetSearch = useVetSearch();

  return (
    <main className="flex h-screen flex-col">
      <div className="border-b p-4">
        <h1 className="mb-2 text-2xl font-semibold">Find a Vet</h1>
        <SearchBar vetSearch={vetSearch} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Map placeholder — Task 9 replaces this with <VetMap /> */}
        <div className="hidden flex-1 items-center justify-center bg-muted md:flex">
          <span className="text-muted-foreground">Map coming in the next task</span>
        </div>
        <VetResults vetSearch={vetSearch} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify in the browser at both widths**

Run `yarn dev`, open `http://localhost:3000/find-vet`.

- At a desktop width (>768px): search "Manila" → cards appear in a right-hand side panel next to the map placeholder. Click a card → it gets a highlighted border (`aria-current` — check via devtools Elements panel or screen reader).
- Resize to a mobile width (<768px, or use devtools device toolbar): the map placeholder disappears (`hidden md:flex`), cards render full-width below the header.
- Trigger the empty-results state (search something like "zzzzznotarealqueryzzzz" that geocodes but has no nearby vets, or the location-not-found state with a nonsense string) and the error state (break the API key again) — confirm each shows its distinct copy from spec §8.

- [ ] **Step 5: Commit**

```bash
git add components/find-vet/vet-card.tsx components/find-vet/vet-results.tsx components/find-vet/vet-search.tsx
git commit -m "feat: add vet result cards and responsive results list"
```

---

## Task 9: Map (react-leaflet) + map/list sync + Drawer for mobile

**Files:**
- Create: `components/find-vet/vet-map.tsx`
- Modify: `components/find-vet/vet-results.tsx`
- Modify: `components/find-vet/vet-search.tsx`

**Interfaces:**
- Consumes: `UseVetSearch` (Task 7); `VetResult` (Task 2); shadcn `Drawer` primitives from `components/ui/drawer.tsx` (Task 1) and `vaul` (installed as its dependency).
- Produces: `<VetMap vetSearch={...} ref={mapRef} />` with an imperative `invalidateSize()` method — used only within `vet-search.tsx`.

- [ ] **Step 1: Check the installed `vaul` version's snap-point API before writing the drawer code**

```bash
cat node_modules/vaul/package.json | grep '"version"'
```

Read `node_modules/vaul/dist/index.d.mts` (or `.d.ts`) for the current `Drawer.Root` props — specifically `snapPoints`, `activeSnapPoint`, `setActiveSnapPoint`, `modal`, `dismissible`. The code below is written against vaul's documented snap-point pattern (controlled `activeSnapPoint` + `snapPoints` array of fractions); if the installed version's prop names differ, adjust Step 3 accordingly rather than blindly pasting — this is the one piece of this plan explicitly flagged as needing a live check (spec §7, "treat as an implementation spike").

- [ ] **Step 2: Write `components/find-vet/vet-map.tsx`**

```tsx
"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { UseVetSearch } from "@/hooks/use-vet-search";

export type VetMapHandle = {
  invalidateSize: () => void;
};

type VetMapProps = {
  vetSearch: UseVetSearch;
};

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const RESULT_ZOOM = 13;

function MapController({ vetSearch, mapRef }: VetMapProps & { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  useEffect(() => {
    if (!vetSearch.selectedId || !vetSearch.data) return;
    const selected = vetSearch.data.results.find((r) => r.id === vetSearch.selectedId);
    if (selected) {
      map.setView([selected.lat, selected.lon], RESULT_ZOOM);
    }
  }, [vetSearch.selectedId, vetSearch.data, map]);

  useEffect(() => {
    if (vetSearch.status === "success" && vetSearch.data?.center) {
      map.setView([vetSearch.data.center.lat, vetSearch.data.center.lon], RESULT_ZOOM);
    }
  }, [vetSearch.status, vetSearch.data, map]);

  return null;
}

export const VetMap = forwardRef<VetMapHandle, VetMapProps>(function VetMap(
  { vetSearch },
  ref
) {
  const mapRef = useRef<LeafletMap | null>(null);

  useImperativeHandle(ref, () => ({
    invalidateSize: () => {
      mapRef.current?.invalidateSize();
    },
  }));

  const results = vetSearch.data?.results ?? [];

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController vetSearch={vetSearch} mapRef={mapRef} />
      {results.map((result) => (
        <Marker
          key={result.id}
          position={[result.lat, result.lon]}
          eventHandlers={{ click: () => vetSearch.select(result.id) }}
        >
          <Popup>{result.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});
```

- [ ] **Step 3: Update `components/find-vet/vet-results.tsx`'s mobile block to use a draggable `Drawer` with snap points**

Replace the mobile block (the `<div className="overflow-y-auto md:hidden">...</div>` at the end of `VetResults`) — keep `ResultsBody` and everything else unchanged:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { VetCard } from "@/components/find-vet/vet-card";
import type { UseVetSearch } from "@/hooks/use-vet-search";

type VetResultsProps = {
  vetSearch: UseVetSearch;
  onMobileSnapChange?: () => void;
};

// ...(ResultsBody unchanged from Step 2 of Task 8 — keep it as-is)...

export function VetResults({ vetSearch, onMobileSnapChange }: VetResultsProps) {
  const PEEK = 0.15;
  const EXPANDED = 0.8;
  const [snap, setSnap] = useState<number | string | null>(PEEK);

  useEffect(() => {
    // Let the drawer's own transition (vaul's default) finish, then tell the
    // map its container size changed — Leaflet renders gray tiles otherwise.
    const timeout = setTimeout(() => {
      onMobileSnapChange?.();
    }, 350);
    return () => clearTimeout(timeout);
  }, [snap, onMobileSnapChange]);

  return (
    <>
      <div className="hidden w-96 shrink-0 overflow-y-auto border-l md:block">
        <ResultsBody vetSearch={vetSearch} />
      </div>

      <div className="md:hidden">
        <Drawer
          open
          modal={false}
          dismissible={false}
          snapPoints={[PEEK, EXPANDED]}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
        >
          <DrawerContent className="max-h-[85vh]">
            <ResultsBody vetSearch={vetSearch} />
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
```

If the installed vaul version's props from Step 1 differ from `snapPoints`/`activeSnapPoint`/`setActiveSnapPoint`/`modal`/`dismissible`, adjust the props here to match — the behavior goal (always-visible, draggable between a ~15% peek and ~80% expanded height, not user-dismissible) stays the same regardless of exact prop names. If dragging fights with the map's touch gestures (test in Step 5), fall back to a plain two-state toggle: a small "Expand results" / "Collapse" button that flips `snap` between `PEEK` and `EXPANDED` without drag, per spec §7's documented fallback.

- [ ] **Step 4: Wire `<VetMap>` into `components/find-vet/vet-search.tsx`, replacing the placeholder, loaded via `next/dynamic`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useVetSearch } from "@/hooks/use-vet-search";
import { SearchBar } from "@/components/find-vet/search-bar";
import { VetResults } from "@/components/find-vet/vet-results";
import type { VetMapHandle } from "@/components/find-vet/vet-map";

const VetMap = dynamic(
  () => import("@/components/find-vet/vet-map").then((mod) => mod.VetMap),
  { ssr: false }
);

export function VetSearch() {
  const vetSearch = useVetSearch();
  const mapRef = useRef<VetMapHandle>(null);

  return (
    <main className="flex h-screen flex-col">
      <div className="border-b p-4">
        <h1 className="mb-2 text-2xl font-semibold">Find a Vet</h1>
        <SearchBar vetSearch={vetSearch} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <VetMap ref={mapRef} vetSearch={vetSearch} />
        </div>
        <VetResults
          vetSearch={vetSearch}
          onMobileSnapChange={() => mapRef.current?.invalidateSize()}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify in the browser**

Run `yarn dev`, open `http://localhost:3000/find-vet`.

- Desktop width: search "Manila" → map shows tiles + pins, side panel shows cards. Click a card → map pans/zooms to that marker and opens its popup. Click a marker → its popup opens and the matching card gets the `aria-current` highlight (check Elements panel).
- Mobile width (devtools device toolbar, or a real phone if available): map fills the screen, a drawer is visible at the bottom in its peek state. Drag it up toward the expanded state — confirm it doesn't fight with map panning underneath (if it does, apply the toggle-button fallback from Step 3 and re-verify). After dragging, confirm the map tiles still look correct (no gray/misaligned tiles) — this is what `invalidateSize()` is for.
- Confirm the map renders without any SSR-related console error (this is what `next/dynamic(ssr:false)` prevents) — check the browser console.

- [ ] **Step 6: Commit**

```bash
git add components/find-vet/vet-map.tsx components/find-vet/vet-results.tsx components/find-vet/vet-search.tsx
git commit -m "feat: add react-leaflet map with map/list sync and mobile drawer"
```

---

## Task 10: Visual system, accessibility pass, final copy check

**Files:**
- Modify: `app/globals.css`
- Modify: `components/find-vet/*.tsx` (copy/accessibility touch-ups only, no new files)

**Interfaces:** None — this task doesn't change any function/type signature from earlier tasks, only visual tokens and copy strings.

- [ ] **Step 1: Invoke the `frontend-design` skill for the actual palette**

Brief: "coral/orange + teal, warm and friendly but clean, not clinical, not a generic SaaS dark theme" (spec §9). Apply the resulting token choices (exact `oklch()`/hex values, any font pairing changes) to the `:root` and `.dark` blocks in `app/globals.css`, keeping the existing variable *names* (`--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, etc. — see the block below) so shadcn components keep working unmodified.

If for any reason the skill isn't invoked at execution time, use this starting palette instead of leaving the existing grayscale shadcn defaults in place (grayscale contradicts the approved "Warm & Friendly" direction — spec §9 — so shipping without *some* color pass is not acceptable):

```css
:root {
  --background: oklch(0.99 0.005 60);
  --foreground: oklch(0.18 0.01 40);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.01 40);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.01 40);
  --primary: oklch(0.68 0.19 41);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.6 0.09 195);
  --secondary-foreground: oklch(0.99 0 0);
  --muted: oklch(0.96 0.01 60);
  --muted-foreground: oklch(0.5 0.02 50);
  --accent: oklch(0.93 0.04 41);
  --accent-foreground: oklch(0.3 0.05 41);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.9 0.01 50);
  --input: oklch(0.9 0.01 50);
  --ring: oklch(0.68 0.19 41);
}

.dark {
  --background: oklch(0.16 0.01 40);
  --foreground: oklch(0.96 0.005 60);
  --card: oklch(0.21 0.01 40);
  --card-foreground: oklch(0.96 0.005 60);
  --popover: oklch(0.21 0.01 40);
  --popover-foreground: oklch(0.96 0.005 60);
  --primary: oklch(0.72 0.17 41);
  --primary-foreground: oklch(0.15 0 0);
  --secondary: oklch(0.55 0.08 195);
  --secondary-foreground: oklch(0.97 0 0);
  --muted: oklch(0.27 0.01 40);
  --muted-foreground: oklch(0.7 0.02 50);
  --accent: oklch(0.3 0.05 41);
  --accent-foreground: oklch(0.9 0.03 41);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.72 0.17 41);
}
```

Leave `--chart-*`, `--sidebar-*`, and `--radius*` variables as-is — unused by this feature.

- [ ] **Step 2: Verify light/dark mode**

Run `yarn dev`, open `http://localhost:3000/find-vet`. Toggle the OS/browser color scheme (or however this app's dark mode is triggered — check `app/layout.tsx`/existing theme setup) and confirm both light and dark render with the new coral/teal palette, readable contrast on buttons and the selected-card highlight.

- [ ] **Step 3: Accessibility pass — verify each item from spec §7**

- Tab through the page with keyboard only: search input is reachable and labeled (inspect — the `sr-only` `<label>` from Task 7 should be present in the accessibility tree), result cards are focusable and Enter/Space selects them (Task 8's `tabIndex`/`onKeyDown`), the selected card is announced (check `aria-current` in devtools Accessibility panel).
- Confirm the loading/result-count/error `aria-live` regions from Tasks 7–8 fire (use a screen reader if available, or watch the Accessibility tree update live in devtools while triggering each state).
- Confirm the map is never the *only* way to reach a result — the card list must always be present alongside it (true by construction from Task 8/9, just re-confirm nothing later broke it).

- [ ] **Step 4: Final copy check against spec §8**

Trigger every state and confirm the exact copy matches spec §8: idle, loading, success-with-results, success-zero-results (mentions the 20km radius), location-not-found (distinct from zero-results), error, location-permission-denied, location-unavailable. Fix any string that drifted during earlier tasks.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/find-vet
git commit -m "feat: apply warm/friendly visual system and accessibility pass to find-vet"
```

---

## Self-Review Notes (completed while writing this plan)

- **Spec coverage**: §1 (goal) — Tasks 6-9. §2 (non-goals) — respected throughout, called out in Global Constraints. §3 (architecture/caching) — Task 3 (`geoapifyFetch`'s `next.revalidate`), verified against local Next docs. §4 (contract) — Task 2 (types), Task 5 (status codes). §5 (guardrails) — Task 5 (zod schema, timeouts, config check). §6 (Geoapify integration) — Tasks 3-4. §7 (frontend, accessibility) — Tasks 6-9, Task 10 Step 3. §8 (copy) — Tasks 7-8, Task 10 Step 4. §9 (visual) — Task 10. §10 (error handling/observability) — Task 5. §11 (env) — Task 1. §12/§13 — reflected in Global Constraints and Task 5/3 category slug.
- **Type consistency checked**: `VetResult`/`SearchResponse`/`SearchErrorResponse` (Task 2) used identically in Tasks 3-9. `SearchParams` (Task 4) matches its consumption in Task 5. `UseVetSearch` return shape (Task 7) matches every later consumer (`vetSearch.status`, `.data`, `.errorCode`, `.selectedId`, `.select`, `.searchByQuery`, `.searchByLocation`, `.retry`, `.setLocationError`) — verified no renamed fields across Tasks 8-9. `GeoapifyRequestError.kind` (Task 3) matches the `isTimeout` check in Task 5.
- **No placeholders**: the only deliberately deferred content is Task 10's palette (explicitly not a placeholder — spec §9 forbids hardcoding it early, and Task 10 supplies real fallback values plus the mechanism to get better ones) and Task 9 Step 1's vaul-version check (a real verification step, not an unwritten one — the code that follows is complete either way).
