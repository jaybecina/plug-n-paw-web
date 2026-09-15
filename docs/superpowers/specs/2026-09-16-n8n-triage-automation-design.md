# AI Symptom Triage via n8n — Design Spec

Date: 2026-09-16
Status: Approved for implementation planning

## 1. Goal

Add a form-based "AI symptom triage" feature to `/find-vet`. User describes
their pet's symptom, submits a form (not a live chat), and an AI-generated
reply renders in a result panel below the form: severity, plain-language
advice, a suggested vet-search query (one click re-runs the existing vet
search with that query), and a disclaimer. If the user supplies an email,
an automated reply email is sent.

The AI generation and email-sending happen inside an **n8n workflow**,
called from our own Next.js API route (browser never talks to n8n
directly). n8n is self-hosted for free (`npx n8n`), and the LLM inside the
workflow uses a free-tier provider (Google Gemini primary). No paid
service, no credit card, anywhere in this feature.

A companion tutorial (`docs/n8n-tutorial.md`) teaches n8n from zero and
walks through building this exact workflow.

## 2. Non-goals

- No live/streaming chat UI — single form submit, single reply render.
- No persistence of triage submissions (no DB table) — stateless request/response.
- No authentication/user accounts.
- No production email deliverability hardening (SPF/DKIM) — tutorial-grade
  Gmail SMTP is enough; Resend is noted as a documented upgrade, not built.
- Emergency detection is a safety net, not a medical system — it never
  claims to diagnose.

## 3. Architecture

```mermaid
sequenceDiagram
    participant U as Browser (TriageForm)
    participant N as Next.js API (/api/triage)
    participant W as n8n Webhook
    participant L as Gemini (free tier)
    participant E as Email (SMTP)

    U->>N: POST {species, symptomText, email?}
    N->>N: zod validate + isEmergencySymptom() check
    alt emergency keyword matched
        N-->>U: 200 {severity: "emergency", ...} (n8n/LLM skipped)
    else normal flow
        N->>W: POST (header secret) {species, symptomText, email?}
        W->>L: prompt (structured JSON output)
        L-->>W: {severity, advice, suggestedQuery, disclaimer}
        opt email provided
            W->>E: send auto-reply email
        end
        W-->>N: 200 JSON {severity, advice, suggestedQuery, disclaimer, emailSent}
        N-->>U: relay JSON
    end
    U->>U: render TriageResult; "Search for <suggestedQuery>" button
```

Browser → our API route → n8n webhook. The webhook secret and n8n URL
never reach the client bundle (route handler runs server-side only).

## 4. Files to add / change

### New files

| Path | Responsibility |
|---|---|
| `lib/triage/types.ts` | zod schemas + inferred types: `TriageRequest`, `TriageResponse`, `TriageSeverity` |
| `lib/triage/emergency.ts` | `EMERGENCY_KEYWORDS` list + `isEmergencySymptom(text: string): boolean` |
| `lib/n8n/config.ts` | `getN8nWebhookUrl()`, `getN8nWebhookSecret()` — mirrors `lib/vets/config.ts` |
| `lib/n8n/client.ts` | `callTriageWebhook(input): Promise<TriageResponse>`, `N8nUpstreamError`, mirrors `lib/vets/geoapify.ts` error-class pattern |
| `app/api/triage/route.ts` | `POST` handler, mirrors `app/api/vets/search/route.ts` conventions (requestId, structured `console.info` log, `jsonError` helper) |
| `hooks/use-triage.ts` | `status`, `result`, `errorCode`, `submit(input)` — mirrors `hooks/use-vet-search.ts` shape |
| `components/find-vet/triage-trigger.tsx` | Button that opens the triage Dialog |
| `components/find-vet/triage-form.tsx` | The form itself |
| `components/find-vet/triage-result.tsx` | Renders severity badge, advice, disclaimer, suggested-query button |
| `docs/n8n-tutorial.md` | Full learning tutorial (see §9) |
| `docs/n8n/triage-workflow.json` | Exported n8n workflow, committed for reference/import (produced by exporting from the working n8n instance once built by hand — see §8) |
| `.env.example` | add `N8N_TRIAGE_WEBHOOK_URL=`, `N8N_WEBHOOK_SECRET=` |

### Modified files

| Path | Change |
|---|---|
| `components/find-vet/vet-search.tsx` | Render `<TriageTrigger onUseSuggestedQuery={searchByQuery} />` near `SearchBar` (top bar, desktop + mobile) |

### shadcn components to add (not yet present in `components/ui/`)

```
npx shadcn add dialog textarea select label badge alert
```

(`button`, `card`, `drawer`, `input`, `skeleton` already exist — reuse, don't recreate.)

## 5. Data contracts (`lib/triage/types.ts`)

```ts
import { z } from "zod";

export const TriageSeveritySchema = z.enum([
  "routine",
  "soon",
  "urgent",
  "emergency",
]);
export type TriageSeverity = z.infer<typeof TriageSeveritySchema>;

export const TriageRequestSchema = z.object({
  species: z.enum(["dog", "cat", "other"]),
  symptomText: z.string().trim().min(10).max(500),
  email: z.string().trim().email().optional(),
});
export type TriageRequest = z.infer<typeof TriageRequestSchema>;

export const TriageResponseSchema = z.object({
  severity: TriageSeveritySchema,
  advice: z.string(),
  suggestedQuery: z.string(),
  disclaimer: z.string(),
  emailSent: z.boolean(),
});
export type TriageResponse = z.infer<typeof TriageResponseSchema>;

export type TriageErrorCode =
  | "VALIDATION_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "CONFIG_ERROR";

export type TriageErrorResponse = {
  error: { code: TriageErrorCode; message: string; requestId: string };
};
```

Reuse `TriageResponseSchema.parse()` to validate whatever n8n returns
before trusting it in `lib/n8n/client.ts` — n8n is an external system, its
output is untrusted input to our server.

## 6. Emergency bypass (`lib/triage/emergency.ts`)

Checked in the API route **before** calling n8n — cheaper, faster, and
guarantees emergency guidance never depends on LLM availability or
correctness.

```ts
export const EMERGENCY_KEYWORDS = [
  "can't breathe", "cant breathe", "not breathing", "stopped breathing",
  "seizure", "collapsed", "unconscious", "unresponsive",
  "poisoned", "ate poison", "ate chocolate", "ate rat bait",
  "bleeding heavily", "won't stop bleeding", "wont stop bleeding",
  "hit by car", "hit by a car",
  "bloated stomach", "swollen belly and pacing",
  "blue gums", "pale gums",
];

export function isEmergencySymptom(text: string): boolean {
  const normalized = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => normalized.includes(kw));
}
```

When matched, the API route returns immediately (200, `emailSent: false`,
`suggestedQuery: "emergency vet"`, a hardcoded urgent-care advice string)
without ever calling n8n. This list is a safety net, not exhaustive —
tutorial explains the limitation.

## 7. API route (`app/api/triage/route.ts`)

- `POST` only. Parse JSON body with `TriageRequestSchema.safeParse`.
- On failure: `400 VALIDATION_ERROR`.
- Run `isEmergencySymptom(symptomText)` → short-circuit as above.
- Else call `callTriageWebhook(input)`:
  - `fetch(n8nWebhookUrl, { method: "POST", headers: { "content-type": "application/json", "x-webhook-secret": secret }, body: JSON.stringify(input), signal: AbortSignal.timeout(10_000) })`
  - Non-2xx → throw `N8nUpstreamError`
  - Response body parsed with `TriageResponseSchema` (throws on shape mismatch → treated as `UPSTREAM_UNAVAILABLE`)
- Catch `DOMException "TimeoutError"` → `504 UPSTREAM_TIMEOUT`
- Catch `N8nUpstreamError` → `502 UPSTREAM_UNAVAILABLE`
- Catch config error (missing env var) → `500 CONFIG_ERROR`
- `finally`: structured `console.info` log exactly like `vets/search/route.ts` (`scope: "triage"`, `requestId`, `severity`, `durationMs`, `status`) — no PII (never log `symptomText` or `email` raw).

Before writing this file: read
`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
per `AGENTS.md` — this repo runs a modified Next.js and route handler
conventions may differ from training data.

## 8. n8n workflow (built by hand in the n8n editor, then exported)

Built interactively, not hand-authored as JSON — needs a live LLM
credential entered and test-executed inside n8n, which only the n8n UI can
do. Full click-by-click steps live in the tutorial (§9). Node-level spec
so implementation is unambiguous:

1. **Webhook** — Method `POST`, Path `pet-triage`, Authentication: Header
   Auth, header name `x-webhook-secret`, value = same secret as
   `N8N_WEBHOOK_SECRET` in the app's `.env.local`. Respond: "Using
   Respond to Webhook Node" (so the workflow can run the LLM + email steps
   before replying).
2. **Google Gemini (free tier) node** — model `gemini-2.0-flash` (or
   current free-tier flash model), with a **Structured Output Parser**
   forcing this exact JSON shape:
   ```json
   { "severity": "routine|soon|urgent|emergency",
     "advice": "string",
     "suggestedQuery": "string",
     "disclaimer": "string" }
   ```
   System prompt (verbatim, tutorial explains why each line exists):
   ```
   You are a pet symptom triage assistant, not a veterinarian.
   Never diagnose a specific disease. Never recommend a medication or dosage.
   Always end your advice by recommending the owner contact a licensed vet.
   If symptoms sound life-threatening, set severity to "emergency" and say so plainly.
   suggestedQuery must be a short vet-search phrase, e.g. "emergency vet" or "vet for vomiting cat".
   disclaimer must always be: "This is general guidance, not a diagnosis. Contact a licensed veterinarian for medical advice."
   Respond only with the JSON object, no extra text.
   ```
   User message: `Species: {{species}}. Symptom: {{symptomText}}`
3. **IF node** — condition: `{{$json.email}}` is not empty.
   - **True branch → Send Email node** (SMTP: Gmail + app password
     credential, tutorial covers setup). To: `{{$json.email}}`. Subject:
     `Your pet triage summary`. Body: template using `severity`, `advice`,
     `disclaimer` from the Gemini node output.
   - Both branches feed a **Set node** that adds `emailSent: true` (true
     branch, after email send) or `emailSent: false` (false branch).
4. **Merge node** (or two Set nodes feeding one **Respond to Webhook**
   node) — final response body: `{ severity, advice, suggestedQuery,
   disclaimer, emailSent }`, matching `TriageResponseSchema` exactly.

Once built and manually tested (curl, §10), export via n8n's "Download"
menu and commit the JSON to `docs/n8n/triage-workflow.json` so it's
versioned and re-importable.

## 9. Tutorial (`docs/n8n-tutorial.md`) — required sections

Written for someone who has never used n8n. Visuals via Mermaid diagrams
and ASCII node-map sketches (no image generation available).

1. **What is n8n** — node-based workflow automation, visual analog to
   writing a small server-side script; where it fits vs. writing code by
   hand.
2. **Install & run free, no account needed** — `npx n8n`, opens
   `localhost:5678`; note the difference vs. n8n Cloud (paid/trial) —
   we're self-hosting, forever free.
3. **Core concepts illustrated** — Trigger nodes vs. action nodes,
   `Execute workflow` (manual test run), `$json` expression syntax, one
   Mermaid diagram showing node graph shape.
4. **Get a free Gemini API key** — Google AI Studio steps, no credit
   card, where the key goes (n8n credential, never in our app's `.env`).
5. **Get Gmail app password** — for the free SMTP send step.
6. **Build the triage workflow step-by-step** — one subsection per node
   in §8, screenshots-as-ASCII node boxes, expected test payload/response
   at each step.
7. **Exposing the webhook to our Next.js app in local dev** — n8n's
   built-in tunnel (`n8n start --tunnel`) vs. just running both on
   localhost (same machine, no tunnel needed) — recommend the localhost
   path for dev since both run on one machine; tunnel/production hosting
   noted as a later step (Railway/Fly.io free tier, or a VPS) — not built
   in this feature.
8. **Wiring env vars** — `.env.local` values, restart `yarn dev`.
9. **Testing end-to-end** — curl the webhook directly, then curl our
   `/api/triage` route, then use the UI.
10. **How this connects to the code** — a small table mapping each file
    in §4 to what it does, so the reader can trace browser click → n8n →
    LLM → email → back.
11. **Extending this pattern** — one paragraph on reusing the same
    webhook-from-API-route pattern for a second automation later (e.g.
    clinic inquiry emails), without over-building now.

## 10. Error handling matrix

| Failure | User sees |
|---|---|
| n8n unreachable / down | Friendly "AI advice is temporarily unavailable" in `TriageResult`; form stays usable, manual vet search unaffected |
| n8n timeout (>10s) | Same friendly message, distinct log code `UPSTREAM_TIMEOUT` |
| Gemini free-tier rate limit hit (n8n node errors) | n8n workflow's own error path (Respond to Webhook with `500`) → our route maps to `UPSTREAM_UNAVAILABLE` |
| Malformed n8n response (schema mismatch) | Treated as `UPSTREAM_UNAVAILABLE`, never shown raw to user |
| Emergency keyword matched | Bypasses n8n entirely, always succeeds |
| Missing env var in our app | `500 CONFIG_ERROR`, generic message, detail only in server log |

The vet search feature must never break if triage/n8n is down — they are
fully independent code paths.

## 11. Testing

- `lib/triage/emergency.test.ts` — keyword matches / non-matches.
- `app/api/triage/route.test.ts` — mock `callTriageWebhook`; cover
  validation error, emergency short-circuit, success, timeout, upstream
  error.
- `components/find-vet/triage-form.test.tsx` — submit disabled until
  valid, loading state, renders `TriageResult` on success, renders error
  state on failure.
- Manual: curl against a real local n8n instance before wiring the UI
  (commands given in tutorial §9).

## 12. Acceptance criteria

- [ ] Submitting the form with a normal symptom returns and renders
      severity/advice/suggested query within the AI reply panel.
- [ ] Clicking the suggested-query button re-runs `searchByQuery` on the
      existing vet search (no page reload, reuses `useVetSearch`).
- [ ] Submitting an emergency-keyword symptom returns instantly, no n8n
      call made (verify via log/network tab).
- [ ] Providing an email triggers a real email via the n8n workflow.
- [ ] n8n stopped/unreachable → feature degrades gracefully, rest of
      `/find-vet` unaffected.
- [ ] No secret (webhook secret, LLM key) ever appears in client bundle
      or browser network request.
- [ ] `docs/n8n-tutorial.md` lets a first-time n8n user reproduce the
      workflow from scratch.
- [ ] `docs/n8n/triage-workflow.json` importable into a fresh n8n
      instance and reproduces the built workflow.
