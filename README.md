# LinkedIn Pulsedraft — Draft Desk

A daily content pipeline for LinkedIn posts. Once a day, three AI stages run automatically:

1. **Scout** — a plain Gemini call brainstorms 5 candidate topics across PM / AI / workplace-psychology
   discussions from the model's own knowledge (no live web search — see note below).
2. **Remy** — expands each topic into a full storyteller-style draft (150–200 words, line-by-line,
   no hashtags/emojis, ends on an open question).
3. **Val** — scores each draft 0–10 on Hook / Insight / Authenticity / Engagement / Clarity (50
   total) and ranks the 5, surfacing a "Val's Pick".

The result is stored in Postgres and served to a Next.js dashboard (Dashboard / Calendar / Post
Generator / Analytics), replacing the original static-HTML/localStorage design reference.

Post metrics (impressions/likes/comments) are entered manually in the Dashboard — there's no
LinkedIn API integration for pulling live metrics, by design.

## Stack

- **Next.js 14** (App Router, TypeScript) — UI + API routes
- **Prisma + Postgres** — persistence (`Run`, `Candidate`, `Score`, `PostedSelection`, `Engagement`)
- **Gemini API** (`@google/genai`) — Scout/Remy/Val, all plain generation with structured JSON output
- **Vercel Cron** (`vercel.json`) — triggers the daily run

## Local setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, GEMINI_API_KEY, CRON_SECRET
npx prisma migrate dev      # creates the schema against DATABASE_URL
npm run dev                 # http://localhost:3000
```

`DATABASE_URL` needs a real Postgres instance — [Neon](https://neon.tech),
[Vercel Postgres](https://vercel.com/storage/postgres), [Railway](https://railway.app), or Supabase
all work; a local `postgres` works for development too. If your DB is on Railway, make sure public
networking / the TCP proxy is enabled on that Postgres service — otherwise anything outside
Railway's network (Vercel included) can't reach it.

`GEMINI_API_KEY` — get one at https://aistudio.google.com/apikey. Gemini model names rotate fairly
often; if `GEMINI_MODEL`'s default (`gemini-3.6-flash`) 404s, check
https://ai.google.dev/gemini-api/docs/models for the current list. Free-tier keys have low
per-minute rate limits — the pipeline spaces its 7 Gemini calls out with a short delay to stay under
them, but a project with billing enabled is more reliable for daily production use.

Note: Scout brainstorms from the model's own training data rather than live web search — an earlier
version used Gemini's Google Search grounding tool, but that requires a billed Google Cloud project
even at low volume. If you want live "what's trending today" freshness back, either enable billing
on your Gemini project and re-add the `googleSearch` tool to `lib/pipeline/scout.ts`, or wire in a
real search API (Reddit's, a general web search API, etc.) and feed its results into Scout's prompt.

## Running the pipeline manually

The daily endpoint is idempotent (a Run for a date is only generated once, unless `force=true`):

```bash
curl -X POST "http://localhost:3000/api/daily-run?date=2026-09-12" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Omit `date` to use "today" in `PULSECRAFT_TIMEZONE`. Add `&force=true` to regenerate a date that
already has candidates — **this deletes that date's Run**, including any posted selection and
manually-entered engagement, so only use it for an intentional redo of a day nobody has acted on
yet.

## Migrations: build vs. start

`npm run build` (`next build`) does **not** run `prisma migrate deploy` — on Railway (and similar
platforms that build in an isolated builder with no access to private networking), a migration
during build can't reach a Postgres service that's only reachable via its internal
`*.railway.internal` hostname, and the build fails with `P1001`. Instead `npm start`
(`prisma migrate deploy && next start`) applies migrations right before the server boots, when
private networking is available. Deploying to Railway, Render, Fly.io, or any platform that runs a
persistent Node process via `npm start` needs no extra configuration — migrations just happen automatically each start.

Vercel's standard Next.js deployment is serverless and **never invokes `npm start`**, so that path
doesn't apply there. `vercel.json` sets `"buildCommand": "npm run build:vercel"`
(`prisma migrate deploy && next build`) so every Vercel deploy migrates before building — Vercel's
build step runs somewhere that can reach a publicly-routable `DATABASE_URL`, so migrating at build
time works fine there. This is committed to the repo rather than left as a dashboard setting, since
a dashboard-only Build Command override is easy to lose (a project re-import, a settings reset) and
migrations then silently stop applying — if your Vercel project also has a manual Build Command
override set in Project Settings, clear it back to default so `vercel.json` is the one source of
truth.

## Deploying (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Set `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL` (optional), `CRON_SECRET`, and
   `PULSECRAFT_TIMEZONE` as project env vars (scope them to whichever environments you deploy —
   Production and/or Preview).
3. No Build Command setup needed — `vercel.json` already sets it to `npm run build:vercel`, which
   applies pending schema migrations against `DATABASE_URL` before building (see "Migrations: build
   vs. start" above). If Project Settings → Build & Development Settings shows a manual override,
   clear it back to default so it doesn't shadow `vercel.json`.
4. `vercel.json` already defines a cron hitting `/api/daily-run` at `0 13 * * *` (13:00 UTC ≈
   9am US Eastern, DST-dependent — adjust the cron expression and/or `PULSECRAFT_TIMEZONE` for
   your actual timezone). Vercel signs cron requests with `Authorization: Bearer $CRON_SECRET`
   automatically once that env var exists, so `/api/daily-run` is protected — anyone else calling
   it without the secret gets a 401.
5. Cron on the Hobby plan is capped to once/day at a fixed schedule, which matches this pipeline;
   generation itself can take a couple of minutes across 3 stages × 5 topics — the route sets
   `maxDuration = 300`, which needs a Pro plan to actually take effect (Hobby serverless functions
   cap at 10s executed, which will *not* be enough — either upgrade to Pro or move the pipeline to
   an external scheduler with a longer timeout, e.g. a GitHub Actions scheduled workflow calling
   the same endpoint, or Trigger.dev/Inngest).

## Deploying (Railway)

1. Push this repo to GitHub and create a Railway service from it, in the same project as a
   Postgres plugin (**+ New → Database → PostgreSQL** if you don't have one yet).
2. In the service's **Variables** tab, set `DATABASE_URL=${{ Postgres.DATABASE_URL }}` (reference
   the Postgres plugin rather than pasting a static string, so it stays correct if Railway ever
   rotates it — check the Postgres plugin's own Variables tab for its exact reference name if
   you've renamed it), plus `GEMINI_API_KEY`, `GEMINI_MODEL`, `CRON_SECRET`, and
   `PULSECRAFT_TIMEZONE`.
3. No Build Command override needed — Railway runs `npm run build` then `npm start`, and `npm
   start` is what applies migrations here (see "Migrations: build vs. start" above).
4. Railway has no built-in cron for a web service; trigger `/api/daily-run` daily with Railway's
   own Cron Jobs feature, or an external scheduler (GitHub Actions, cron-job.org, etc.) hitting
   your deployed URL with the `Authorization: Bearer $CRON_SECRET` header.

## API surface

- `GET /api/runs` — list of past runs (date, candidate count, posted selection + engagement if any)
- `GET /api/runs/:date` — full candidate detail (topic, theme, draft, scores, rank) for a date
- `POST /api/runs/:date/publish` — `{ candidateId }` — marks a candidate as published for that date
- `PATCH /api/runs/:date/selection` — `{ topic?, theme? }` — manual edits to the published post's
  topic/theme (kept separate from the original AI-generated candidate)
- `PATCH /api/runs/:date/engagement` — `{ impressions?, likes?, comments? }` — manual metrics entry
- `POST /api/generate` — `{ topic }` — ad-hoc single-topic draft (Post Generator page), reuses Remy
- `GET/POST /api/daily-run` — runs the pipeline for a date (see above); this is what Vercel Cron
  calls

## Notes

- `npm audit` flags a Next.js advisory (`GHSA-2xp9-vwfh-vxw4`) affecting the Image Optimization
  API; this app doesn't use `next/image`, so it isn't reachable here, but worth revisiting when
  upgrading past Next 14.
- The design reference this was built from (Nocturne design system, mock `RUNS` data,
  `localStorage`-backed state) is not in this repo; the Next.js app above replaces it entirely,
  reading from the real API instead.
