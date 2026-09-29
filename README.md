# Socialora — Understand Your Social

Full-stack multi-tenant SaaS workspace for social media specialists, agencies
and brands. Built with Next.js 14 (App Router), Prisma + SQLite, and a
provider-agnostic AI layer (Anthropic or OpenAI).

## Features implemented

- **Auth** — email/password login & registration (JWT session cookie),
  middleware-protected dashboard routes.
- **Multi-user workspaces** — a `Workspace` has many `User`s via `Membership`,
  each with a role: `OWNER / ADMIN / SPECIALIST / CREATOR / CLIENT`. Invite
  teammates by email from **Tim & Akses**; permission checks happen on every
  API route (`requireRoleAtLeast`).
- **Multi-brand workspace** — a workspace owns many `Brand`s. Switch brands
  instantly from the sidebar dropdown; add new brands manually at any time.
  Every content/goal/AI-chat query is scoped by `brandId`, and every
  `brandId` is checked against the caller's workspace membership before any
  read or write (tenant isolation).
- **Per-brand theming** — **Pengaturan Brand** lets you rename the brand,
  upload a logo, and pick primary/accent colors. Colors are pushed into CSS
  variables (`--brand-primary`, `--brand-accent`) the instant you switch
  brands, and every button/badge/chart across the app reads from them.
- **Content Database** (`/konten`) — searchable, filterable table with
  approval status, funnel tag, and platform.
- **Kanban Board** (`/kanban`) — drag-and-drop across
  Ideation → Scripting → Take Konten → Editing → Review → Scheduled →
  Published, backed by `@dnd-kit` with optimistic UI + a `PATCH` on drop.
- **Content Calendar** (`/kalender`) — month grid of scheduled content.
- **Full-funnel Analytics** (`/analytics`, plus the Dashboard) — TOFU
  (views) → MOFU (engagement) → BOFU (orders/GMV), with CVR between each
  stage, computed server-side in `src/lib/data.ts`.
- **Goal Health engine** — progress vs. pace-adjusted target, with the
  "Terlambat X hari" delay badge from the spec (`computeGoalHealth`).
- **Link tracking** (`/api/track/[contentId]`) — see "Link tracking honesty
  note" below.
- **Socialora AI** (`/ai`) — chat UI with conversation history, RAG-style
  context injection (last 30 days of top-performing content), and an
  **offline fallback** that still gives data-driven answers with no API key
  configured — see `src/lib/ai.ts`.
- **Automated Reporting** (`/report`) — one-click branded report with an
  AI-generated executive summary and browser print-to-PDF export.

## Getting started

```bash
npm install
cp .env.example .env        # defaults already work out of the box
npx prisma db push          # creates dev.db (SQLite) from the schema
npm run db:seed             # loads demo workspace/brand/content
npm run dev
```

Open http://localhost:3000 and log in with:

```
demo@socialora.app / password123
```

...or register your own workspace from `/register`.

## AI setup (optional)

The app works immediately with **no AI key** — Socialora AI answers using a
data-driven offline template built from the brand's real numbers. To enable
live LLM responses, set in `.env`:

```
AI_PROVIDER="anthropic"          # or "openai"
ANTHROPIC_API_KEY="sk-ant-..."
# or
OPENAI_API_KEY="sk-..."
```

## Link tracking — honesty note

The spec's Feature 2 describes headless-scraping Instagram/TikTok/YouTube
via Playwright + rotating proxies on a 6-hour cron. That's a real production
pattern, but it can't be faked convincingly in a demo without violating
platform ToS or requiring paid proxy infra — so this scaffold is transparent
about it instead of pretending:

- **YouTube**: `/api/track/[contentId]` calls YouTube's public oEmbed
  endpoint (no key needed) to verify the link and pull its title.
- **Instagram / TikTok / other platforms**: metrics are entered manually on
  the content edit modal (views/likes/comments/shares/clicks/conversions/
  GMV). Clicking "Refresh metrik dari link" still writes a `MetricSnapshot`
  from whatever is currently saved, so trend charts have real history.

To wire up real automated scraping in production:

1. Add a `BullMQ` + `Redis` queue (`npm i bullmq ioredis`).
2. Add a worker process running `playwright` with a rotating-proxy pool that
   visits `content.postUrl`, parses the public DOM for view/like/comment
   counts, and calls the same `/api/content/[id]` `PATCH` endpoint this app
   already exposes.
3. Schedule the worker with a cron (e.g. `node-cron` or a platform-level
   scheduled job) every 6 hours per the spec.

Because the rest of the app (snapshots, trend charts, funnel analytics)
already reads from `Content` + `MetricSnapshot`, no other code changes are
needed once that worker exists — it just needs to call the same PATCH route.

## Production checklist

- Swap `datasource db` in `prisma/schema.prisma` from `sqlite` to
  `postgresql` and point `DATABASE_URL` at a real Postgres instance (Row-
  Level Security can then be added at the DB layer to defense-in-depth the
  `workspaceId`/`brandId` scoping already enforced in application code).
- Move brand logo storage from base64 data URLs to S3/Cloudinary/Supabase
  Storage (only `src/app/(dashboard)/settings/brand/page.tsx`'s
  `handleFile` needs to change — everything else just reads `logoUrl`).
- Set a strong random `JWT_SECRET`.
- Add rate limiting to `/api/auth/*` and `/api/ai/chat`.

## Project structure

```
prisma/schema.prisma        Data model (multi-tenant: Workspace → Brand → Content/Goal)
prisma/seed.ts               Demo data
src/lib/auth.ts              Session signing/verification, role checks
src/lib/data.ts               Funnel + Goal Health math (single source of truth)
src/lib/ai.ts                 Socialora AI: context injection + provider calls + offline fallback
src/middleware.ts             Route protection
src/app/(auth)/...            Login / Register
src/app/(dashboard)/...       Dashboard, Kalender, Konten, Kanban, AI, Analytics, Report, Settings
src/app/api/...                All REST endpoints
src/components/...             Sidebar, BrandSwitcher, ThemeInjector, modals, badges
src/stores/useWorkspaceStore.ts Zustand store: active workspace/brand (persisted)
```
