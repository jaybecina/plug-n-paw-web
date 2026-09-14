# Find-a-Vet (Web) — Design Spec

Date: 2026-09-14
Status: Approved for implementation planning
Scope: Web only (this repo). Mobile/Expo is a separate project — do not add React Native/Expo code here.

Source context: decisions carried over from prior ChatGPT product/architecture discussion (visual direction "Warm & Friendly", layout "full map + draggable bottom sheet", Geoapify approved as MVP-tier free provider, error-semantics and query-classifier critiques). Web-only simplification made during brainstorming: no shared Expo/Worker contract needed, so backend collapses into a single Next.js Route Handler instead of a separate Cloudflare Worker.

**Before writing any framework code**: this repo runs a modified Next.js (16.3.5). Per `AGENTS.md`, read the relevant guide(s) in `node_modules/next/dist/docs/` first — Route Handlers, `next/dynamic`, caching (`fetch` `next.revalidate`), and metadata APIs may differ from training-data Next.js. Do not assume standard Next.js 14/15 behavior without checking.

---

## 1. Goal

A `/find-vet` page where a user finds nearby veterinary clinics either by:
- typing a free-text query (address, city, or clinic name), or
- tapping "Use my location" (browser Geolocation API, requested only on click — never automatically).

Results render as both a list (cards) and pins on a map, kept in sync in both directions.

## 2. Non-goals (v1)

- No mobile/Expo code in this repo.
- No country restriction/allowlist — search is global.
- No SEO city/country landing pages (`/find-vet/philippines`, etc.) — single `/find-vet` page only.
- No true per-IP rate limiting (no external store like Upstash) — lightweight guardrails only (see §5).
- No "open now" computation — no opening-hours parser in v1. Field exists in the type but is only populated if Geoapify hands back an unambiguous boolean-like signal; otherwise omit it. Do not implement OSM `opening_hours` string parsing.
- No pagination/infinite scroll — flat top-N list, capped at 20 results.
- No debounced live-as-you-type search — search fires only on explicit submit (Enter key or button/"Use my location" click), to keep Geoapify usage low.
- No new test framework — repo has no test runner configured (per `CLAUDE.md`). Verification is manual (dev server) unless the user separately asks for tests.
- No generic `PetService` abstraction — keep `VetResult`/`find-vet` naming. Don't build for hypothetical future service types.

## 3. Architecture

```
Browser (/find-vet page)
   │
   ├─ text query submit, or "Use my location" click (Geolocation API)
   ▼
Next.js Route Handler — GET /api/vets/search
   │  1. Parse + validate query params (zod)
   │  2. Resolve a center point:
   │       - lat/lon given directly → use as-is
   │       - q given → call Geoapify Geocoding API, take first result as center
   │  3. Call Geoapify Places API (category=veterinary) near that center
   │  4. Map response → VetResult[], compute distanceKm (haversine), sort ascending
   │  5. Return SearchResponse JSON
   ▼
Geoapify Geocoding API + Places API (server-side only; API key never sent to client)
```

Caching: the outbound `fetch` calls to Geoapify use Next's built-in fetch cache: `fetch(url, { next: { revalidate: 900 } })` (15 min). This is per-unique-URL, which naturally dedupes repeat identical queries without any KV/Redis. Confirm the exact caching API shape against `node_modules/next/dist/docs/` for this Next version before implementing — the option name/behavior may differ from stock Next.js.

## 4. API contract

### Request

`GET /api/vets/search`

Query params:

| param | type | required | notes |
|---|---|---|---|
| `q` | string | one of `q` or (`lat`+`lon`) required | free text: address, city, or clinic name. Max 100 chars. |
| `lat` | string→number | one of `q` or (`lat`+`lon`) required | must parse as float in `[-90, 90]` |
| `lon` | string→number | required with `lat` | must parse as float in `[-180, 180]` |
| `limit` | string→number | optional | default 20, max 20, min 1 |

Validation errors (bad/missing params, both-or-neither of q/lat+lon, out-of-range values, `q` too long) → `400`.

### Response types

Create `lib/vets/types.ts`:

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
  center: { lat: number; lon: number } | null;
  results: VetResult[];
};

export type SearchErrorResponse = {
  error: {
    code: "VALIDATION_ERROR" | "UPSTREAM_UNAVAILABLE" | "UPSTREAM_TIMEOUT";
    message: string;
  };
};
```

### Status codes

- `200` — success, body is `SearchResponse` (results may be an empty array — that is still success, not an error).
- `400` — validation error, body is `SearchErrorResponse` with code `VALIDATION_ERROR`.
- `502` — Geoapify returned a non-2xx or unparseable response, body `SearchErrorResponse` code `UPSTREAM_UNAVAILABLE`.
- `504` — Geoapify call exceeded the timeout (see §5), body `SearchErrorResponse` code `UPSTREAM_TIMEOUT`.

Never return `200` with a synthetic empty-results-plus-error body for a real upstream failure — this was flagged as a mistake in the prior mobile-era plan. A failed upstream call must produce a non-2xx status.

## 5. Guardrails (lightweight, no external store)

- `q`: trim, max length 100 chars, reject if empty after trim.
- `lat`/`lon`: parse as float, range-check as above.
- `limit`: clamp to `[1, 20]`, default 20.
- Upstream fetch timeout: 8 seconds via `AbortSignal.timeout(8000)` on both the Geocoding and Places calls. Total handler budget is therefore up to ~16s worst case (geocode then places) — acceptable for v1; do not add complexity to parallelize since the two calls are sequentially dependent (places needs the geocoded center).
- No API key, IP list, or request counting — explicitly out of scope for v1 (see §2). If abuse becomes a real problem post-launch, revisit with Upstash Redis free tier (10k commands/day, no card) — do not build this preemptively.

## 6. Geoapify integration details

Base URLs:
- Geocoding: `https://api.geoapify.com/v1/geocode/search`
- Places: `https://api.geoapify.com/v2/places`

API key: `GEOAPIFY_API_KEY` environment variable, read only in the Route Handler (server-side), never exposed to the client bundle. Add to `.env.local` (gitignored) and document in `.env.example`. User must sign up free at geoapify.com (no credit card) to obtain it.

### Step A — resolve center

If `lat`/`lon` provided: center = `{ lat, lon }` directly, skip geocoding.

If `q` provided: call
```
GET https://api.geoapify.com/v1/geocode/search?text={encodeURIComponent(q)}&limit=1&apiKey={GEOAPIFY_API_KEY}
```
Take `features[0].geometry.coordinates` → `[lon, lat]` (GeoJSON order — note the swap) as center. If `features` is empty, return `200` with `SearchResponse { query: q, center: null, results: [] }` (a query that resolves to no location is a valid "no results" outcome, not a validation or upstream error).

### Step B — search places near center

```
GET https://api.geoapify.com/v2/places
  ?categories=healthcare.veterinary
  &filter=circle:{center.lon},{center.lat},20000
  &bias=proximity:{center.lon},{center.lat}
  &limit={limit}
  &apiKey={GEOAPIFY_API_KEY}
```

Radius fixed at 20000 meters (20km) for v1 — not user-configurable, no UI for it.

Verify `categories=healthcare.veterinary` is still the correct current category slug against Geoapify's live Places API categories documentation before implementing — category taxonomies can change; do not hardcode blind if the docs show something different at implementation time.

### Step C — map GeoJSON features to VetResult

Places API returns a `FeatureCollection`. For each `feature`:

| VetResult field | source |
|---|---|
| `id` | `feature.properties.place_id` |
| `name` | `feature.properties.name` — fallback to `feature.properties.address_line1` if `name` is missing |
| `address` | `feature.properties.formatted` |
| `lat` | `feature.geometry.coordinates[1]` |
| `lon` | `feature.geometry.coordinates[0]` |
| `phone` | `feature.properties.contact?.phone ?? feature.properties.phone` — omit key if undefined |
| `distanceKm` | computed server-side via haversine from `center` to `(lat, lon)`, not taken from Geoapify — keeps the contract stable regardless of upstream field changes |
| `openNow` | omit for v1 (see §2 non-goals) |

Sort `results` ascending by `distanceKm` before returning.

## 7. Frontend

### Files

```
app/find-vet/page.tsx                    — server component: metadata (title/description), renders client search experience
components/find-vet/vet-search.tsx       — client "use client" root: owns state via useVetSearch, lays out search bar + map + results
components/find-vet/search-bar.tsx       — text input + submit button + "Use my location" button
components/find-vet/vet-map.tsx          — react-leaflet map, loaded via next/dynamic(ssr:false)
components/find-vet/vet-results.tsx      — card list; side panel on desktop, shadcn Drawer (bottom sheet) on narrow viewport
components/find-vet/vet-card.tsx         — single result card (name, address, distance, phone, "View on map")
hooks/use-vet-search.ts                  — local state + fetch, no React Query (YAGNI per §2)
lib/vets/types.ts                        — VetResult / SearchResponse / SearchErrorResponse (shared by route handler and components)
lib/vets/distance.ts                     — haversine helper, used by the route handler
app/api/vets/search/route.ts             — the Route Handler described in §3-§6
```

### shadcn components to add

Run `npx shadcn add button input card drawer skeleton` (Drawer is the vaul-based component — use it for the mobile bottom sheet; do not hand-roll a draggable sheet).

### Page composition (`app/find-vet/page.tsx`)

Server component. Sets `metadata` (title e.g. "Find a Vet Near You | Pawvia", description). Renders `<VetSearch />` client component. This is the extent of SSR/SEO for v1 — no server-fetched initial results (first load starts empty, prompting the user to search or use location), keeping the handler's caching model simple.

### `useVetSearch()` hook

State: `{ status: "idle" | "loading" | "success" | "error"; data: SearchResponse | null; errorMessage: string | null; selectedId: string | null }`.

Actions: `searchByQuery(q: string)`, `searchByLocation(lat: number, lon: number)`, `select(id: string | null)`.

Both search actions call `fetch('/api/vets/search?...')`, set `loading` immediately, then `success` (store `data`) or `error` (store a user-facing message — see §8 copy). Selecting a result sets `selectedId`, used by both the map (to highlight/pan to the pin) and the results list (to highlight/scroll to the card).

### Map ↔ list sync

- Clicking a `VetCard` calls `select(id)` → map component reacts to `selectedId` change: pans/centers to that marker, opens its popup.
- Clicking a map marker calls `select(id)` → results list reacts: scrolls the corresponding card into view, applies a highlighted style.
- Implement via the shared `selectedId` state in `useVetSearch()`, passed down to both `vet-map.tsx` and `vet-results.tsx` — do not introduce a separate event bus/context for this, prop drilling through `vet-search.tsx` is sufficient at this component depth.

### Responsive layout (`vet-search.tsx`)

- `≥ md` breakpoint: two-column — map fills remaining width, results render as a fixed-width side panel (scrollable card list), matching the approved "full map" concept while using a side panel instead of a sheet where there's room for one.
- `< md` breakpoint: map fills the screen, results render inside a shadcn `Drawer` anchored to the bottom, draggable between a peek height (~15%) and expanded (~80%) — this is the literal "full map + draggable bottom sheet" from the approved design, applied where screen width actually requires it.

### "Use my location" behavior

Button in `search-bar.tsx`. On click only: call `navigator.geolocation.getCurrentPosition(...)`. No permission request on page load. On success, call `searchByLocation(coords.latitude, coords.longitude)`. On permission denial or error, show an inline message near the button (not a full-page error state) — e.g. "Couldn't get your location. Try searching by address instead." — and leave the text search available.

## 8. States & copy

- **Idle** (before first search): friendly empty state inviting a search — e.g. "Search by address, city, or clinic name — or use your location." No API call yet.
- **Loading**: skeleton cards (shadcn `Skeleton`) in the results area; map stays as-is (don't blank it).
- **Success, 0 results**: "No vets found near '{query}'. Try a different search." — this is the `results: []` success case from §6 Step A/B, not an error state.
- **Error** (400/502/504 from the route handler): "We couldn't load nearby vets. Try again." with a retry button that re-runs the last search. Do not surface raw error codes/messages to the user; log them to the console for debugging instead.

## 9. Visual system

Apply the previously approved direction — **Warm & Friendly** (coral/orange primary + teal secondary) with **clean/precise UI discipline** (readable hierarchy, generous whitespace, confident but not garish accents). This repo already has shadcn wired in `base-nova` style with a neutral base color (`components.json`) — override the CSS variable palette in `app/globals.css` rather than reinitializing shadcn.

Do not hardcode a final palette in this spec — run the actual token choices (exact hex/oklch values, font pairing, spacing scale) through the `frontend-design` skill during implementation, using "coral/orange + teal, warm and friendly but clean, not clinical, not a generic SaaS dark theme" as the brief. Support both light and dark mode via CSS variables, consistent with shadcn's convention already present in `globals.css`.

## 10. Error handling summary (route handler)

```
try geocode (if q) → on non-2xx or throw → 502 UPSTREAM_UNAVAILABLE
                     → on AbortError/timeout → 504 UPSTREAM_TIMEOUT
try places search   → same pattern
zod validation failure (params) → 400 VALIDATION_ERROR, before any network call
empty geocode result → 200, results: []  (not an error — see §6 Step A)
```

## 11. Environment / setup

- `.env.local` (gitignored, not committed): `GEOAPIFY_API_KEY=...`
- `.env.example` (committed): `GEOAPIFY_API_KEY=` — placeholder only, no real key.
- User action required outside code: sign up free at geoapify.com, generate an API key, no credit card needed.

## 12. Out-of-scope reminders (do not build these now)

- Cloudflare Worker, Workers KV — not used; Next.js Route Handler + fetch cache replaces both.
- Expo/React Native — separate repo, do not touch here.
- `/find-vet/{country}` or `/find-vet/{country}/{city}` SEO pages.
- Opening-hours parsing.
- Rate limiting infra (Upstash or otherwise).
- React Query/Zustand/Redux.
- Generic multi-service (`PetService`) abstraction.
