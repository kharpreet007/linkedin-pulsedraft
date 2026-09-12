# LinkedIn PostAi — Draft Desk

A daily content pipeline for LinkedIn posts. Once a day, three AI stages run automatically:

1. **Scout** — searches Reddit/Google/Quora (via Claude's web search tool) for trending PM / AI /
   workplace-psychology discussions and picks 5 candidate topics.
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
- **Anthropic API** (`@anthropic-ai/sdk`) — Scout/Remy/Val, Scout using the `web_search_20250305`
  server-side tool for grounding
- **Vercel Cron** (`vercel.json`) — triggers the daily run

## Local setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, ANTHROPIC_API_KEY, CRON_SECRET
npx prisma migrate dev      # creates the schema against DATABASE_URL
npm run dev                 # http://localhost:3000
```

`DATABASE_URL` needs a real Postgres instance — [Neon](https://neon.tech),
[Vercel Postgres](https://vercel.com/storage/postgres), [Railway](https://railway.app), or Supabase
all work; a local `postgres` works for development too. If your DB is on Railway, make sure public
networking / the TCP proxy is enabled on that Postgres service — otherwise anything outside
Railway's network (Vercel included) can't reach it.

`ANTHROPIC_API_KEY` needs web search enabled on the account for Scout to work (Remy/Val work with
any key). Get one at https://console.anthropic.com.

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

## Deploying (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Set `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (optional), `CRON_SECRET`, and
   `PULSECRAFT_TIMEZONE` as project env vars (scope them to whichever environments you deploy —
   Production and/or Preview).
3. Migrations run automatically — `npm run build` is `prisma migrate deploy && next build`, so
   every Vercel deploy applies any pending schema migrations against `DATABASE_URL` for you. No
   separate migration step needed.
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
