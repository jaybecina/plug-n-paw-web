# AI Symptom Triage (n8n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a form-based AI symptom triage feature to `/find-vet`, backed by a self-hosted n8n workflow calling a free-tier LLM, with a companion tutorial.

**Architecture:** Browser form → our `POST /api/triage` route (rate limit → validate → emergency-keyword short-circuit) → n8n webhook (input re-validated → LLM → optional email) → JSON passed through a safety-policy layer → rendered in a result panel with a "search for this" button wired into the existing `useVetSearch` hook.

**Tech Stack:** Next.js 16.3.5 App Router route handlers, zod, Vitest + React Testing Library (new — not yet in repo), shadcn/ui, n8n (self-hosted, free), Google Gemini free tier.

**Spec:** `docs/superpowers/specs/2026-09-16-n8n-triage-automation-design.md` (revised 2026-09-16 after external review — see that file's "Revision notes")

## Global Constraints

- No paid service anywhere in this feature; n8n self-hosted, Gemini free tier, Gmail SMTP. Free-tier availability/model names can change — never hardcode a model name outside the n8n node itself (spec §8).
- Browser never calls n8n directly — only our own API route does (webhook secret stays server-side).
- Emergency-keyword check runs before any n8n/LLM call and always succeeds even if n8n is down.
- n8n's raw LLM output never reaches the browser directly — always passes through `applySafetyPolicy` (Task 4) first.
- `/find-vet` vet search must keep working even if triage/n8n is completely down (independent failure domain).
- Never log raw `symptomText` or `email` (PII), and never log the full n8n request/response body.
- All new UI built from shadcn primitives already in `components/ui/` or added via `npx shadcn add`; don't hand-roll what shadcn provides.
- Before writing `app/api/triage/route.ts`, mirror the exact conventions already used in `app/api/vets/search/route.ts` (already proven correct for this Next.js version) rather than relying on general Next.js knowledge.

---

## Task 1: Testing infrastructure (Vitest + React Testing Library)

No test runner exists in this repo yet — every later task depends on this.

**Files:**
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add `test` script + devDependencies)
- Test: `__tests__/page.test.tsx` (smoke test proving the harness works)

**Interfaces:**
- Produces: `yarn test` (watch mode), `yarn test run` (single run) — every later task's test step uses this.

- [ ] **Step 1: Install dependencies**

```bash
yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths
```

- [ ] **Step 2: Create `vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add `test` script to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest"
}
```

- [ ] **Step 5: Write the smoke test**

```tsx
// __tests__/page.test.tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

test("home page renders", () => {
  render(<Page />);
  expect(document.body).toBeInTheDocument();
});
```

If `app/page.tsx` has no clear heading role, the assertion above (body
renders without throwing) is enough — this test only proves the harness
works, not app content.

- [ ] **Step 6: Run it**

Run: `yarn test run`
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add package.json yarn.lock vitest.config.mts vitest.setup.ts __tests__/page.test.tsx
git commit -m "test: add Vitest + React Testing Library harness"
```

---

## Task 2: Emergency keyword detector

**Files:**
- Create: `lib/triage/emergency.ts`
- Test: `lib/triage/emergency.test.ts`

**Interfaces:**
- Produces: `EMERGENCY_KEYWORDS: string[]`, `isEmergencySymptom(text: string): boolean` — consumed by Task 7 (API route).

- [ ] **Step 1: Write the failing test**

```ts
// lib/triage/emergency.test.ts
import { describe, expect, test } from "vitest";
import { isEmergencySymptom } from "./emergency";

describe("isEmergencySymptom", () => {
  test("matches an emergency phrase case-insensitively", () => {
    expect(isEmergencySymptom("My dog is Not Breathing right now")).toBe(true);
  });

  test("matches when the phrase is embedded in a longer sentence", () => {
    expect(
      isEmergencySymptom("she just had a seizure and is shaking")
    ).toBe(true);
  });

  test("does not match a routine symptom", () => {
    expect(isEmergencySymptom("mild itching behind the ears for two days")).toBe(
      false
    );
  });

  test("does not match an empty string", () => {
    expect(isEmergencySymptom("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run lib/triage/emergency.test.ts`
Expected: FAIL — `Cannot find module './emergency'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/triage/emergency.ts
export const EMERGENCY_KEYWORDS = [
  "can't breathe",
  "cant breathe",
  "not breathing",
  "stopped breathing",
  "seizure",
  "collapsed",
  "unconscious",
  "unresponsive",
  "poisoned",
  "ate poison",
  "ate chocolate",
  "ate rat bait",
  "bleeding heavily",
  "won't stop bleeding",
  "wont stop bleeding",
  "hit by car",
  "hit by a car",
  "bloated stomach",
  "swollen belly and pacing",
  "blue gums",
  "pale gums",
];

export function isEmergencySymptom(text: string): boolean {
  const normalized = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run lib/triage/emergency.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/triage/emergency.ts lib/triage/emergency.test.ts
git commit -m "feat: add emergency symptom keyword detector"
```

---

## Task 3: Triage data contracts

**Files:**
- Create: `lib/triage/types.ts`
- Test: `lib/triage/types.test.ts`

**Interfaces:**
- Produces: `TRIAGE_DISCLAIMER`, `TriageSeveritySchema`, `TriageSeverity`, `TriageRequestSchema`, `TriageRequest`, `TriageResponseSchema`, `TriageResponse`, `TriageErrorCode`, `TriageErrorResponse` — consumed by Tasks 4, 6, 7, 8, 10, 11.

- [ ] **Step 1: Write the failing test**

```ts
// lib/triage/types.test.ts
import { describe, expect, test } from "vitest";
import { TRIAGE_DISCLAIMER, TriageRequestSchema, TriageResponseSchema } from "./types";

describe("TriageRequestSchema", () => {
  test("accepts a valid request", () => {
    const result = TriageRequestSchema.safeParse({
      species: "dog",
      symptomText: "vomiting since this morning",
    });
    expect(result.success).toBe(true);
  });

  test("rejects symptomText shorter than 10 characters", () => {
    const result = TriageRequestSchema.safeParse({
      species: "dog",
      symptomText: "too short",
    });
    expect(result.success).toBe(false);
  });

  test("rejects symptomText longer than 500 characters", () => {
    const result = TriageRequestSchema.safeParse({
      species: "dog",
      symptomText: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid species", () => {
    const result = TriageRequestSchema.safeParse({
      species: "dragon",
      symptomText: "breathing fire occasionally",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid email", () => {
    const result = TriageRequestSchema.safeParse({
      species: "cat",
      symptomText: "lethargic for two days now",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("TriageResponseSchema", () => {
  test("accepts a well-formed n8n response", () => {
    const result = TriageResponseSchema.safeParse({
      severity: "soon",
      advice: "Monitor for 24 hours.",
      suggestedQuery: "vet for vomiting dog",
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    });
    expect(result.success).toBe(true);
  });

  test("rejects an unknown severity value", () => {
    const result = TriageResponseSchema.safeParse({
      severity: "mild",
      advice: "x",
      suggestedQuery: "x",
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    });
    expect(result.success).toBe(false);
  });

  test("rejects a disclaimer that doesn't match the constant exactly", () => {
    const result = TriageResponseSchema.safeParse({
      severity: "routine",
      advice: "x",
      suggestedQuery: "x",
      disclaimer: "This is probably nothing serious.",
      emailSent: false,
    });
    expect(result.success).toBe(false);
  });

  test("rejects a suggestedQuery longer than 100 characters", () => {
    const result = TriageResponseSchema.safeParse({
      severity: "routine",
      advice: "x",
      suggestedQuery: "a".repeat(101),
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run lib/triage/types.test.ts`
Expected: FAIL — `Cannot find module './types'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/triage/types.ts
import { z } from "zod";

export const TRIAGE_DISCLAIMER =
  "This is general guidance, not a diagnosis. Contact a licensed veterinarian for medical advice.";

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
  email: z.string().trim().email().max(254).optional(),
});
export type TriageRequest = z.infer<typeof TriageRequestSchema>;

export const TriageResponseSchema = z.object({
  severity: TriageSeveritySchema,
  advice: z.string().trim().min(1).max(2000),
  suggestedQuery: z.string().trim().min(1).max(100),
  disclaimer: z.literal(TRIAGE_DISCLAIMER),
  emailSent: z.boolean(),
});
export type TriageResponse = z.infer<typeof TriageResponseSchema>;

export type TriageErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "CONFIG_ERROR";

export type TriageErrorResponse = {
  error: { code: TriageErrorCode; message: string; requestId: string };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run lib/triage/types.test.ts`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/triage/types.ts lib/triage/types.test.ts
git commit -m "feat: add triage request/response schemas"
```

---

## Task 4: Safety policy layer

**Files:**
- Create: `lib/triage/policy.ts`
- Test: `lib/triage/policy.test.ts`

**Interfaces:**
- Consumes: `TRIAGE_DISCLAIMER`, `TriageResponseSchema`, `TriageResponse` from `lib/triage/types.ts` (Task 3).
- Produces: `applySafetyPolicy(raw: unknown): TriageResponse` (throws on invalid shape) — consumed by Task 7 (API route). This is the layer that stands between n8n's raw output and the browser; the route must never forward n8n's JSON unprocessed.

- [ ] **Step 1: Write the failing test**

```ts
// lib/triage/policy.test.ts
import { describe, expect, test } from "vitest";
import { TRIAGE_DISCLAIMER } from "./types";
import { applySafetyPolicy } from "./policy";

describe("applySafetyPolicy", () => {
  test("passes through a well-formed response unchanged", () => {
    const input = {
      severity: "routine" as const,
      advice: "Keep an eye on it.",
      suggestedQuery: "vet checkup",
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    };
    expect(applySafetyPolicy(input)).toEqual(input);
  });

  test("throws on an invalid severity", () => {
    expect(() =>
      applySafetyPolicy({
        severity: "mild",
        advice: "x",
        suggestedQuery: "x",
        disclaimer: TRIAGE_DISCLAIMER,
        emailSent: false,
      })
    ).toThrow();
  });

  test("throws on a disclaimer that doesn't match the constant", () => {
    expect(() =>
      applySafetyPolicy({
        severity: "routine",
        advice: "x",
        suggestedQuery: "x",
        disclaimer: "This is probably fine.",
        emailSent: false,
      })
    ).toThrow();
  });

  test("clamps an over-long suggestedQuery to 100 characters", () => {
    const result = applySafetyPolicy({
      severity: "routine",
      advice: "x",
      suggestedQuery: "a".repeat(150),
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    });
    expect(result.suggestedQuery.length).toBeLessThanOrEqual(100);
  });
});
```

Note: the schema itself already rejects a `suggestedQuery` over 100
characters (Task 3), so `applySafetyPolicy` never actually receives one
in practice — this test documents the clamp as a defense-in-depth
belt-and-suspenders behavior, not the primary control.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run lib/triage/policy.test.ts`
Expected: FAIL — `Cannot find module './policy'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/triage/policy.ts
import { TRIAGE_DISCLAIMER, TriageResponseSchema, type TriageResponse } from "./types";

export function applySafetyPolicy(raw: unknown): TriageResponse {
  const parsed = TriageResponseSchema.parse(raw);

  return {
    ...parsed,
    disclaimer: TRIAGE_DISCLAIMER,
    suggestedQuery: parsed.suggestedQuery.slice(0, 100),
  };
}
```

Since `suggestedQuery` is capped at 100 chars by `TriageResponseSchema`
already (`z.string().max(100)`), `.parse` throws before the `.slice`
would ever need to trim anything — the `.slice(0, 100)` line is the
defense-in-depth clamp described in the test above, cheap enough to
keep even though the schema is the real gate.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run lib/triage/policy.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/triage/policy.ts lib/triage/policy.test.ts
git commit -m "feat: add safety policy layer for triage responses"
```

---

## Task 5: Rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Test: `lib/rate-limit.test.ts`

**Interfaces:**
- Produces: `checkRateLimit(key: string): { allowed: boolean }` — consumed by Task 7 (API route).

- [ ] **Step 1: Write the failing test**

```ts
// lib/rate-limit.test.ts
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("allows up to 5 requests per key within a minute", () => {
    const key = "test-key-1";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key).allowed).toBe(true);
    }
  });

  test("blocks the 6th request within the same minute", () => {
    const key = "test-key-2";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key).allowed).toBe(false);
  });

  test("allows again once the window passes", () => {
    const key = "test-key-3";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(checkRateLimit(key).allowed).toBe(true);
  });

  test("tracks different keys independently", () => {
    const keyA = "test-key-a";
    const keyB = "test-key-b";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(keyA);
    }
    expect(checkRateLimit(keyA).allowed).toBe(false);
    expect(checkRateLimit(keyB).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run lib/rate-limit.test.ts`
Expected: FAIL — `Cannot find module './rate-limit'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/rate-limit.ts
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean } {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    buckets.set(key, timestamps);
    return { allowed: false };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { allowed: true };
}
```

In-memory, single-process — see spec §7a for the documented tradeoff
(resets on restart, doesn't share state across multiple instances;
acceptable for MVP traffic, upgrade path noted in the tutorial).

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run lib/rate-limit.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts lib/rate-limit.test.ts
git commit -m "feat: add in-memory rate limiter"
```

---

## Task 6: n8n config + client

**Files:**
- Create: `lib/n8n/config.ts`
- Create: `lib/n8n/client.ts`
- Test: `lib/n8n/client.test.ts`
- Modify: `.env.example` (add `N8N_TRIAGE_WEBHOOK_URL=`, `N8N_WEBHOOK_SECRET=`)

**Interfaces:**
- Consumes: `TriageRequest`, `TriageResponse`, `TriageResponseSchema` from `lib/triage/types.ts` (Task 3).
- Produces: `getN8nWebhookUrl(): string`, `getN8nWebhookSecret(): string`, `callTriageWebhook(input: TriageRequest): Promise<TriageResponse>`, `class N8nUpstreamError extends Error` — consumed by Task 7 (API route). Note: `callTriageWebhook` returns the *raw* parsed response — `applySafetyPolicy` (Task 4) is applied by the caller (Task 7), not here, to keep this file a thin transport client.

- [ ] **Step 1: Write the failing test**

```ts
// lib/n8n/client.test.ts
import { afterEach, describe, expect, test, vi } from "vitest";
import { TRIAGE_DISCLAIMER } from "@/lib/triage/types";
import { callTriageWebhook, N8nUpstreamError } from "./client";

const validResponse = {
  severity: "routine",
  advice: "Keep an eye on it.",
  suggestedQuery: "vet checkup",
  disclaimer: TRIAGE_DISCLAIMER,
  emailSent: false,
};

describe("callTriageWebhook", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test("returns parsed response on success", async () => {
    vi.stubEnv("N8N_TRIAGE_WEBHOOK_URL", "https://n8n.example.com/webhook/pet-triage");
    vi.stubEnv("N8N_WEBHOOK_SECRET", "test-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validResponse,
      })
    );

    const result = await callTriageWebhook({
      species: "dog",
      symptomText: "vomiting since this morning",
    });

    expect(result).toEqual(validResponse);
  });

  test("sends the webhook secret header", async () => {
    vi.stubEnv("N8N_TRIAGE_WEBHOOK_URL", "https://n8n.example.com/webhook/pet-triage");
    vi.stubEnv("N8N_WEBHOOK_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validResponse,
    });
    vi.stubGlobal("fetch", fetchMock);

    await callTriageWebhook({ species: "cat", symptomText: "lethargic for two days" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["x-webhook-secret"]).toBe("test-secret");
  });

  test("throws N8nUpstreamError on non-2xx response", async () => {
    vi.stubEnv("N8N_TRIAGE_WEBHOOK_URL", "https://n8n.example.com/webhook/pet-triage");
    vi.stubEnv("N8N_WEBHOOK_SECRET", "test-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );

    await expect(
      callTriageWebhook({ species: "dog", symptomText: "vomiting since this morning" })
    ).rejects.toThrow(N8nUpstreamError);
  });

  test("throws N8nUpstreamError when the response shape is malformed", async () => {
    vi.stubEnv("N8N_TRIAGE_WEBHOOK_URL", "https://n8n.example.com/webhook/pet-triage");
    vi.stubEnv("N8N_WEBHOOK_SECRET", "test-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ nonsense: true }) })
    );

    await expect(
      callTriageWebhook({ species: "dog", symptomText: "vomiting since this morning" })
    ).rejects.toThrow(N8nUpstreamError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run lib/n8n/client.test.ts`
Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 3: Write `lib/n8n/config.ts`**

```ts
// lib/n8n/config.ts
export function getN8nWebhookUrl() {
  const url = process.env.N8N_TRIAGE_WEBHOOK_URL?.trim();

  if (!url) {
    throw new Error("N8N_TRIAGE_WEBHOOK_URL is not configured");
  }

  return url;
}

export function getN8nWebhookSecret() {
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error("N8N_WEBHOOK_SECRET is not configured");
  }

  return secret;
}
```

- [ ] **Step 4: Write `lib/n8n/client.ts`**

```ts
// lib/n8n/client.ts
import { getN8nWebhookSecret, getN8nWebhookUrl } from "./config";
import { TriageResponseSchema, type TriageRequest, type TriageResponse } from "@/lib/triage/types";

export class N8nUpstreamError extends Error {
  constructor(message: string, public readonly details: { status?: number } = {}) {
    super(message);
    this.name = "N8nUpstreamError";
  }
}

export async function callTriageWebhook(
  input: TriageRequest
): Promise<TriageResponse> {
  const url = getN8nWebhookUrl();
  const secret = getN8nWebhookSecret();

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw error;
    }

    throw new N8nUpstreamError("n8n webhook is unreachable");
  }

  if (!response.ok) {
    throw new N8nUpstreamError("n8n webhook returned a non-2xx response", {
      status: response.status,
    });
  }

  const body = await response.json();
  const parsed = TriageResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new N8nUpstreamError("n8n webhook returned an unexpected shape");
  }

  return parsed.data;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn test run lib/n8n/client.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Update `.env.example`**

```
GEOAPIFY_API_KEY=
N8N_TRIAGE_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
```

- [ ] **Step 7: Commit**

```bash
git add lib/n8n/config.ts lib/n8n/client.ts lib/n8n/client.test.ts .env.example
git commit -m "feat: add n8n webhook client for triage automation"
```

---

## Task 7: API route `/api/triage`

**Files:**
- Create: `app/api/triage/route.ts`
- Test: `app/api/triage/route.test.ts`

**Interfaces:**
- Consumes: `TriageRequestSchema`, `TriageErrorCode` (Task 3); `applySafetyPolicy` (Task 4); `checkRateLimit` (Task 5); `isEmergencySymptom` (Task 2); `callTriageWebhook`, `N8nUpstreamError` (Task 6).
- Produces: `POST` handler at `/api/triage` returning `TriageResponse` (200) or `TriageErrorResponse` (400/429/500/502/504) — consumed by Task 8 (`useTriage` hook).

Before writing this file, read
`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
and re-read `app/api/vets/search/route.ts` — mirror its exact structure
(the `requestId`/`jsonError`/structured `console.info` pattern below is
copied from it on purpose, for consistency).

- [ ] **Step 1: Write the failing test**

```ts
// app/api/triage/route.test.ts
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TRIAGE_DISCLAIMER } from "@/lib/triage/types";

vi.mock("@/lib/n8n/client", () => ({
  callTriageWebhook: vi.fn(),
  N8nUpstreamError: class N8nUpstreamError extends Error {},
}));

import { callTriageWebhook } from "@/lib/n8n/client";
import { POST } from "./route";

function makeRequest(body: unknown, ip = "203.0.113.1") {
  return new Request("http://localhost/api/triage", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/triage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("returns 400 on invalid body", async () => {
    const response = await POST(makeRequest({ species: "dog", symptomText: "hi" }, "203.0.113.10"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("returns 400 on an oversized symptomText", async () => {
    const response = await POST(
      makeRequest({ species: "dog", symptomText: "a".repeat(501) }, "203.0.113.11")
    );
    expect(response.status).toBe(400);
  });

  test("returns 400 on an invalid species", async () => {
    const response = await POST(
      makeRequest({ species: "dragon", symptomText: "breathing fire occasionally" }, "203.0.113.12")
    );
    expect(response.status).toBe(400);
  });

  test("short-circuits on an emergency keyword without calling n8n", async () => {
    const response = await POST(
      makeRequest({ species: "dog", symptomText: "he is not breathing right now" }, "203.0.113.13")
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.severity).toBe("emergency");
    expect(callTriageWebhook).not.toHaveBeenCalled();
  });

  test("returns the n8n response, passed through the safety policy, on success", async () => {
    vi.mocked(callTriageWebhook).mockResolvedValue({
      severity: "routine",
      advice: "Monitor for a day.",
      suggestedQuery: "vet checkup",
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    });

    const response = await POST(
      makeRequest({ species: "cat", symptomText: "sneezing occasionally today" }, "203.0.113.14")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.severity).toBe("routine");
    expect(body.disclaimer).toBe(TRIAGE_DISCLAIMER);
  });

  test("returns 502 when n8n throws N8nUpstreamError", async () => {
    const { N8nUpstreamError } = await import("@/lib/n8n/client");
    vi.mocked(callTriageWebhook).mockRejectedValue(new N8nUpstreamError("down"));

    const response = await POST(
      makeRequest({ species: "cat", symptomText: "sneezing occasionally today" }, "203.0.113.15")
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.code).toBe("UPSTREAM_UNAVAILABLE");
  });

  test("returns 502 when n8n's response fails the safety policy", async () => {
    vi.mocked(callTriageWebhook).mockResolvedValue({
      severity: "routine",
      advice: "x",
      suggestedQuery: "x",
      // @ts-expect-error deliberately malformed for the test
      disclaimer: "not the constant",
      emailSent: false,
    });

    const response = await POST(
      makeRequest({ species: "cat", symptomText: "sneezing occasionally today" }, "203.0.113.16")
    );

    expect(response.status).toBe(502);
  });

  test("returns 504 when n8n times out", async () => {
    vi.mocked(callTriageWebhook).mockRejectedValue(
      new DOMException("timeout", "TimeoutError")
    );

    const response = await POST(
      makeRequest({ species: "cat", symptomText: "sneezing occasionally today" }, "203.0.113.17")
    );

    expect(response.status).toBe(504);
    const body = await response.json();
    expect(body.error.code).toBe("UPSTREAM_TIMEOUT");
  });

  test("returns 429 after exceeding the rate limit", async () => {
    vi.mocked(callTriageWebhook).mockResolvedValue({
      severity: "routine",
      advice: "x",
      suggestedQuery: "x",
      disclaimer: TRIAGE_DISCLAIMER,
      emailSent: false,
    });
    const ip = "203.0.113.99";

    for (let i = 0; i < 5; i++) {
      const ok = await POST(
        makeRequest({ species: "cat", symptomText: "sneezing occasionally today" }, ip)
      );
      expect(ok.status).toBe(200);
    }

    const limited = await POST(
      makeRequest({ species: "cat", symptomText: "sneezing occasionally today" }, ip)
    );
    expect(limited.status).toBe(429);
    const body = await limited.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });
});
```

Each non-rate-limit test uses a distinct IP so it doesn't get blocked by
an earlier test's requests — `lib/rate-limit.ts`'s in-memory state
persists across tests in the same file run.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run app/api/triage/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write the implementation**

```ts
// app/api/triage/route.ts
import { checkRateLimit } from "@/lib/rate-limit";
import { isEmergencySymptom } from "@/lib/triage/emergency";
import { applySafetyPolicy } from "@/lib/triage/policy";
import { TRIAGE_DISCLAIMER, TriageRequestSchema } from "@/lib/triage/types";
import type { TriageErrorCode, TriageResponse } from "@/lib/triage/types";
import { callTriageWebhook, N8nUpstreamError } from "@/lib/n8n/client";

const EMERGENCY_RESPONSE_BASE = {
  severity: "emergency" as const,
  advice:
    "This sounds urgent. Please contact an emergency vet clinic right away.",
  suggestedQuery: "emergency vet",
  disclaimer: TRIAGE_DISCLAIMER,
  emailSent: false,
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let status = 200;
  let severity: TriageResponse["severity"] | undefined;

  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    if (!checkRateLimit(ip).allowed) {
      status = 429;
      return jsonError(
        "RATE_LIMITED",
        "Too many requests. Try again shortly.",
        requestId,
        status
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = TriageRequestSchema.safeParse(body);

    if (!parsed.success) {
      status = 400;
      return jsonError(
        "VALIDATION_ERROR",
        "Enter a symptom description of at least 10 characters.",
        requestId,
        status
      );
    }

    if (isEmergencySymptom(parsed.data.symptomText)) {
      status = 200;
      severity = "emergency";
      return Response.json(EMERGENCY_RESPONSE_BASE, { status });
    }

    const raw = await callTriageWebhook(parsed.data);
    const data = applySafetyPolicy(raw);
    status = 200;
    severity = data.severity;

    return Response.json(data, { status });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      status = 504;
      return jsonError(
        "UPSTREAM_TIMEOUT",
        "AI advice is taking too long. Try again.",
        requestId,
        status
      );
    }

    if (error instanceof N8nUpstreamError) {
      status = 502;
      return jsonError(
        "UPSTREAM_UNAVAILABLE",
        "AI advice is temporarily unavailable.",
        requestId,
        status
      );
    }

    // applySafetyPolicy throws a plain zod error on a malformed n8n
    // response — treat that the same as an upstream failure, never
    // forward it to the client.
    if (error instanceof Error && error.name === "ZodError") {
      status = 502;
      return jsonError(
        "UPSTREAM_UNAVAILABLE",
        "AI advice is temporarily unavailable.",
        requestId,
        status
      );
    }

    status = 500;
    return jsonError(
      "CONFIG_ERROR",
      "AI advice is temporarily unavailable.",
      requestId,
      status
    );
  } finally {
    console.info(
      JSON.stringify({
        scope: "triage",
        requestId,
        severity,
        provider: "n8n",
        durationMs: Date.now() - startedAt,
        status,
      })
    );
  }
}

function jsonError(
  code: TriageErrorCode,
  message: string,
  requestId: string,
  status: number
) {
  return Response.json(
    { error: { code, message, requestId } },
    { status }
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run app/api/triage/route.test.ts`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add app/api/triage/route.ts app/api/triage/route.test.ts
git commit -m "feat: add POST /api/triage route with rate limiting and safety policy"
```

---

## Task 8: `useTriage` hook

**Files:**
- Create: `hooks/use-triage.ts`
- Test: `hooks/use-triage.test.ts`

**Interfaces:**
- Consumes: `TriageRequest`, `TriageResponse`, `TriageErrorCode` (Task 3); calls `POST /api/triage` (Task 7).
- Produces: `useTriage()` returning `{ status: "idle"|"loading"|"success"|"error", result: TriageResponse | null, errorCode: TriageErrorCode | null, submit(input: TriageRequest): Promise<void>, reset(): void }` — consumed by Task 12 (`TriageTrigger`).

- [ ] **Step 1: Write the failing test**

```ts
// hooks/use-triage.test.ts
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TRIAGE_DISCLAIMER } from "@/lib/triage/types";
import { useTriage } from "./use-triage";

const validResponse = {
  severity: "routine",
  advice: "Monitor for a day.",
  suggestedQuery: "vet checkup",
  disclaimer: TRIAGE_DISCLAIMER,
  emailSent: false,
};

describe("useTriage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("starts idle", () => {
    const { result } = renderHook(() => useTriage());
    expect(result.current.status).toBe("idle");
    expect(result.current.result).toBeNull();
  });

  test("submit success sets status and result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validResponse,
      })
    );

    const { result } = renderHook(() => useTriage());

    await act(async () => {
      await result.current.submit({
        species: "dog",
        symptomText: "vomiting since this morning",
      });
    });

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.result).toEqual(validResponse);
  });

  test("submit failure sets status error and errorCode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: "UPSTREAM_UNAVAILABLE", message: "down", requestId: "x" },
        }),
      })
    );

    const { result } = renderHook(() => useTriage());

    await act(async () => {
      await result.current.submit({
        species: "dog",
        symptomText: "vomiting since this morning",
      });
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorCode).toBe("UPSTREAM_UNAVAILABLE");
  });

  test("reset returns to idle", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => validResponse })
    );
    const { result } = renderHook(() => useTriage());

    await act(async () => {
      await result.current.submit({
        species: "dog",
        symptomText: "vomiting since this morning",
      });
    });
    act(() => result.current.reset());

    expect(result.current.status).toBe("idle");
    expect(result.current.result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run hooks/use-triage.test.ts`
Expected: FAIL — `Cannot find module './use-triage'`

- [ ] **Step 3: Write the implementation**

```ts
// hooks/use-triage.ts
"use client";

import { useCallback, useState } from "react";
import type { TriageErrorCode, TriageRequest, TriageResponse } from "@/lib/triage/types";

type TriageStatus = "idle" | "loading" | "success" | "error";

export function useTriage() {
  const [status, setStatus] = useState<TriageStatus>("idle");
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [errorCode, setErrorCode] = useState<TriageErrorCode | null>(null);

  const submit = useCallback(async (input: TriageRequest) => {
    setStatus("loading");
    setErrorCode(null);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });

      const body = await response.json();

      if (!response.ok) {
        setErrorCode(body.error?.code ?? "UPSTREAM_UNAVAILABLE");
        setStatus("error");
        return;
      }

      setResult(body as TriageResponse);
      setStatus("success");
    } catch {
      setErrorCode("UPSTREAM_UNAVAILABLE");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorCode(null);
  }, []);

  return { status, result, errorCode, submit, reset };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run hooks/use-triage.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-triage.ts hooks/use-triage.test.ts
git commit -m "feat: add useTriage hook for /api/triage"
```

---

## Task 9: Add required shadcn primitives

**Files:**
- Create: `components/ui/dialog.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/ui/label.tsx`, `components/ui/badge.tsx`, `components/ui/alert.tsx` (generated, not hand-written)

**Interfaces:**
- Produces: `Dialog`/`DialogTrigger`/`DialogContent`/etc., `Textarea`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`, `Label`, `Badge`, `Alert`/`AlertTitle`/`AlertDescription` — consumed by Tasks 10, 11, 12.

- [ ] **Step 1: Generate the components**

```bash
npx shadcn add dialog textarea select label badge alert
```

- [ ] **Step 2: Verify the project still builds**

Run: `yarn build`
Expected: build succeeds (this only proves the generated files compile; no new tests here since these are vendored components, not our logic).

- [ ] **Step 3: Commit**

```bash
git add components/ui/dialog.tsx components/ui/textarea.tsx components/ui/select.tsx components/ui/label.tsx components/ui/badge.tsx components/ui/alert.tsx components.json package.json yarn.lock
git commit -m "chore: add shadcn dialog, textarea, select, label, badge, alert"
```

(If `shadcn add` touches other files, e.g. `app/globals.css` for new CSS variables, include them in the same commit.)

---

## Task 10: `TriageForm` component

**Files:**
- Create: `components/find-vet/triage-form.tsx`
- Test: `components/find-vet/triage-form.test.tsx`

**Interfaces:**
- Consumes: `TriageRequest` (Task 3); `Button`, `Textarea`, `Select*`, `Label` (Task 9).
- Produces: `TriageForm(props: { onSubmit: (input: TriageRequest) => void; isLoading: boolean })` — consumed by Task 12.

- [ ] **Step 1: Write the failing test**

```tsx
// components/find-vet/triage-form.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TriageForm } from "./triage-form";

describe("TriageForm", () => {
  test("submit button is disabled until symptom text is long enough", () => {
    render(<TriageForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByRole("button", { name: /get advice/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/symptom/i), {
      target: { value: "vomiting since this morning" },
    });

    expect(screen.getByRole("button", { name: /get advice/i })).toBeEnabled();
  });

  test("calls onSubmit with species and symptomText", () => {
    const onSubmit = vi.fn();
    render(<TriageForm onSubmit={onSubmit} isLoading={false} />);

    fireEvent.change(screen.getByLabelText(/symptom/i), {
      target: { value: "vomiting since this morning" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get advice/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      species: "dog",
      symptomText: "vomiting since this morning",
      email: undefined,
    });
  });

  test("disables the submit button while loading", () => {
    render(<TriageForm onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole("button", { name: /get advice/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run components/find-vet/triage-form.test.tsx`
Expected: FAIL — `Cannot find module './triage-form'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/find-vet/triage-form.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TriageRequest } from "@/lib/triage/types";

type TriageFormProps = {
  onSubmit: (input: TriageRequest) => void;
  isLoading: boolean;
};

export function TriageForm({ onSubmit, isLoading }: TriageFormProps) {
  const [species, setSpecies] = useState<TriageRequest["species"]>("dog");
  const [symptomText, setSymptomText] = useState("");
  const [email, setEmail] = useState("");

  const isValid = symptomText.trim().length >= 10;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isValid) {
      return;
    }

    onSubmit({
      species,
      symptomText: symptomText.trim(),
      email: email.trim() ? email.trim() : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="triage-species">Pet type</Label>
        <Select
          value={species}
          onValueChange={(value) => setSpecies(value as TriageRequest["species"])}
        >
          <SelectTrigger id="triage-species">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dog">Dog</SelectItem>
            <SelectItem value="cat">Cat</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="triage-symptom">Symptom</Label>
        <Textarea
          id="triage-symptom"
          value={symptomText}
          onChange={(event) => setSymptomText(event.target.value)}
          placeholder="Describe what's going on, e.g. vomiting since this morning"
          minLength={10}
          maxLength={500}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="triage-email">Email (optional, for a copy of the advice)</Label>
        <Input
          id="triage-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={254}
        />
      </div>

      <Button type="submit" disabled={!isValid || isLoading}>
        {isLoading ? "Getting advice..." : "Get advice"}
      </Button>
    </form>
  );
}
```

Check `components/ui/input.tsx`'s prop signature before this step — if
it doesn't cleanly forward `id`/`type`/`maxLength`, use a plain
`<input>` styled to match instead, but prefer `Input` for visual
consistency with `SearchBar`.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run components/find-vet/triage-form.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add components/find-vet/triage-form.tsx components/find-vet/triage-form.test.tsx
git commit -m "feat: add TriageForm component"
```

---

## Task 11: `TriageResult` component

**Files:**
- Create: `components/find-vet/triage-result.tsx`
- Test: `components/find-vet/triage-result.test.tsx`

**Interfaces:**
- Consumes: `TriageResponse`, `TriageErrorCode` (Task 3); `Badge`, `Alert*` (Task 9).
- Produces: `TriageResult(props: { result: TriageResponse | null; errorCode: TriageErrorCode | null; onSearchSuggested: (query: string) => void })` — consumed by Task 12.

Per spec §4/§12: emergency severity must render visibly distinct from
the other three — not just a different badge color — and severity
labels must be full phrases, never a bare word like "Routine" that
could read as "no action needed."

- [ ] **Step 1: Write the failing test**

```tsx
// components/find-vet/triage-result.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TRIAGE_DISCLAIMER } from "@/lib/triage/types";
import { TriageResult } from "./triage-result";

const routineResult = {
  severity: "soon" as const,
  advice: "Keep an eye on your dog for the next few hours.",
  suggestedQuery: "vet for vomiting dog",
  disclaimer: TRIAGE_DISCLAIMER,
  emailSent: true,
};

const emergencyResult = {
  severity: "emergency" as const,
  advice: "This sounds urgent. Please contact an emergency vet clinic right away.",
  suggestedQuery: "emergency vet",
  disclaimer: TRIAGE_DISCLAIMER,
  emailSent: false,
};

describe("TriageResult", () => {
  test("renders nothing when there is no result or error", () => {
    const { container } = render(
      <TriageResult result={null} errorCode={null} onSearchSuggested={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders advice, disclaimer, and a full-phrase severity label", () => {
    render(
      <TriageResult result={routineResult} errorCode={null} onSearchSuggested={vi.fn()} />
    );
    expect(screen.getByText(routineResult.advice)).toBeInTheDocument();
    expect(screen.getByText(routineResult.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(/see a vet soon/i)).toBeInTheDocument();
  });

  test("clicking the suggested-query button calls onSearchSuggested", () => {
    const onSearchSuggested = vi.fn();
    render(
      <TriageResult
        result={routineResult}
        errorCode={null}
        onSearchSuggested={onSearchSuggested}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /vet for vomiting dog/i })
    );

    expect(onSearchSuggested).toHaveBeenCalledWith("vet for vomiting dog");
  });

  test("renders a friendly message on error", () => {
    render(
      <TriageResult result={null} errorCode="UPSTREAM_UNAVAILABLE" onSearchSuggested={vi.fn()} />
    );
    expect(
      screen.getByText(/temporarily unavailable/i)
    ).toBeInTheDocument();
  });

  test("renders emergency severity with a distinct alert role, not just the normal card", () => {
    render(
      <TriageResult result={emergencyResult} errorCode={null} onSearchSuggested={vi.fn()} />
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/emergency/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run components/find-vet/triage-result.test.tsx`
Expected: FAIL — `Cannot find module './triage-result'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/find-vet/triage-result.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TriageErrorCode, TriageResponse } from "@/lib/triage/types";

type TriageResultProps = {
  result: TriageResponse | null;
  errorCode: TriageErrorCode | null;
  onSearchSuggested: (query: string) => void;
};

const SEVERITY_LABEL: Record<TriageResponse["severity"], string> = {
  routine: "Routine veterinary attention",
  soon: "See a vet soon",
  urgent: "Urgent veterinary attention",
  emergency: "Emergency — seek immediate care",
};

export function TriageResult({ result, errorCode, onSearchSuggested }: TriageResultProps) {
  if (errorCode) {
    return (
      <Alert variant="destructive">
        <AlertTitle>AI advice is temporarily unavailable</AlertTitle>
        <AlertDescription>
          You can still search for vets below.
        </AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  if (result.severity === "emergency") {
    return (
      <Alert variant="destructive" role="alert">
        <AlertTitle>{SEVERITY_LABEL.emergency}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>{result.advice}</p>
          <p className="text-xs">{result.disclaimer}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSearchSuggested(result.suggestedQuery)}
          >
            Search for: {result.suggestedQuery}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <Badge variant="default">{SEVERITY_LABEL[result.severity]}</Badge>
      <p className="text-sm">{result.advice}</p>
      <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => onSearchSuggested(result.suggestedQuery)}
      >
        Search for: {result.suggestedQuery}
      </Button>
      {result.emailSent ? (
        <p className="text-xs text-muted-foreground">
          A copy of this advice was emailed to you.
        </p>
      ) : null}
    </div>
  );
}
```

If `components/ui/alert.tsx`'s `variant` prop doesn't have
`"destructive"`, or `Alert` doesn't forward a `role` prop (shadcn's
default `Alert` usually renders `role="alert"` itself — check before
passing it explicitly and drop the prop if it's redundant), adjust to
whatever the generated file (Task 9) actually exports.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run components/find-vet/triage-result.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add components/find-vet/triage-result.tsx components/find-vet/triage-result.test.tsx
git commit -m "feat: add TriageResult component with distinct emergency treatment"
```

---

## Task 12: `TriageTrigger` and wiring into `VetSearch`

**Files:**
- Create: `components/find-vet/triage-trigger.tsx`
- Test: `components/find-vet/triage-trigger.test.tsx`
- Modify: `components/find-vet/vet-search.tsx`

**Interfaces:**
- Consumes: `useTriage` (Task 8), `TriageForm` (Task 10), `TriageResult` (Task 11), `Dialog*`, `Button` (Task 9); `searchByQuery` from `useVetSearch` (existing, `hooks/use-vet-search.ts:55-66`).
- Produces: `TriageTrigger(props: { onUseSuggestedQuery: (query: string) => void })`.

- [ ] **Step 1: Write the failing test**

```tsx
// components/find-vet/triage-trigger.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TRIAGE_DISCLAIMER } from "@/lib/triage/types";
import { TriageTrigger } from "./triage-trigger";

describe("TriageTrigger", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("opens the dialog and submits the form end-to-end", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          severity: "routine",
          advice: "Keep an eye on it.",
          suggestedQuery: "vet checkup",
          disclaimer: TRIAGE_DISCLAIMER,
          emailSent: false,
        }),
      })
    );
    const onUseSuggestedQuery = vi.fn();

    render(<TriageTrigger onUseSuggestedQuery={onUseSuggestedQuery} />);

    fireEvent.click(screen.getByRole("button", { name: /ask ai for advice/i }));
    fireEvent.change(screen.getByLabelText(/symptom/i), {
      target: { value: "vomiting since this morning" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get advice/i }));

    await waitFor(() =>
      expect(screen.getByText("Keep an eye on it.")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /vet checkup/i }));
    expect(onUseSuggestedQuery).toHaveBeenCalledWith("vet checkup");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test run components/find-vet/triage-trigger.test.tsx`
Expected: FAIL — `Cannot find module './triage-trigger'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/find-vet/triage-trigger.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriageForm } from "@/components/find-vet/triage-form";
import { TriageResult } from "@/components/find-vet/triage-result";
import { useTriage } from "@/hooks/use-triage";

type TriageTriggerProps = {
  onUseSuggestedQuery: (query: string) => void;
};

export function TriageTrigger({ onUseSuggestedQuery }: TriageTriggerProps) {
  const { status, result, errorCode, submit, reset } = useTriage();

  return (
    <Dialog onOpenChange={(open) => (!open ? reset() : undefined)}>
      <DialogTrigger asChild>
        <Button variant="secondary">Ask AI for advice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI symptom triage</DialogTitle>
          <DialogDescription>
            Describe your pet&apos;s symptom to get general guidance and a
            suggested vet search. Not a substitute for a licensed vet.
          </DialogDescription>
        </DialogHeader>
        <TriageForm onSubmit={submit} isLoading={status === "loading"} />
        <TriageResult
          result={result}
          errorCode={errorCode}
          onSearchSuggested={onUseSuggestedQuery}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test run components/find-vet/triage-trigger.test.tsx`
Expected: 1 passed.

- [ ] **Step 5: Wire into `VetSearch`**

In `components/find-vet/vet-search.tsx`, add the import and render
`TriageTrigger` next to `SearchBar` inside the existing top bar
(`components/find-vet/vet-search.tsx:71-81`):

```tsx
import { TriageTrigger } from "@/components/find-vet/triage-trigger";
```

```tsx
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] mx-auto w-full max-w-5xl p-3 md:right-[25rem] md:max-w-3xl md:p-5">
        <div className="pointer-events-auto flex flex-col gap-2">
          <SearchBar
            isLoading={status === "loading"}
            locationError={errorCode}
            onSearch={searchByQuery}
            onUseLocation={searchByLocation}
            onLocationError={setLocationError}
          />
          <div className="flex justify-end">
            <TriageTrigger onUseSuggestedQuery={searchByQuery} />
          </div>
        </div>
      </div>
```

`searchByQuery` already exists on `useVetSearch()` (destructured at
`components/find-vet/vet-search.tsx:23-33`) — pass it straight through,
no new state needed.

- [ ] **Step 6: Manual check**

Run: `yarn dev`, open `/find-vet`, click "Ask AI for advice", submit a
symptom, confirm the dialog shows a result and closing/reopening resets
the form (Task 13's live n8n workflow isn't built yet — this will error
until `.env.local` has real n8n values; confirm at least that the
dialog opens/closes and the loading state shows).

- [ ] **Step 7: Commit**

```bash
git add components/find-vet/triage-trigger.tsx components/find-vet/triage-trigger.test.tsx components/find-vet/vet-search.tsx
git commit -m "feat: wire AI triage trigger into find-vet search bar"
```

---

## Task 13: Build the n8n workflow (manual, not code)

Not TDD — this is built by hand in the n8n editor UI because it needs a
live LLM credential and a test execution, which only the UI can do.
Follow spec §8 exactly (already updated for input validation,
email-failure isolation, and the "verify model live" rule). This task's
"test" is a real curl call.

**Files:**
- Create: `docs/n8n/triage-workflow.json` (exported from n8n after building)

- [ ] **Step 1: Install and start n8n locally**

```bash
npx n8n
```

Open `http://localhost:5678`, create a local owner account (stays on your
machine, not a cloud account).

- [ ] **Step 2: Get a free Google Gemini API key**

Go to Google AI Studio, create a free API key (no credit card). In n8n,
add credential: Google Gemini API, paste the key. Note the current
free-tier Flash model name shown in AI Studio's model picker — you'll
enter it directly in the Gemini node (spec §8 explains why this isn't
pinned here).

- [ ] **Step 3: Get a Gmail app password**

In your Google account security settings, create an app password for
"Mail". In n8n, add credential: SMTP, host `smtp.gmail.com`, port `465`,
SSL, your Gmail address as user, the app password as password.

- [ ] **Step 4: Build the workflow**

Create a new workflow, add nodes exactly as specced in
`docs/superpowers/specs/2026-09-16-n8n-triage-automation-design.md` §8:

1. Webhook (path `pet-triage`, Header Auth `x-webhook-secret`)
2. Validate/normalize input node (species enum + symptomText length
   check; invalid → Respond 400 directly, skip Gemini)
3. Google Gemini node with Structured Output Parser, using the exact
   system prompt from spec §8 (includes the prompt-injection guard and
   the "if uncertain, choose the more cautious severity" line)
4. IF node on `email` present → Send Email node with **Continue On
   Fail** enabled, feeding a Set node that records `emailSent`
5. Respond to Webhook node returning
   `{ severity, advice, suggestedQuery, disclaimer, emailSent }`

Set the Webhook node's path to `pet-triage`, Header Auth with header name
`x-webhook-secret`, and pick a secret value — this same value goes into
`.env.local` as `N8N_WEBHOOK_SECRET` in Step 6 below.

- [ ] **Step 5: Test the workflow directly**

Activate the workflow, then:

```bash
curl -X POST http://localhost:5678/webhook/pet-triage \
  -H "content-type: application/json" \
  -H "x-webhook-secret: <your secret>" \
  -d '{"species":"dog","symptomText":"vomiting since this morning"}'
```

Expected: JSON body matching `TriageResponseSchema` (severity, advice,
suggestedQuery, disclaimer — must be the exact constant string,
emailSent). If you included an `"email"` field in the payload, confirm
an email arrives. Then test the input-validation node by sending an
invalid payload (e.g. `"species":"dragon"`) and confirming it returns
400 without a Gemini call. Then test email-failure isolation by
temporarily breaking the SMTP credential and confirming you still get a
full triage response with `emailSent: false`, not a workflow error.

- [ ] **Step 6: Wire env vars into the app**

In `.env.local`:

```
N8N_TRIAGE_WEBHOOK_URL=http://localhost:5678/webhook/pet-triage
N8N_WEBHOOK_SECRET=<the same secret from Step 4>
```

Restart `yarn dev`. Repeat the Task 12 Step 6 manual check — the dialog
should now return real AI advice.

- [ ] **Step 7: Export and commit the workflow**

In the n8n editor: workflow menu → Download. Save as
`docs/n8n/triage-workflow.json`. Open it and confirm it contains
credential *references* (an id/name), not raw API keys or passwords,
before committing.

```bash
git add docs/n8n/triage-workflow.json
git commit -m "docs: add exported n8n triage workflow"
```

---

## Task 14: Update the tutorial with real results

**Files:**
- Modify: `docs/n8n-tutorial.md` (already written — see repo root; if
  missing, write it per spec §9 before continuing)

The tutorial was written up front so it could be read before
implementation started. Now that Task 13 has been executed once for
real, fill in the placeholders that only exist after a live run:

- [ ] **Step 1: Record the actual model name used**

In the tutorial's "Get a free Gemini API key" section, replace any
"(check at build time)" placeholder with the actual model ID you used
in Task 13 Step 2/4.

- [ ] **Step 2: Add real example output**

In the "Testing end-to-end" section, paste the actual curl
request/response from Task 13 Step 5 (redact nothing sensitive is in
there — it's a symptom description and a JSON reply, no secrets).

- [ ] **Step 3: Add the safety spot-check results**

Per spec §11's manual safety spot-check, run the example symptom
sentences listed there against your live workflow and record the actual
severity each one returned, as a small table in the tutorial.

- [ ] **Step 4: Commit**

```bash
git add docs/n8n-tutorial.md
git commit -m "docs: fill in tutorial with real n8n workflow output"
```

---

## Task 15: Full-suite verification against acceptance criteria

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `yarn test run`
Expected: all tests pass (Tasks 1–12).

- [ ] **Step 2: Run lint and build**

Run: `yarn lint && yarn build`
Expected: no errors.

- [ ] **Step 3: Walk the acceptance checklist**

Go through spec §12 one by one against the running app (`yarn dev` +
live n8n from Task 13):

- Normal symptom flow renders severity/advice/suggested query
- Suggested-query click re-runs vet search
- Emergency keyword short-circuits with no n8n call (check server log
  line `scope: "triage"`)
- Email delivery works
- n8n stopped → `/find-vet` search still works, triage shows friendly
  error
- No secret visible in DevTools → Network tab on the `/api/triage`
  request
- A 6th request within 60 seconds from one IP gets `429 RATE_LIMITED`,
  and succeeds again after the window passes
- `disclaimer` in every successful response is the exact constant
- Breaking the email step still returns full advice with
  `emailSent: false`, not a 502
- Emergency severity renders as a visually distinct alert, not a normal
  card with a different badge color
- `docs/n8n-tutorial.md` reads clearly start to finish
- `docs/n8n/triage-workflow.json` imports cleanly into a fresh n8n
  instance

- [ ] **Step 4: Fix anything that fails, then re-run Steps 1–3**

- [ ] **Step 5: Final commit if anything changed**

```bash
git add -A
git commit -m "fix: address acceptance criteria gaps found in verification"
```
