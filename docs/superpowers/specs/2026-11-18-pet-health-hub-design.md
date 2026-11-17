# Plug N Paw — Pet Health Hub Redesign — Design Spec

Date: 2026-11-18
Status: Draft — awaiting approval
Scope: Web only (this repo).

**Before writing any framework code:** this repo runs a modified Next.js
(16.3.5). Per `AGENTS.md`, read the relevant guide in
`node_modules/next/dist/docs/` first — especially metadata
(`sitemap`, `robots`, `opengraph-image`, `generateMetadata`), dynamic
routes + `generateStaticParams`, `next/font`, `next/image`
(`remotePatterns`), `useSearchParams` + Suspense, and route segment config.
Do not assume stock Next.js 14/15 behaviour.

---

## 1. Intent and the why

The owner is a senior full-stack developer. This site is their interview
portfolio piece: it must look as polished as a funded pet-care brand and
hold up when an interviewer clicks around, reads the code, or asks "how
would this scale?". It should also be genuinely useful, so it can take
real organic traffic later.

Business concept (chosen by the owner, option "A"): **Plug N Paw is a
free pet-health hub.** It helps owners answer "what do I do right now?"
for their pet:

- **Find a vet** near them (exists today, real data via Geoapify).
- **Check a symptom** and learn how urgent it is.
- **Look up a food** ("can my dog eat grapes?").
- **Read care guides** and get **emergency help**.

Free utility pages pull search traffic (high-volume queries such as
"vet near me", "dog ate chocolate", "cat not eating"). A small
**Plug N Paw Plus** membership teaser shows the revenue model
(free tool → traffic; Plus → revenue). Plus is not built; it is a
pricing teaser only.

## 2. Goals

1. A landing page that competes visually with top pet-care brands
   (Rover, Chewy, Vetster, BetterVet, Pawp-level polish), mobile-first.
2. A coherent multi-page site: every page shares one design system.
3. Fast and cheap under traffic: content pages are statically generated
   and served from a CDN; no request-time work on content pages.
4. Strong SEO: per-page metadata, Open Graph images, sitemap, robots,
   structured data (JSON-LD), clean URLs, one H1 per page.
5. Accessible: WCAG 2.1 AA — keyboard reachable, visible focus, colour
   contrast, `prefers-reduced-motion` respected, semantic landmarks.
6. Code that reads like senior work: typed content, pure logic in
   `lib/` with unit tests, small components, CI.

## 3. Non-goals

- No accounts, auth, booking, payments, or real Plus membership.
- No CMS. Content lives as typed TypeScript in the repo (owner chose
  approach 1).
- No AI symptom triage in this pass. The n8n spec
  (`2026-09-16-n8n-triage-automation-design.md`) stays future work; the
  rule-based checker returns the same result shape so it can be swapped in.
- No dark-mode toggle (existing `.dark` tokens remain untouched).
- No city/country SEO landing pages for Find a Vet (still a non-goal from
  the Find-a-Vet spec).
- No per-IP rate limiting on `/api/vets/search` (decided in the
  Find-a-Vet spec; not reopened).
- No analytics vendor wired in (needs an account). Leave a clear hook
  point only if trivial; otherwise skip.

## 4. Anti-goals (would make this a failure even if it "works")

- **No fabricated social proof.** No fake testimonials, fake review
  stars, fake "10,000 happy pets", fake press logos, fake vet names or
  credentials. Any number shown must be a true product fact (e.g. "20
  foods covered", "4 urgency levels", "worldwide clinic search").
- **No collecting data we throw away.** No email form that posts to
  nowhere. Plus "Notify me" uses `mailto:` (honest, zero backend).
- **No unsafe medical content.** The symptom checker must err toward
  "see a vet". Emergency red flags always win. Every health page carries
  a clear "general information, not veterinary advice" note.
- **Not a template.** No generic SaaS gradient hero, no purple-blue
  gradients, no emoji-as-icons, no lorem ipsum.
- **Not fragile in a demo.** Nothing on the landing page may depend on a
  third-party service being up, except images (see §9) and the existing
  Find-a-Vet API.

## 5. Constraints

- Next.js 16.3.5 (modified), React 19, TypeScript, Tailwind v4,
  shadcn/ui (`base-nova`, Base UI primitives), `lucide-react`, yarn.
- Keep the existing Find-a-Vet architecture (`app/api/vets/search`,
  `lib/vets/*`, `hooks/use-vet-search.ts`) — restyle and extend, don't
  rewrite.
- Keep the brand tokens in `app/globals.css` (warm paper background,
  pumpkin-clay primary, pine-teal secondary, Fredoka headings, Inter
  body) — they are deliberate and already avoid "AI default" colours.
  Extend them (spacing, type scale, shadows, a few accent tints); do not
  replace them.
- Ko-fi link in the footer stays.

## 6. Approaches considered

| # | Approach | Trade-off | Verdict |
|---|---|---|---|
| 1 | **Content in code, statically generated.** Typed TS content modules; SSG pages via `generateStaticParams`; rule-based symptom checker in the browser. | Fastest, cheapest, no keys, demo-proof. Adding content = code change. | **Chosen** by owner. |
| 2 | Headless CMS (Sanity/Contentful). | Editable by non-devs; needs account + keys; demo depends on a third party. | Rejected — overkill, fragile demo. |
| 3 | Build the n8n AI symptom checker now. | Flashy; requires a running n8n + LLM during interviews. | Rejected for now — kept as the documented next step; the rule engine returns the n8n spec's result shape. |

## 7. Information architecture

| Route | Purpose | Rendering |
|---|---|---|
| `/` | Landing page | Static |
| `/find-vet` | Existing map + list search; now also reads `?q=` | Static shell + client |
| `/symptom-checker` | Guided urgency checker | Static shell + client |
| `/food-safety` | Searchable list of foods, dog + cat verdicts | Static (client filter) |
| `/food-safety/[slug]` | One food, e.g. "Can dogs and cats eat grapes?" | SSG |
| `/guides` | Care-guide index with category filter | Static |
| `/guides/[slug]` | One guide (article) | SSG |
| `/emergency` | Red-flag signs, what to do now, poison hotlines | Static |
| `/plus` | Membership teaser + pricing + `mailto:` notify | Static |
| `/about` | Mission, how it works, tech/credits, disclaimer | Static |
| `not-found`, `error` | Branded 404 / error | — |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, OG images | SEO | Static |

Primary nav: Find a vet · Symptom checker · Food safety · Guides ·
**Emergency** (visually distinct, clay/red pill). Header CTA:
"Find a vet". Mobile: existing drawer pattern, extended.

Footer: brand blurb, columns (Tools / Learn / Company), hotline numbers,
disclaimer line, Ko-fi link, copyright.

## 8. Landing page (`/`) — section by section

Order matters: each section answers the next question a visitor has.

1. **Hero.** Headline (Fredoka, large, balanced):
   *"Care for your pet, the moment you need it."* Sub-line about free
   vet search, symptom checks and food safety. A **search box**
   ("City, address or clinic") that navigates to `/find-vet?q=…`, plus a
   "Use my location" secondary action that goes to `/find-vet` and
   triggers geolocation only after the user's click there (never auto).
   Quick-action chips: Check a symptom · Can my pet eat…? · Emergency.
   Right side (desktop) / below (mobile): a pet photo collage with two
   floating UI cards that preview the product (a clinic result card and
   an urgency result card) — real UI components, not screenshots.
2. **Trust strip.** True product facts only (see §4): e.g. "Free, no
   sign-up", "Clinics worldwide", "20+ foods checked", "Built for
   phones". Icon + short label.
3. **Three tools (bento grid).** Find a vet / Symptom checker / Food
   safety — large cards with illustration or photo, one-line value, CTA.
   Emergency gets a smaller, urgent-styled tile.
4. **How it works.** Three steps: Tell us what's wrong → See how urgent
   it is → Find care nearby. Numbered, with a connecting line.
5. **Symptom checker teaser.** Interactive mini-widget: pick a species
   and one common symptom → shows a preview urgency badge and a
   "Get the full check" link to `/symptom-checker` with those values
   pre-filled via query string.
6. **Food lookup.** Inline search over the food dataset with instant
   filtering and Safe / Caution / Toxic badges for dog and cat; links to
   detail pages. Shows ~6 popular foods by default.
7. **Guides.** 3–4 featured guides as cards (image, category, read
   time). Link to `/guides`.
8. **Emergency band.** Full-width, high-contrast band: top red-flag
   signs, "Find an emergency vet now" CTA (→ `/find-vet?q=emergency vet`
   only if a location term is not required — see §10 note), and poison
   hotline numbers.
9. **Plus teaser.** One pricing card (Free vs Plus) — Plus perks framed
   as "coming soon" (e.g. saved pets, vet-visit reminders, 24/7 chat).
   CTA "Notify me" → `mailto:`.
10. **FAQ.** Accordion, 6–8 real questions (Is it free? Is this vet
    advice? Where does clinic data come from? Which countries? …).
    Marked up with `FAQPage` JSON-LD.
11. **Final CTA.** Short headline + search box again.

## 9. Visual design direction

**Mood:** "warm modern clinic" — friendly and soft like a pet brand,
but calm and trustworthy like healthcare. Editorial confidence: big
rounded display type, generous whitespace, strong colour blocks.

- **Type:** Fredoka (display/headings), Inter (body). Load via
  `next/font/google` (self-hosted, no layout shift) instead of the
  current CSS `@import` from Google Fonts. Fluid type scale with
  `clamp()`; hero H1 ~ 3rem mobile → ~5rem desktop.
- **Colour:** paper background; pine teal for big structural blocks
  (emergency band, footer, feature panels); pumpkin clay as the sparing
  action colour (primary buttons, highlights). Add soft tint tokens
  (teal-50-ish, clay-50-ish, a sage and a butter tint) for card
  backgrounds. Urgency colours: emergency (red, plus icon + label —
  never colour alone), urgent (clay), soon (butter/amber), routine
  (sage/teal).
- **Shape:** large radii (`rounded-3xl` cards), organic blob/arch
  masks on photos, the existing teardrop "pin" brand mark reused as a
  motif.
- **Depth:** soft layered shadows, subtle paper grain on large blocks
  (CSS, tiny), no glassmorphism overload.
- **Motion:** CSS-only, small: fade/rise on scroll (IntersectionObserver
  or CSS `animation-timeline` with fallback), hover lift on cards,
  floating hero cards. All disabled under `prefers-reduced-motion`.
  No animation library.
- **Imagery:** real pet photography (dogs + cats, varied breeds) served
  through `next/image` with explicit sizes, `priority` only on the hero
  image, AVIF/WebP. Source: free-licence photos (Unsplash) via
  `images.unsplash.com` `remotePatterns`; every URL is checked to load
  before it ships; credits listed on `/about`. Icons: `lucide-react`.

## 10. Feature specs

### 10.1 Find a vet (existing — extend)

- Restyle the page chrome to the new system (search bar, cards, empty /
  error states). Map + list behaviour unchanged.
- Read `?locate=1` on load: the landing-page "Use my location" button
  links to `/find-vet?locate=1`, and that click counts as the user's
  consent, so the page calls `searchByLocation()` once on arrival. A
  denied/unavailable permission uses the existing location-error state.
  Geolocation is still never started without a user click somewhere.
- Read `?q=` on load: if present, run `searchByQuery(q)` once and put
  the value in the search box. Keep the URL in sync on submit
  (`router.replace`) so searches are shareable. Wrap the client
  component in `<Suspense>` as this Next version requires for
  `useSearchParams` in static pages (verify in docs).
- Note: a bare "emergency vet" query is geocoded by Geoapify and may
  resolve to a random place. So emergency CTAs link to `/find-vet`
  (user then types a location or uses geolocation) rather than passing
  `q=emergency vet`. The emergency band copy says "Search near you".
- The footer stays hidden on `/find-vet` (full-height map), as today.

### 10.2 Symptom checker (`/symptom-checker`)

Guided, one question per step, progress indicator, back button:

1. Species: dog / cat.
2. Main symptom (single choice, ~12): vomiting, diarrhoea, not eating,
   lethargy, limping, coughing, scratching/itching, eye problem,
   breathing trouble, ate something toxic, urinary trouble, seizure.
3. Red-flag questions (yes/no, symptom-specific + global): e.g. pale or
   blue gums, collapse, hard swollen belly, straining to urinate with
   nothing coming out (cats especially), blood in vomit/stool, seizure
   > 5 min.
4. Duration: < 24 h / 1–3 days / > 3 days.

Output (`TriageResult`, same shape as the n8n spec's response):

```ts
type TriageSeverity = "routine" | "soon" | "urgent" | "emergency";
type TriageResult = {
  severity: TriageSeverity;
  advice: string;           // plain-language next steps
  reasons: string[];        // which answers drove the result
  suggestedQuery: string;   // kept for n8n parity; not used for geocoding
  disclaimer: string;
};
```

**Rule table (builder's call — cautious, not vet-reviewed; the page
says so).** No sex question: urinary straining is treated as urgent for
all cats (male cats carry the highest risk, but asking adds friction and
a wrong answer is dangerous).

| Symptom | Base level | Symptom red flags (→ emergency) |
|---|---|---|
| Vomiting | soon | blood in vomit; vomiting + hard swollen belly; can't keep water down |
| Diarrhoea | soon | blood or black/tarry stool; with vomiting in a puppy/kitten |
| Not eating | routine (dog) / soon (cat) | not eating > 24 h in a cat → urgent |
| Lethargy | soon | can't stand / unresponsive |
| Limping | routine | can't bear any weight; obvious break or open wound |
| Coughing | routine | coughing with laboured breathing |
| Scratching / itching | routine | sudden face/muzzle swelling or hives |
| Eye problem | soon | eye bulging, injured, or held shut and painful → urgent |
| Breathing trouble | urgent | open-mouth breathing (cat); blue/grey gums |
| Ate something toxic | urgent | any symptoms already showing |
| Urinary trouble | soon (dog) / urgent (cat) | straining with little or nothing coming out |
| Seizure | urgent | lasts > 5 min, or more than one in 24 h |

Global red flags asked for every symptom (any yes → emergency): pale,
white, blue or grey gums; collapse or can't stand; hard swollen belly
with retching; heavy bleeding; hit by a car / major trauma.

Escalation: duration 1–3 days raises `routine` → `soon`; > 3 days
raises one step (max `urgent` without a red flag) and never leaves
`routine`. A puppy/kitten age flag is not asked (keep it short).

Labels use full phrases (from the n8n spec): "Routine veterinary
attention" / "See a vet soon" / "Urgent veterinary attention" /
"Emergency — seek immediate care". Emergency renders as a distinct
banner with hotline numbers and a "Find a vet near you" button.

Types live in `lib/triage/types.ts` — the same file the n8n spec plans —
with zod schemas `TriageSeveritySchema`, `TriageResponseSchema` and the
single `TRIAGE_DISCLAIMER` constant. `reasons` is **optional**
(`reasons?: string[]`) so an n8n/LLM response that lacks it still
validates and renders; the UI shows the reasons list only when present.
Rules live in `lib/triage/rules.ts` as a **pure function**
`assessSymptoms(input): TriageResult` implementing the table above.
Unit-tested (see §12). State lives in the URL query (`?species=&symptom=`)
so the landing-page teaser can deep-link and results are shareable.

### 10.3 Food safety (`/food-safety`, `/food-safety/[slug]`)

- Dataset `content/foods.ts`: ~20 common foods. Each: `slug`, `name`,
  `dog` and `cat` verdicts (`safe` | `caution` | `toxic`), a short why,
  serving notes, symptoms to watch for if toxic, and a "what to do"
  line. Toxic list must include the well-established ones: chocolate,
  grapes/raisins, xylitol, onions/garlic, macadamia nuts, alcohol,
  caffeine, avocado (caution), cooked bones (caution), lilies (cats —
  plant, include under "Common household hazards" only if it fits; else
  skip). Content is conservative and general.
- Index: client-side filter input + species toggle + verdict filter;
  works without JS as a plain list.
- Detail page H1 phrased as the search query: "Can dogs and cats eat
  grapes?". `FAQPage` + `BreadcrumbList` JSON-LD. Related foods.

### 10.4 Guides (`/guides`, `/guides/[slug]`)

- `content/guides/*.ts`: 6–8 guides, each typed: `slug`, `title`,
  `excerpt`, `category` (Health · Nutrition · Behaviour · New pet),
  `species`, `readMinutes` (computed), `image`, `updated` date, and a
  body as structured blocks (heading / paragraph / list / callout) —
  rendered by one `GuideBody` component. No MDX dependency needed.
- Suggested topics: first-week puppy checklist, bringing a new cat home,
  vaccination basics, signs of dental disease, keeping pets cool in hot
  weather, how to give a pill, when to see a vet vs wait, pet first-aid
  kit.
- Article page: breadcrumb, H1, meta (category, read time, updated),
  table of contents on desktop, related guides, `Article` +
  `BreadcrumbList` JSON-LD, health disclaimer.

### 10.5 Emergency (`/emergency`)

- Top: "If your pet is in danger now: call your nearest vet or
  emergency clinic." + "Find a vet near you" button.
- Red-flag sign list, "what to do while you travel", "what not to do"
  (e.g. don't induce vomiting unless a vet tells you).
- Poison hotlines (US, fees may apply — state this): ASPCA Animal Poison
  Control (888) 426-4435; Pet Poison Helpline (855) 764-7661. Mark them
  as US services and tell non-US users to call their local vet.
  `tel:` links.

### 10.6 Plus (`/plus`) and About (`/about`)

- Plus: Free vs Plus comparison, "coming soon" perks, a price shown as
  "planned" (e.g. $6/month), FAQ, `mailto:` notify CTA. Honest framing.
- About: mission, how the tools work (data sources: Geoapify/OSM for
  clinics; content written for general guidance), tech stack summary
  for interviewers, photo credits, medical disclaimer, contact.

## 11. SEO and traffic readiness

- Per-route `metadata` / `generateMetadata` with title template
  (`%s · Plug N Paw`), descriptions, canonical URLs, Open Graph + Twitter
  cards. `metadataBase` from `NEXT_PUBLIC_SITE_URL` (add to
  `.env.example`, default `http://localhost:3000`).
- `app/opengraph-image.tsx` (and per-guide / per-food variants) via
  `ImageResponse` — branded, generated at build.
- `app/sitemap.ts` (all static + every guide/food slug), `app/robots.ts`,
  `app/manifest.ts`, app icon.
- JSON-LD: `Organization` + `WebSite` on `/`; `Article`, `FAQPage`,
  `BreadcrumbList` where listed above. One small `JsonLd` component.
- All content pages statically generated; `dynamicParams = false` on
  `[slug]` routes so unknown slugs 404 without server work.
- `next.config.ts`: `images.remotePatterns` for Unsplash, AVIF/WebP
  formats; security headers (`X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy: geolocation=(self)`,
  `X-Frame-Options: DENY`). A full CSP is out of scope (Leaflet tiles +
  inline styles make it noisy) — note as future work.
- Fonts via `next/font`; Leaflet CSS only loaded on `/find-vet` (move the
  global `@import "leaflet/dist/leaflet.css"` into the map component /
  route).
- Targets (Lighthouse, mobile, production build): Performance ≥ 90,
  Accessibility ≥ 95, Best Practices ≥ 95, SEO = 100 on `/`,
  `/guides/[slug]`, `/food-safety/[slug]`.

## 12. Quality

- Add **Vitest** for pure logic only: `lib/triage` rules (emergency
  wins, duration escalation, cat urinary rule), food search/filter,
  content integrity (unique slugs, required fields, every guide/food
  verdict valid). Existing `lib/vets/distance.ts` gets a test too.
  Scripts: `yarn test`, `yarn typecheck`.
- **CI:** `.github/workflows/ci.yml` — install, lint, typecheck, test,
  build on push/PR to `main`.
- README updated: product pitch, feature list, architecture diagram,
  scripts, env vars, "what I'd do next" (n8n AI triage, CMS, CSP,
  analytics, rate limiting).

## 13. Decided by the owner

- Business concept A (free pet-health hub) with a small Plus teaser.
- Build approach 1 (content in code, static generation, rule-based
  symptom checker).

## 14. Builder's calls (made while writing this doc — owner may override)

- **Audience and spelling:** US English everywhere ("diarrhea",
  "behavior"), US hotlines, `$` pricing; non-US users told to call their
  local vet. (Rule-table wording above gets US spelling in the build.)
- **Host:** Vercel (zero-config for build-time OG images, image
  optimisation, CDN). Domain comes from `NEXT_PUBLIC_SITE_URL`, so no
  real domain is needed to build; the footer email stays as is.
- **Symptom rules:** cautious table in §10.2, written by the builder,
  explicitly labelled "not reviewed by a veterinarian".
- **Delivery in phases**, each shippable on its own:
  1. Design system, layout, nav/footer, landing page, Find-a-vet restyle
     + `?q=`/`?locate=1`.
  2. Symptom checker + Emergency page.
  3. Food safety (index + detail).
  4. Guides (index + detail).
  5. Plus + About + 404/error.
  6. SEO (metadata, OG, sitemap, JSON-LD), headers, Vitest, CI, README.

## 15. Left to the builder

- Exact copy wording (keep it warm, plain, short; no medical overclaims).
- Exact component breakdown and file names inside `components/`.
- Which shadcn primitives to add (accordion, badge, tabs likely).
- Exact photo choices (must meet §9 rules).
- Exact guide/food content within the §10 bounds.
