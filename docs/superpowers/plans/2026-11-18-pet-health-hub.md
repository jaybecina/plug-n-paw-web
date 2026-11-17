# Pet Health Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Plug N Paw into a free pet-health hub (find a vet, symptom checker, food safety, guides, emergency, Plus teaser) with a competitive landing page, ready for organic traffic.

**Architecture:** Typed content modules in `content/`, pure logic in `lib/` (unit-tested with Vitest), statically generated App Router pages, client components only where interaction needs them. Existing Find-a-Vet stack (`app/api/vets/search`, `lib/vets/*`, `hooks/use-vet-search.ts`) is extended, not rewritten.

**Tech Stack:** Next.js 16.3.5 (modified — read `node_modules/next/dist/docs/` first), React 19, TypeScript, Tailwind v4, shadcn/ui `base-nova` (Base UI), lucide-react, zod, Vitest, yarn.

**Spec:** `docs/superpowers/specs/2026-11-18-pet-health-hub-design.md`

## Global Constraints

- No fabricated social proof: no testimonials, star ratings, user counts, press logos, vet names. Numbers shown must be true product facts.
- No form that collects data and discards it. Plus "Notify me" = `mailto:hello@plugnpaw.com?subject=Plug%20N%20Paw%20Plus%20waitlist`.
- Every health page (symptom checker, food pages, guides, emergency) shows the disclaimer: "General information only — not a substitute for advice from a veterinarian."
- Symptom checker page also states its rules are "not reviewed by a veterinarian".
- US English spelling ("diarrhea", "behavior"); US hotlines with "US only, fees may apply"; ASPCA Animal Poison Control `(888) 426-4435`, Pet Poison Helpline `(855) 764-7661`.
- Brand tokens in `app/globals.css` stay (paper bg, pumpkin-clay primary, pine-teal secondary, Fredoka headings, Inter body); extend only. No purple/blue gradients, no emoji icons.
- Geolocation only after a user click (landing "Use my location" → `/find-vet?locate=1` counts as that click).
- Severity labels: routine "Routine veterinary attention", soon "See a vet soon", urgent "Urgent veterinary attention", emergency "Emergency — seek immediate care". Emergency is never color alone (icon + label + banner).
- All motion disabled under `prefers-reduced-motion: reduce`. WCAG 2.1 AA.
- Site URL from `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`).
- Footer Ko-fi link stays. Footer stays hidden on `/find-vet`.
- Commit after each task: conventional-commit message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Symptom checker opened with junk/partial query string (`?species=fish&symptom=xyz`) → falls back to step 1, no crash.
2. `/find-vet?q=` with empty or 101+ char value → ignored / truncated to the existing 100-char limit, no API 400 loop.
3. Unknown slug `/guides/nope`, `/food-safety/nope` → branded 404 (`dynamicParams = false`).
4. Food search with mixed case / leading spaces / no matches → case-insensitive trimmed match; clear "no foods match" empty state.
5. Geolocation denied after `?locate=1` → existing location-error state shown once; no retry loop.

---

### Task 1: Tooling — Vitest, typecheck, CI

**Files:**
- Modify: `package.json` (scripts `test: "vitest run"`, `typecheck: "tsc --noEmit"`; devDeps `vitest`, `vite-tsconfig-paths`)
- Create: `vitest.config.ts` (node env, tsconfig paths, `include: ["**/*.test.ts"]`, exclude `node_modules`, `.next`)
- Create: `lib/vets/distance.test.ts`
- Create: `.github/workflows/ci.yml` (Node 20, `yarn install --frozen-lockfile`, lint, typecheck, test, build with `GEOAPIFY_API_KEY` placeholder)

- [ ] **Step 1:** Add deps + scripts + config.
- [ ] **Step 2:** Write `distance.test.ts`: distance between identical points is 0; Manila→Quezon City (~14.6,120.98 → ~14.68,121.04) is between 5 and 15 km. Read `lib/vets/distance.ts` for the exported name first.
- [ ] **Step 3:** Run `yarn test` → PASS. Run `yarn typecheck` → PASS.
- [ ] **Step 4:** Commit `chore: add vitest, typecheck script and CI`.

### Task 2: Design system foundation

**Files:**
- Modify: `app/globals.css` — remove Google Fonts `@import` and `leaflet/dist/leaflet.css` import; add tint tokens (`--tint-teal`, `--tint-clay`, `--tint-sage`, `--tint-butter`), severity tokens (`--sev-routine|soon|urgent|emergency` + `-fg`), shadow tokens (`--shadow-soft`, `--shadow-lift`), `.reveal` scroll animation utility with reduced-motion guard, `.grain` utility, `.container-page` (max-w-7xl, px-4 sm:px-6 lg:px-8).
- Modify: `app/layout.tsx` — `next/font/google` Fredoka (500/600/700) + Inter as CSS variables `--font-app-heading`/`--font-app-sans`; `metadataBase`, title template `%s · Plug N Paw`, default description, OG defaults, `viewport` themeColor; skip-to-content link.
- Modify: `components/find-vet/vet-map.tsx` — `import "leaflet/dist/leaflet.css"` here.
- Create: `lib/site.ts` — `siteConfig = { name, url, description, email, kofiUrl, nav, hotlines }`.
- Create: `components/ui/badge.tsx`, `components/ui/accordion.tsx` via `npx shadcn add badge accordion`.
- Create: `components/reveal.tsx` — client IntersectionObserver wrapper adding `data-visible`.

**Interfaces — Produces:** `siteConfig` (`nav: {href,label,emphasis?: "emergency"}[]`, `hotlines: {name, phone, tel}[]`), `<Reveal as? delay?>`, `.container-page`.

- [ ] **Step 1:** Read docs `01-app/03-api-reference/02-components/font.md` + `04-functions/generate-viewport.md`.
- [ ] **Step 2:** Implement. Run `yarn build` → PASS; `/find-vet` map still styled (dev check).
- [ ] **Step 3:** Commit `feat: design tokens, fonts, site config`.

### Task 3: Navbar + footer

**Files:** Modify `components/navbar.tsx`, `components/footer.tsx`, `components/site-logo.tsx`.

- Navbar: links from `siteConfig.nav`; Emergency rendered as red-tinted pill with `Siren` icon; active link via `usePathname` (`aria-current="page"`) in a small client `NavLink`; header CTA "Find a vet"; mobile drawer lists all + hotlines.
- Footer: 4 columns (brand + disclaimer / Tools / Learn / Company), hotline `tel:` links, Ko-fi line kept, copyright.

- [ ] **Step 1:** Implement. Keyboard-tab through header in dev: visible focus on every item.
- [ ] **Step 2:** `yarn lint && yarn typecheck` → PASS. Commit `feat: new navbar and footer`.

### Task 4: Content — foods

**Files:**
- Create: `content/types.ts` — `Verdict = "safe" | "caution" | "toxic"`; `Food = { slug, name, category: "fruit"|"vegetable"|"protein"|"dairy"|"snack"|"other", dog: Verdict, cat: Verdict, summary, details: string[], servingTips?: string[], warningSigns?: string[], whatToDo: string, popular?: boolean }`; `GuideBlock = {type:"h2",text,id} | {type:"p",text} | {type:"ul",items:string[]} | {type:"callout",tone:"info"|"warning",text}`; `Guide = { slug, title, excerpt, category: "Health"|"Nutrition"|"Behavior"|"New pet", species: ("dog"|"cat")[], image: {src,alt,credit}, updated: string /*ISO*/, body: GuideBlock[] }`.
- Create: `content/foods.ts` — 20 foods (at least: chocolate, grapes & raisins, xylitol gum, onions, garlic, macadamia nuts, alcohol, coffee, avocado, cooked bones, apples, blueberries, carrots, plain cooked chicken, white rice, peanut butter (xylitol-free), cheese, milk, watermelon, pumpkin). ~6 `popular: true`.
- Create: `lib/foods.ts` — `getFoods(): Food[]`, `getFood(slug): Food | undefined`, `searchFoods(foods, {query, species?: "dog"|"cat", verdict?: Verdict}): Food[]`, `getRelatedFoods(food, n=3): Food[]` (same category first).
- Test: `lib/foods.test.ts`.

- [ ] **Step 1: Failing tests:** `searchFoods(foods,{query:"  GRAPE"})` returns the grapes entry; `{query:"zzz"}` → `[]`; `{query:"", species:"cat", verdict:"toxic"}` all have `cat === "toxic"`; content integrity: slugs unique and kebab-case, 20 foods, chocolate/grapes/xylitol/onions are `toxic` for dog.
- [ ] **Step 2:** `yarn test lib/foods.test.ts` → FAIL.
- [ ] **Step 3:** Implement content + functions.
- [ ] **Step 4:** Tests PASS. Commit `feat: food safety content and search`.

### Task 5: Content — guides

**Files:**
- Create: `content/guides/index.ts` exporting `guides: Guide[]` from 8 files in `content/guides/*.ts`: `first-week-with-a-puppy`, `bringing-a-new-cat-home`, `pet-vaccination-basics`, `signs-of-dental-disease`, `keeping-pets-cool-in-hot-weather`, `how-to-give-a-pill`, `when-to-see-a-vet`, `pet-first-aid-kit`.
- Create: `lib/guides.ts` — `getGuides(): Guide[]` (newest first), `getGuide(slug)`, `readMinutes(guide): number` (words/200, min 1), `getRelatedGuides(guide, n=3)`, `guideToc(guide): {id,text}[]`.
- Test: `lib/guides.test.ts` — slugs unique; every `h2` has unique `id`; `readMinutes` ≥ 1; every guide has `image.alt`.

- [ ] Steps: failing tests → FAIL → implement → PASS → commit `feat: care guide content`.

### Task 6: Photography

**Files:** Modify `next.config.ts` (`images.remotePatterns` for `https://images.unsplash.com/**`, `formats: ["image/avif","image/webp"]`); Create `content/images.ts` — `images: Record<"heroDog"|"heroCat"|"vetVisit"|"foodBowl"|"puppy"|"kitten"|"seniorDog"|"catCloseup"|..., {src, alt, credit, creditUrl}>`.

- [ ] **Step 1:** Pick Unsplash photos; open each URL in the browser pane to confirm it loads and shows what the alt says.
- [ ] **Step 2:** Use them in guide `image` fields. `yarn build` → PASS. Commit `feat: pet photography`.

### Task 7: Landing page

**Files:**
- Modify: `app/page.tsx` — composes sections; `metadata`; Organization + WebSite JSON-LD.
- Create in `components/home/`: `hero.tsx`, `hero-search.tsx` (client: form → `router.push('/find-vet?q='+encodeURIComponent(q.trim()))`, empty input disabled submit; "Use my location" link → `/find-vet?locate=1`), `trust-strip.tsx`, `tools-bento.tsx`, `how-it-works.tsx`, `symptom-teaser.tsx` (client: species + symptom select → `assessSymptoms` preview with no red flags → link `/symptom-checker?species=&symptom=`), `food-lookup.tsx` (client, uses `searchFoods`, shows popular by default, max 6 results), `guides-preview.tsx`, `emergency-band.tsx`, `plus-teaser.tsx`, `faq.tsx` (Accordion + FAQPage JSON-LD), `final-cta.tsx`.
- Create: `components/json-ld.tsx` — `<JsonLd data={object} />` rendering `<script type="application/ld+json">` with `JSON.stringify(data).replace(/</g,"\\u003c")`.
- Create: `components/severity-badge.tsx` — `<SeverityBadge severity />` icon + full label.

**Interfaces — Consumes:** `searchFoods`, `getFoods`, `getGuides`, `assessSymptoms` (Task 9 — build Task 9's `lib/triage` before this task's teaser, or order Task 9 first), `siteConfig`.

- [ ] **Step 1:** Load `frontend-design` skill; build sections in the spec §8 order.
- [ ] **Step 2:** Check in browser at 375px, 768px, 1280px: no horizontal scroll, hero H1 above the fold on mobile, LCP image `priority`.
- [ ] **Step 3:** `yarn lint && yarn typecheck && yarn build` → PASS. Commit `feat: landing page`.

### Task 8: Find a vet — URL params + restyle

**Files:** Modify `app/find-vet/page.tsx` (wrap `VetSearch` in `<Suspense>`), `components/find-vet/vet-search.tsx`, `search-bar.tsx`, `vet-card.tsx`, `vet-results.tsx`; Create `lib/vets/url-params.ts` — `parseFindVetParams(sp: URLSearchParams): {q?: string; locate: boolean}` (trim, drop empty, slice to 100; `locate` true only for `"1"`). Test `lib/vets/url-params.test.ts`.

- Behavior: on mount, if `locate` → `searchByLocation()` once (ref guard); else if `q` → `searchByQuery(q)` once and prefill box. On submit, `router.replace('/find-vet?q=…', {scroll:false})`.

- [ ] **Step 1: Failing tests:** `?q=%20%20` → `{locate:false}` (no q); 150-char q → length 100; `?locate=1` → `locate:true`; `?locate=yes` → false.
- [ ] **Step 2:** FAIL → implement → PASS.
- [ ] **Step 3:** Dev check: `/find-vet?q=Manila` loads results; deny geolocation on `?locate=1` shows error once. Commit `feat: shareable find-vet URLs and restyle`.

### Task 9: Symptom checker logic

**Files:**
- Create: `lib/triage/types.ts` — zod `TriageSeveritySchema = z.enum(["routine","soon","urgent","emergency"])`; `TriageResponseSchema = z.object({severity, advice: z.string(), reasons: z.array(z.string()).optional(), suggestedQuery: z.string().trim().min(1).max(100), disclaimer: z.string()})`; `TRIAGE_DISCLAIMER` (the Global Constraints disclaimer text); `SEVERITY_LABEL: Record<TriageSeverity,string>`.
- Create: `lib/triage/symptoms.ts` — `Species`, `SymptomId` (12 ids: `vomiting, diarrhea, not-eating, lethargy, limping, coughing, itching, eye-problem, breathing-trouble, ate-toxic, urinary-trouble, seizure`), `SYMPTOMS: {id,label,base: Record<Species,TriageSeverity>, redFlags: {id,question}[], urgentFlags?: {id,question}[]}[]` per spec §10.2 table, `GLOBAL_RED_FLAGS` (5 per spec).
- Create: `lib/triage/rules.ts` — `assessSymptoms(input: {species: Species; symptom: SymptomId; flags: string[]; duration: "lt24h"|"1to3d"|"gt3d"}): TriageResult`; `parseTriageParams(sp: URLSearchParams): {species?: Species; symptom?: SymptomId}` (invalid → undefined).
- Test: `lib/triage/rules.test.ts`.

Algorithm: any global or symptom red flag in `flags` → `emergency`. Else start at `base[species]`; any urgentFlag (eye bulging/injured; cat not eating > 24h) → max(current, urgent). Duration `1to3d`: routine→soon. `gt3d`: step up one, capped at `urgent`. `reasons` lists the matching flag questions/duration. `suggestedQuery`: `"emergency vet"` for emergency, else `"veterinary clinic"`.

- [ ] **Step 1: Failing tests:** dog itching lt24h no flags → `routine`; same with `gt3d` → `soon`; cat urinary-trouble no flags → `urgent`; dog urinary-trouble → `soon`; any symptom + `pale-gums` → `emergency`; seizure + `seizure-over-5-min` → `emergency`; breathing-trouble lt24h → `urgent`; gt3d never yields `routine` (loop all symptoms/species); no-flag result never `emergency` (loop all); result passes `TriageResponseSchema.parse`; `parseTriageParams("?species=fish&symptom=xyz")` → `{}`.
- [ ] **Step 2:** FAIL → implement → PASS. Commit `feat: rule-based symptom triage`.

### Task 10: Symptom checker page + Emergency page

**Files:**
- Create: `app/symptom-checker/page.tsx` (metadata; Suspense around client flow; disclaimer + "not reviewed by a veterinarian" note), `components/symptom-checker/checker.tsx` (client stepper: species → symptom → flags (checkbox list, "None of these" option) → duration → result; progress bar; Back; Start over; prefill from `parseTriageParams`), `components/symptom-checker/result-card.tsx` (SeverityBadge, advice, reasons, emergency banner with hotlines + "Find a vet near you" → `/find-vet?locate=1`; non-emergency → `/find-vet`).
- Create: `app/emergency/page.tsx` — sections per spec §10.5 using `siteConfig.hotlines`.

- [ ] **Step 1:** Implement. Dev check: full flow by keyboard only; focus moves to each step heading; result announced via `aria-live="polite"`.
- [ ] **Step 2:** `yarn lint && yarn typecheck && yarn build` → PASS. Commit `feat: symptom checker and emergency pages`.

### Task 11: Food safety pages

**Files:** Create `app/food-safety/page.tsx`, `app/food-safety/[slug]/page.tsx` (`generateStaticParams`, `dynamicParams = false`, `generateMetadata` title "Can dogs and cats eat {name}?", FAQPage + BreadcrumbList JSON-LD, related foods), `components/food/food-explorer.tsx` (client filter: query input, species toggle, verdict chips; server-rendered full list as no-JS fallback), `components/food/verdict-badge.tsx`, `components/breadcrumbs.tsx` (`items: {href?,label}[]`, also emits BreadcrumbList JSON-LD).

- [ ] Implement → dev check `/food-safety/grapes`, `/food-safety/nope` → 404 → build PASS → commit `feat: food safety pages`.

### Task 12: Guides pages

**Files:** Create `app/guides/page.tsx` (category filter via `?category=` read from `searchParams` prop; cards), `app/guides/[slug]/page.tsx` (`generateStaticParams`, `dynamicParams = false`, Article + BreadcrumbList JSON-LD, sticky TOC ≥ lg, related guides, disclaimer), `components/guides/guide-body.tsx`, `components/guides/guide-card.tsx`.

- [ ] Implement → dev check → build PASS → commit `feat: care guides`.

### Task 13: Plus, About, 404, error

**Files:** Create `app/plus/page.tsx` (Free vs Plus table, planned `$6/month`, "coming soon" perks, mailto CTA, small FAQ), `app/about/page.tsx` (mission, how it works, data sources, tech stack, photo credits from `content/images.ts`, disclaimer), `app/not-found.tsx`, `app/error.tsx` (client, `reset` button).

- [ ] Implement → build PASS → commit `feat: plus, about and error pages`.

### Task 14: SEO + headers

**Files:** Create `app/sitemap.ts` (static routes + all guide/food slugs, `lastModified` from guide `updated`), `app/robots.ts` (allow all, disallow `/api/`, sitemap URL), `app/manifest.ts`, `app/opengraph-image.tsx` (ImageResponse 1200×630, brand colors, tagline), `app/guides/[slug]/opengraph-image.tsx`, `app/food-safety/[slug]/opengraph-image.tsx`, `app/icon.svg` (brand pin mark). Modify `next.config.ts` `headers()` → `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(), microphone=()`, `X-Frame-Options: DENY`; `poweredByHeader: false`. Modify `.env.example` add `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

- [ ] **Step 1:** Read docs `01-metadata/sitemap.md`, `robots.md`, `opengraph-image.md`, `05-config/.../headers.md`.
- [ ] **Step 2:** Implement. `yarn build` → PASS; `curl localhost:3000/sitemap.xml` lists 20 food + 8 guide URLs; `curl -I /` shows headers.
- [ ] **Step 3:** Commit `feat: sitemap, robots, OG images, security headers`.

### Task 15: README + final verification

- [ ] **Step 1:** Rewrite `README.md`: pitch, features, architecture diagram (text), routes table, scripts, env vars, "What I'd do next" (n8n AI triage, CMS, CSP, analytics, rate limiting).
- [ ] **Step 2:** `yarn lint && yarn typecheck && yarn test && yarn build` → all PASS.
- [ ] **Step 3:** Browser check every route at 375px and 1280px; console has no errors.
- [ ] **Step 4:** Commit `docs: README for pet health hub`.

**Order note:** run Task 9 before Task 7 (the landing teaser imports `assessSymptoms`). Final order: 1, 2, 3, 4, 5, 6, 9, 7, 8, 10, 11, 12, 13, 14, 15.
