# Find-a-Vet (Web) — Design Spec

Date: 2026-09-14
Status: Approved for implementation planning (Revision 2)
Scope: Web only (this repo). Mobile/Expo is a separate project — do not add React Native/Expo code here.

Source context: decisions carried over from prior ChatGPT product/architecture discussion (visual direction "Warm & Friendly", layout "full map + draggable bottom sheet", Geoapify approved as MVP-tier free provider, error-semantics and query-classifier critiques). Web-only simplification made during brainstorming: no shared Expo/Worker contract needed, so backend collapses into a single Next.js Route Handler instead of a separate Cloudflare Worker.

Revision 2 folds in a second (implementation-focused) ChatGPT review. Each claim from that review was checked against live Geoapify docs before being accepted — see §13 for what was verified vs. rejected. Points that were just restating existing decisions, or that reopened a decision already made explicitly with the user this session (e.g. rate limiting), were not changed.

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
- No dedicated business-name search flow or query classifier (address vs. city vs. clinic name). Verified Geoapify Places API does have a `name` param for name filtering, but its match semantics (hard filter vs. fuzzy) aren't documented precisely enough to depend on for v1. Instead: one geocode + one category search (as already designed), with a deterministic client-side name-boost re-rank of the results already returned (§6 Step C) — zero extra requests, no classifier, still meaningfully improves "Banfield Pet Hospital"-style queries.
- No confidence-threshold rejection of geocoding results. Geoapify returns a `rank.confidence` object, but v1 doesn't branch on it — it just surfaces the resolved location's label (`center.label`) so the UI can show what was matched and the user can self-correct if it's wrong.

## 3. Architecture

```
Browser (/find-vet page)
   │
   ├─ text query submit, or "Use my location" click (Geolocation API)
   ▼
Next.js Route Handler — app/api/vets/search/route.ts
   │  1. Validate GEOAPIFY_API_KEY is configured → 500 CONFIG_ERROR if not
   │  2. Parse + validate query params (zod)
   │  3. requestId = crypto.randomUUID()
   │  4. Call searchVets() from lib/vets/search.ts
   │  5. Map result/error → HTTP response, log one structured line (§ Observability)
   ▼
lib/vets/search.ts — orchestration, no HTTP concerns
   │  resolveSearchCenter(): lat/lon given → use as-is (searchType "location")
   │                         q given → geoapifyGeocode(q) → first result (searchType "place")
   │  searchNearbyVets(center): geoapifyPlaces(center, PET_VETERINARY_CATEGORY)
   │                            → normalize to VetResult[] (distance, name-boost rerank, sort)
   ▼
lib/vets/geoapify.ts — thin fetch wrappers only (geoapifyGeocode, geoapifyPlaces)
   ▼
Geoapify Geocoding API + Places API (server-side only; API key never sent to client)
```

This is a one-provider project, not a multi-provider abstraction — `lib/vets/geoapify.ts` exists to keep `route.ts` free of URL-building/fetch details, not to support swapping providers later.

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

No client-controlled `limit` — the UI has no pagination/result-count control, so `limit=20` is a server-side constant (`lib/vets/search.ts`), not request surface. Smaller API surface, one less thing to validate.

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
  distanceKm?: number; // rounded to 1 decimal place before being placed in the response
  openNow?: boolean;
};

export type SearchResponse = {
  query: string;
  center: { lat: number; lon: number; label?: string } | null; // label = geocode result's `formatted` field, e.g. "Manila, Philippines" — lets the UI show "Searching near {label}"
  results: VetResult[];
  meta: {
    searchType: "location" | "place"; // "location" = lat/lon path, "place" = q/geocode path
    radiusKm: 20; // fixed for v1, see §2 non-goals — not escalated automatically when empty
    locationNotFound?: true; // set when q was given but geocoding returned zero features — distinct from "valid location, zero clinics" (see §6 Step A, §8)
  };
};

export type SearchErrorResponse = {
  error: {
    code: "VALIDATION_ERROR" | "UPSTREAM_UNAVAILABLE" | "UPSTREAM_TIMEOUT" | "CONFIG_ERROR";
    message: string; // safe, user-displayable text — never raw upstream error detail
    requestId: string; // crypto.randomUUID(), also present in the matching server log line, for support/debugging — never expose the API key, URL, or stack trace here
  };
};
```

### Status codes

- `200` — success, body is `SearchResponse` (results may be an empty array — that is still success, not an error).
- `400` — validation error, body is `SearchErrorResponse` with code `VALIDATION_ERROR`.
- `502` — Geoapify returned a non-2xx or unparseable response, body `SearchErrorResponse` code `UPSTREAM_UNAVAILABLE`.
- `504` — Geoapify call exceeded the timeout (see §5), body `SearchErrorResponse` code `UPSTREAM_TIMEOUT`.
- `500` — `GEOAPIFY_API_KEY` is missing/empty at request time, body `SearchErrorResponse` code `CONFIG_ERROR`, message something generic like "Search is temporarily unavailable." Fail loudly server-side (structured log), never let a missing key silently surface as a confusing `UPSTREAM_UNAVAILABLE`.

Never return `200` with a synthetic empty-results-plus-error body for a real upstream failure — this was flagged as a mistake in the prior mobile-era plan. A failed upstream call must produce a non-2xx status.

## 5. Guardrails (lightweight, no external store)

- `q`: trim, max length 100 chars, reject if empty after trim.
- `lat`/`lon`: parse as float, range-check as above.
- `limit`: fixed server-side constant `20`, not a request param (see §4).
- `GEOAPIFY_API_KEY` presence checked at the top of the handler, before any parsing — missing key is a `500 CONFIG_ERROR`, not an upstream failure (§4, §10).
- Upstream fetch timeouts: `AbortSignal.timeout(5000)` for the Geocoding call, `AbortSignal.timeout(6000)` for the Places call. Worst case ~11s (geocode then places, sequential) — tighter than an earlier 8s+8s draft, still generous enough for a free-tier provider without leaving a search spinning for 16s. Do not parallelize: Places needs the geocoded center, so the calls are genuinely sequential, not just conservatively so.
- No API key, IP list, or request counting — explicitly out of scope for v1 (see §2), and already discussed directly with the user this session (chose "lightweight guardrails only" over adding Upstash). Not reopened here. If abuse becomes a real problem post-launch, revisit with Upstash Redis free tier (10k commands/day, no card) — do not build this preemptively.

## 6. Geoapify integration details

Base URLs:
- Geocoding: `https://api.geoapify.com/v1/geocode/search`
- Places: `https://api.geoapify.com/v2/places`

API key: `GEOAPIFY_API_KEY` environment variable, read only in the Route Handler (server-side), never exposed to the client bundle. Add to `.env.local` (gitignored) and document in `.env.example`. User must sign up free at geoapify.com (no credit card) to obtain it.

### Step A — resolve center

If `lat`/`lon` provided: center = `{ lat, lon }` directly (`searchType: "location"`), skip geocoding, `center.label` omitted.

If `q` provided (`searchType: "place"`): call
```
GET https://api.geoapify.com/v1/geocode/search?text={encodeURIComponent(q)}&limit=1&apiKey={GEOAPIFY_API_KEY}
```
Geoapify's geocoder resolves both addresses/places AND named points of interest (verified: `result_type` can be `"amenity"`, and a `category` field is present for POI-type matches) — so a business-name query like "Banfield Pet Hospital" can resolve directly to that place, not just to a generic address. Take `features[0]`:
- `coordinates` → `[lon, lat]` (GeoJSON order — note the swap) as center.
- `formatted` → `center.label`, so the UI can show "Searching near {label}".
- Do not branch on `rank.confidence` (it exists on the response but v1 doesn't threshold on it — see §2) — just pass the label through so a bad match is visible to the user rather than silently acted on.

If `features` is empty: return `200` with `SearchResponse { query: q, center: null, results: [], meta: { searchType: "place", radiusKm: 20, locationNotFound: true } }`. This is a distinct case from "valid location, zero nearby clinics" — the UI copy differs (§8).

Round the resolved center's `lat`/`lon` to 3 decimal places (≈111m precision — plenty for a 20km-radius search) before using it in Step B. This is what makes Next's per-URL fetch cache (§3) actually pay off for nearby GPS coordinates that would otherwise each mint a distinct cache key (e.g. `14.599512` vs `14.599498`).

### Step B — search places near center

```
GET https://api.geoapify.com/v2/places
  ?categories=pet.veterinary
  &filter=circle:{center.lon},{center.lat},20000
  &bias=proximity:{center.lon},{center.lat}
  &limit=20
  &apiKey={GEOAPIFY_API_KEY}
```

Radius fixed at 20000 meters (20km) for v1 — not user-configurable, no UI for it, no auto-escalation when empty (§2). `limit=20` is the server-side constant from §4, not client input.

Category slug: `pet.veterinary` — verified 2026-09-14 against Geoapify's live Places API docs (an earlier draft of this spec had it as `healthcare.veterinary`, which is wrong). Geoapify's category taxonomy can still change over time; if this feature is built much later than the spec date, do a quick re-check before trusting this blind.

Geoapify's Places API does have a `name` param for name-based filtering, confirmed to exist — but its match behavior (exact vs. fuzzy, hard filter vs. rank boost) isn't documented precisely enough to depend on. v1 does not use it; see Step C's name-boost instead.

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
| `distanceKm` | computed server-side via haversine from `center` to `(lat, lon)`, rounded to 1 decimal place — not taken from Geoapify, keeps the contract stable regardless of upstream field changes |
| `openNow` | omit for v1 (see §2 non-goals) |

**Ranking** (`searchType: "place"` only): after mapping, partition results into two groups by a case-insensitive substring check between `q` and each result's `name` (`name` includes `q`, or `q` includes `name`, after trimming both) — matches first, non-matches after. Sort each group ascending by `distanceKm`. This is the "clinic name search" fix: no classifier, no extra request, just re-ranking data already fetched, so "Banfield Pet Hospital" surfaces a name match ahead of closer-but-unrelated clinics when one exists nearby. For `searchType: "location"`, skip this — plain ascending distance sort.

Document this plainly in code comments as "final ordering is application-defined (name-match-then-distance for text search, pure distance for location search) — not Geoapify's internal relevance ranking."

## 7. Frontend

### Files

```
app/find-vet/page.tsx                    — server component: metadata (title/description), renders client search experience
components/find-vet/vet-search.tsx       — client "use client" root: owns state via useVetSearch, lays out search bar + map + results
components/find-vet/search-bar.tsx       — text input (with a real <label>, not placeholder-only) + submit button + "Use my location" button
components/find-vet/vet-map.tsx          — react-leaflet map, loaded via next/dynamic(ssr:false)
components/find-vet/vet-results.tsx      — card list; side panel on desktop, shadcn Drawer (bottom sheet) on narrow viewport
components/find-vet/vet-card.tsx         — single result card (name, address, distance, phone, "View on map")
hooks/use-vet-search.ts                  — local state + fetch, no React Query (YAGNI per §2)
lib/vets/types.ts                        — VetResult / SearchResponse / SearchErrorResponse (shared by route handler and components)
lib/vets/distance.ts                     — haversine helper
lib/vets/config.ts                       — reads + validates GEOAPIFY_API_KEY, throws a clear error if missing
lib/vets/geoapify.ts                     — thin fetch wrappers: geoapifyGeocode(text), geoapifyPlaces(center)
lib/vets/search.ts                       — orchestration: resolveSearchCenter(), searchNearbyVets() (name-boost rerank, distance sort) — see §3, §6
app/api/vets/search/route.ts             — thin handler: config check, zod validation, requestId, calls lib/vets/search.ts, maps result/error to HTTP + logs one structured line
```

### shadcn components to add

Run `npx shadcn add button input card drawer skeleton` (Drawer is the vaul-based component — use it for the mobile bottom sheet; do not hand-roll a draggable sheet).

### Page composition (`app/find-vet/page.tsx`)

Server component. Sets `metadata` (title e.g. "Find a Vet Near You | Pawvia", description). Renders `<VetSearch />` client component. This is the extent of SSR/SEO for v1 — no server-fetched initial results (first load starts empty, prompting the user to search or use location), keeping the handler's caching model simple.

### `useVetSearch()` hook

State: `{ status: "idle" | "loading" | "success" | "error"; data: SearchResponse | null; errorCode: "SEARCH_FAILED" | "LOCATION_PERMISSION_DENIED" | "LOCATION_UNAVAILABLE" | null; selectedId: string | null; lastSearch: { type: "query"; q: string } | { type: "location"; lat: number; lon: number } | null }`.

Actions: `searchByQuery(q: string)`, `searchByLocation(lat: number, lon: number)`, `select(id: string | null)`, `retry()` (re-runs `lastSearch`, used by the error state's retry button — see §8).

Both search actions store their args in `lastSearch`, call `fetch('/api/vets/search?...')`, set `loading` immediately, then `success` (store `data`) or `error` with `errorCode: "SEARCH_FAILED"` (any non-2xx from the route handler — the specific 400/502/504/500 distinction is for server logs, not the UI, per §8). Selecting a result sets `selectedId`, used by both the map (to highlight/pan to the pin) and the results list (to highlight/scroll to the card). Click-only — do not wire hover events to `select()`, to avoid `scrollIntoView()` firing on every marker hover.

`LOCATION_PERMISSION_DENIED` / `LOCATION_UNAVAILABLE` are set directly by `search-bar.tsx`'s geolocation callback (not by `searchByLocation`, which only runs on success) — see below.

### Map ↔ list sync

- Clicking a `VetCard` calls `select(id)` → map component reacts to `selectedId` change: pans/centers to that marker, opens its popup.
- Clicking a map marker calls `select(id)` → results list reacts: scrolls the corresponding card into view, applies a highlighted style.
- Implement via the shared `selectedId` state in `useVetSearch()`, passed down to both `vet-map.tsx` and `vet-results.tsx` — do not introduce a separate event bus/context for this, prop drilling through `vet-search.tsx` is sufficient at this component depth.

### Responsive layout (`vet-search.tsx`)

- `≥ md` breakpoint: two-column — map fills remaining width, results render as a fixed-width side panel (scrollable card list), matching the approved "full map" concept while using a side panel instead of a sheet where there's room for one.
- `< md` breakpoint: map fills the screen, results render inside a shadcn `Drawer` anchored to the bottom, draggable between a peek height (~15%) and expanded (~80%) — this is the literal "full map + draggable bottom sheet" from the approved design, applied where screen width actually requires it.
- Treat the mobile Drawer-over-map interaction as a small implementation spike, not a guaranteed drop-in: verify on a real mobile viewport (or device emulation) that dragging the Drawer doesn't fight with Leaflet's own touch/pan gestures, and that the safe-area/keyboard-open cases look reasonable. If it doesn't hold up, fall back to a simpler fixed peek/expanded toggle (button, not drag) rather than over-investing in gesture tuning.
- Leaflet must be told when its container resizes, or it renders gray/misaligned tiles. Call `mapRef.current?.invalidateSize()` whenever the Drawer's open/expanded state changes (vaul's `onOpenChange`/snap-point callback) and on any other event that changes the map container's height.

### "Use my location" behavior

Button in `search-bar.tsx`. On click only: call `navigator.geolocation.getCurrentPosition(...)`. No permission request on page load. On success, call `searchByLocation(coords.latitude, coords.longitude)`.

On error, map `GeolocationPositionError.code` to a distinct state — don't collapse these into one generic message, they need different copy:
- `1` (`PERMISSION_DENIED`) → `LOCATION_PERMISSION_DENIED` — "Location access denied. Try searching by address instead."
- `2` (`POSITION_UNAVAILABLE`) or `3` (`TIMEOUT`) → `LOCATION_UNAVAILABLE` — "Couldn't get your location. Try searching by address instead."

Both render as an inline message near the button (not a full-page error state), and leave the text search available. These are separate from `SEARCH_FAILED` (a server/API error) — don't reuse the same error UI or copy for both.

### Accessibility

- Search input has a real associated `<label>` (visually can be compact, but present in the DOM) — not placeholder-only.
- Result cards are keyboard-focusable (`tabIndex`/native button semantics) and activate `select()` on Enter/click, not click-only — the map must never be the only way to reach a result.
- The selected card gets `aria-current="true"` (or `aria-selected`, pick one and use it consistently) so assistive tech announces the current selection.
- A polite live region (`aria-live="polite"`) announces loading/result-count/error transitions (e.g. "Loading veterinary clinics…", "12 veterinary clinics found", "We couldn't load veterinary clinics").
- shadcn's `Drawer` (vaul) has its own focus-trap/Escape handling by default — verify its actual behavior at implementation time rather than assuming; don't hand-roll a replacement unless it's demonstrably missing.

## 8. States & copy

Use "veterinary clinics" in user-facing copy (not the bare word "vets") — reads more professional and translates better globally. `VetResult`/`find-vet` stay as internal/code naming (§2) — this is a copy guideline only. Results are nearest-by-distance, not quality-ranked — don't phrase copy as "best vets near you," since the algorithm makes no quality claim (§6 Step C ranking is name-match-then-distance, nothing else).

- **Idle** (before first search): friendly empty state inviting a search — e.g. "Search by address, city, or clinic name — or use your location." No API call yet.
- **Loading**: skeleton cards (shadcn `Skeleton`) in the results area; map stays as-is (don't blank it). Announce via `aria-live` (§7 Accessibility).
- **Success, 0 results** (`meta.locationNotFound` absent): "No veterinary clinics found within 20km of '{query}'. Try a different search." — this is the `results: []` success case from §6 Step B, not an error state. Naming the fixed radius here is deliberate — it's the honest reason nothing came back (§2), not a hidden implementation detail.
- **Location not found** (`meta.locationNotFound: true`): distinct copy — "We couldn't find that location. Try a city, address, or clinic name." This is a different situation from "valid location, zero clinics nearby" and should read differently (§6 Step A, §4).
- **Resolved location shown**: when `center.label` is present, show "Searching near {label}" above the results so the user can tell what the query actually matched (§6 Step A) and rephrase if it guessed wrong (e.g. an ambiguous city name).
- **Error** (`errorCode: "SEARCH_FAILED"`, i.e. any 400/500/502/504 from the route handler): "We couldn't load nearby veterinary clinics. Try again." with a retry button that calls `retry()` (§7). Do not surface raw error codes/messages/`requestId` to the user; those are for server logs only (§10).
- **Location errors** (`LOCATION_PERMISSION_DENIED` / `LOCATION_UNAVAILABLE`): inline near the "Use my location" button, per §7 — not this section's full-results-area error state.

## 9. Visual system

Apply the previously approved direction — **Warm & Friendly** (coral/orange primary + teal secondary) with **clean/precise UI discipline** (readable hierarchy, generous whitespace, confident but not garish accents). This repo already has shadcn wired in `base-nova` style with a neutral base color (`components.json`) — override the CSS variable palette in `app/globals.css` rather than reinitializing shadcn.

Do not hardcode a final palette in this spec — run the actual token choices (exact hex/oklch values, font pairing, spacing scale) through the `frontend-design` skill during implementation, using "coral/orange + teal, warm and friendly but clean, not clinical, not a generic SaaS dark theme" as the brief. Support both light and dark mode via CSS variables, consistent with shadcn's convention already present in `globals.css`.

## 10. Error handling summary (route handler)

```
requestId = crypto.randomUUID()                              — first line of the handler
config check: GEOAPIFY_API_KEY missing/empty → 500 CONFIG_ERROR (before any parsing)
zod validation failure (params) → 400 VALIDATION_ERROR, before any network call
try geocode (if q) → on non-2xx or throw → 502 UPSTREAM_UNAVAILABLE
                     → on AbortError/timeout → 504 UPSTREAM_TIMEOUT
                     → empty features → 200, results: [], meta.locationNotFound: true  (not an error — see §6 Step A)
try places search   → same non-2xx/timeout pattern as geocode
success or error, log one structured line either way (see Observability below), then respond
```

Every `SearchErrorResponse` carries the same `requestId` that was logged server-side — that's the support/debugging thread, not exposing internals to the client (§4).

### Observability

One structured log line per request from `route.ts` (plain `console.info(JSON.stringify({...}))` — no logging library needed for this volume):

```json
{ "scope": "vets.search", "requestId": "...", "searchType": "location|place", "provider": "geoapify", "durationMs": 482, "resultCount": 17, "status": 200 }
```

On error, same shape plus `errorCode` and enough detail to debug (upstream HTTP status, which call failed) — but never the API key, the full upstream URL (it contains the key as a query param), or a raw stack trace. If logging the user's raw query or coordinates ever feels sensitive, that's a signal to revisit — not a v1 blocker given this is a public search feature with no accounts.

## 11. Environment / setup

- `.env.local` (gitignored, not committed): `GEOAPIFY_API_KEY=...`
- `.env.example` (committed): `GEOAPIFY_API_KEY=` — placeholder only, no real key.
- User action required outside code: sign up free at geoapify.com, generate an API key, no credit card needed.
- `lib/vets/config.ts` reads `process.env.GEOAPIFY_API_KEY` and is the single place that decides "configured or not" — the route handler calls it and returns `500 CONFIG_ERROR` on failure (§4, §10) rather than letting `undefined` silently flow into a Geoapify URL and surface as a confusing `UPSTREAM_UNAVAILABLE` later.

## 12. Out-of-scope reminders (do not build these now)

- Cloudflare Worker, Workers KV — not used; Next.js Route Handler + fetch cache replaces both.
- Expo/React Native — separate repo, do not touch here.
- `/find-vet/{country}` or `/find-vet/{country}/{city}` SEO pages.
- Opening-hours parsing.
- Rate limiting infra (Upstash or otherwise) — deliberate v1 tradeoff, already decided with the user this session; the existing guardrails (§5) are the accepted mitigation, not a placeholder for "later this same spec."
- React Query/Zustand/Redux.
- Generic multi-service (`PetService`) abstraction.
- Automatic radius escalation (5km→10km→25km→50km) when a search comes back empty — fixed 20km for v1 (§2, §6 Step B).
- Depending on Geoapify Places' `name` param or `rank.confidence` thresholding — both exist and were verified, but v1 uses the simpler client-side name-boost rerank and unconditional label pass-through instead (§2, §6).
- `website`/`category` fields on `VetResult` — plausible future additions, not needed by anything in this spec; add only when a concrete UI need shows up.

## 13. Verification log (2026-09-14)

Claims from the ChatGPT implementation review were checked against Geoapify's live docs (`apidocs.geoapify.com`) before being folded into this revision, rather than trusted secondhand:

| Claim | Result |
|---|---|
| Places category for veterinary is `healthcare.veterinary` (original spec draft) | **Wrong.** Confirmed correct slug is `pet.veterinary`. Fixed in §6 Step B. |
| Places API has a `name` param for name-based filtering | **True**, exists. Exact match semantics undocumented at the level needed to depend on — used as a noted alternative, not the v1 mechanism (§6 Step B). |
| Geocoding response includes a `rank` object with `confidence`/`match_type` | **True.** v1 deliberately doesn't threshold on it (§2) but does surface `formatted` as `center.label`. |
| Geocoding resolves named POIs/businesses, not just addresses (`result_type: "amenity"`, `category` field) | **True.** This is why a business-name query can still resolve to a usable center in Step A without a separate business-search endpoint. |
| Places API request shape (`categories`, `filter`, `bias`, `limit`) | Confirmed as originally specified — unchanged. |

Not independently re-verified (accepted on the review's engineering merits, not on an unverifiable factual claim): coordinate-rounding cache benefit, timeout budget reduction, requestId/structured logging, accessibility gaps, Drawer/`invalidateSize()` risk. These are standard practices, not provider-specific facts, so there was nothing external to check.
