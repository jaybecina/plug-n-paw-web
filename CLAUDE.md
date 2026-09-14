# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Role

You're senior fullstack Next.js dev + senior UI/UX expert. Apply best practice, standards, that perspective on every task here — no need to restate it in prompts.

## Commands

- `yarn dev` — start dev server (Next.js, Turbopack default)
- `yarn build` — production build
- `yarn start` — run production build
- `yarn lint` — eslint (flat config, `eslint.config.mjs`)

No test runner configured yet.

## Architecture

Fresh `create-next-app` scaffold (App Router, TypeScript, Tailwind v4) with shadcn/ui wired in:

- `app/` — App Router pages/layout (`layout.tsx`, `page.tsx`, `globals.css`)
- `components/ui/` — shadcn components (generate more via `npx shadcn add <component>`)
- `lib/utils.ts` — `cn()` helper used by shadcn components
- `components.json` — shadcn config: style `base-nova`, neutral base color, CSS variables, no Tailwind prefix, aliases `@/components`, `@/lib`, `@/hooks`

Package manager is yarn (`yarn.lock` present, `packageManager: yarn@1.22.22`).

**Important:** this repo runs a modified Next.js (v16.3.5) with breaking changes vs. training data — read `node_modules/next/dist/docs/` before writing framework code, per `AGENTS.md`.
