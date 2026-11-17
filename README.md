# Plug N Paw

**Free pet-health tools for worried owners.** Find a vet near you, check how urgent a symptom is, look up whether a food is safe for dogs and cats, and read plain-language care guides. No sign-up.

Built as a portfolio project to show product thinking and production-minded frontend engineering: statically generated content, a unit-tested rules engine, a map-backed search API, and SEO and accessibility done properly.

## What's in it

| Route | What it does |
|---|---|
| `/` | Landing page: search, tools, symptom teaser, food lookup, guides, emergency band, FAQ |
| `/find-vet` | Map + list of clinics by city, address, clinic name or your location. Shareable URLs (`?q=`, `?locate=1`) |
| `/symptom-checker` | Guided check: pet, symptom, warning signs, duration → routine / soon / urgent / emergency |
| `/food-safety`, `/food-safety/[slug]` | 20 foods with verdicts for dogs and cats |
| `/guides`, `/guides/[slug]` | 8 care guides with table of contents and Article structured data |
| `/emergency` | Warning signs, first steps, US poison hotlines |
| `/plus` | Honest "coming soon" membership teaser (no data collected) |
| `/about` | Mission, data sources, stack, credits, disclaimer |

## Engineering notes

- **Static by default.** All content pages are prerendered (`generateStaticParams`, `dynamicParams = false`), so they serve from a CDN and absorb traffic spikes. Only `/api/vets/search` runs on demand.
- **Content as typed code.** Foods and guides live in `content/` as TypeScript, checked at compile time and covered by integrity tests. No CMS, no runtime fetch.
- **Rules engine is a pure function.** `lib/triage/rules.ts` (`assessSymptoms`) is unit-tested, including invariants: a warning sign always means emergency, nothing reaches emergency without one, nothing stays routine after 3 days. Its result shape matches a planned n8n/LLM workflow (`docs/superpowers/specs/2026-09-16-n8n-triage-automation-design.md`), so AI triage can be swapped in later.
- **API key stays on the server.** The Geoapify key is only used in a Route Handler with timeouts, structured logs with request IDs, and 15-minute fetch caching.
- **SEO.** Per-page metadata and canonical URLs, generated Open Graph images, `sitemap.xml`, `robots.txt`, web manifest, and JSON-LD (Organization, WebSite, FAQPage, Article, BreadcrumbList).
- **Accessibility.** Skip link, visible focus, labelled controls, severity shown with icon + text (never colour alone), `aria-live` results, and `prefers-reduced-motion` respected.
- **Security headers** set in `next.config.ts`.
- **Self-hosted fonts** via `next/font/local` (Fredoka, Inter).

## Scripts

```bash
yarn dev         # dev server
yarn build       # production build
yarn start       # run the production build
yarn lint        # eslint
yarn typecheck   # tsc --noEmit
yarn test        # vitest (pure logic: triage, foods, guides, URL params)
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test and build on every push and pull request.

## Setup

1. Node 20+ and yarn.
2. `yarn install`
3. Copy `.env.example` to `.env.local` and set:
   - `GEOAPIFY_API_KEY`: free key from [geoapify.com](https://www.geoapify.com/)
   - `NEXT_PUBLIC_SITE_URL`: your public URL (used for canonical links, sitemap and Open Graph)
4. `yarn dev`

## Disclaimers

General information only, not veterinary advice. The symptom checker's rules are cautious but have **not** been reviewed by a veterinarian. Clinic data comes from OpenStreetMap via Geoapify and may be incomplete.

## What I'd do next

- Replace the rules with the n8n + LLM triage workflow behind the same result type, keeping the rules as a safety floor.
- Move content to a CMS if non-developers need to edit it.
- Add a Content-Security-Policy (Leaflet tiles make this fiddly).
- Add privacy-friendly analytics and Core Web Vitals reporting.
- Add per-IP rate limiting to `/api/vets/search`.
- Have a veterinarian review the triage rules and food content.
