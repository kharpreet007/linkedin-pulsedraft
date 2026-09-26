# Claude Code prompt — add "Backfile" to linkedin-pulsedraft

Paste everything below into Claude Code, run from the repo root.

---

Add a **Backfile** view to this Next.js app: one archive of every post I've published, whether it was a pipeline pick from the Calendar or my own post from Write a Post, so I can find past posts by date.

## 1. Navigation
- `lib/types.ts`: add `"backfile"` to the `View` union.
- `components/Sidebar.tsx`: add `{ view: "backfile", label: "Backfile" }` to `NAV_ITEMS`, after "Write a Post". Add an icon to `ICONS` in the same 16×16 stroke style (an archive box, for example).
- `app/page.tsx`: render `<BackfileView />` when `activeView === "backfile"`.

## 2. Data
- Build the list from what's already stored. Every date that has a published post (the posted candidate, or the draft saved by `writeOwnPost`) becomes one entry: `{ date, topic, theme, text, source: "pipeline" | "own" }`.
- Add `GET /api/backfile?date=YYYY-MM-DD` that returns these entries, newest first, with an optional date filter. Reuse the existing Prisma models. Only add a migration if the published post text isn't stored yet.
- Add a matching `getBackfile(date?)` in `lib/api.ts`.

## 3. `components/BackfileView.tsx`
- Page header uses `page-title` / `page-subtitle`: "Backfile" and "Every post you've published, by date".
- Filter: one date input (`className="input"`, width 170) and a "Clear" ghost button. **Date filter only, no other filters.**
- Entry cards (use the same card class as the other views) show:
  - date (via `fmtHeader`), topic, a `tag tag-neutral` for the theme, and a small tag for "Pipeline" or "Written"
  - the first 3 lines of the post with Expand/Collapse, keeping line breaks (`white-space: pre-line`)
  - a Copy button that shows "Copied ✓" for 1.6s
- Empty states: "No published posts yet." or, when filtering, "No post published on this date."
- Show `Skeleton` while loading.

## 4. Write a Post hook
In `WriteAPostView.tsx`, add a "View in Backfile" button to the success banner, next to "View on Dashboard". Pass an `onGoToBackfile` prop from `page.tsx`.

## 5. Checks
- `npm run typecheck` and `npm run lint` pass.
- Publish from Write a Post, then from Calendar. Both show up in Backfile, and the date filter finds each one.
- Commit with message "Add Backfile view" and push to `main`. Vercel will redeploy.
