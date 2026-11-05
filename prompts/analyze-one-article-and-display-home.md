# Analyze one article and display it on the home page

## Goal

Run the existing server-side Gemini analysis pipeline for exactly one pending Supabase article. When a valid analysis is saved, confirm the existing home-page feed displays that persisted article without any UI changes.

## Skills read

- `AGENTS.md`
- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

## Existing code inspected

- `lib/analysis/pipeline.ts`
- `app/api/analyze/route.ts`
- `lib/supabase/queries/articles.ts`
- `app/page.tsx`

## Decisions and assumptions

- “The article” means the first pending article in ascending `scraped_at` order, limited by `{ "limit": 1 }`.
- The configured model is `gemini-3.5-flash-lite`, verified by the user's successful minimal API request.
- No UI change is expected: the Server Component in `app/page.tsx` already calls `getPublishedArticles()`, which renders persisted records only when `analyzed_at` is set and a matching analysis row exists.

## Files likely to change

- No source files. This is an operational run.
- On success, Supabase receives one valid `article_analyses` row and the matching `articles.analyzed_at` timestamp, plus normal pipeline logs.

## Implementation requirements

1. Send exactly one authenticated `POST /api/analyze` request with `{ "limit": 1 }`.
2. Read `SKEW_ADMIN_SECRET` only into the request header from `.env.local`; never print, log, or commit it.
3. Allow the existing pipeline to validate Gemini output before inserting the analysis and setting `analyzed_at`.
4. Do not change scraping, analysis logic, retry behavior, database schema, or UI.
5. After a successful response, refresh the home page and confirm the saved article appears from `getPublishedArticles()`.

## Security requirements

- Keep Gemini, Supabase service-role, and admin credentials server-only.
- Do not expose raw article text, prompts, or secrets in output.

## Acceptance criteria

- The API summary reports `requested: 1` and `analyzed: 1` when a pending article exists.
- The successful article has a saved `article_analyses` row and non-null `analyzed_at`.
- Reloading `/` shows the persisted article card with its stored sentiment and AI-estimated framing.
- If Gemini fails, no invalid analysis is saved and the homepage remains unchanged.

## Checks to run

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":1}'
```

## Exact manual test steps expected after implementation

1. Start or restart the development server:

```powershell
npm.cmd run dev
```

2. In another terminal, run:

```powershell
$adminSecret = (Get-Content .env.local | Where-Object { $_ -match '^SKEW_ADMIN_SECRET=' } | ForEach-Object { $_.Substring('SKEW_ADMIN_SECRET='.Length) }).Trim()
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":1}'
```

3. Watch the Next.js server terminal for the per-article result and final summary.
4. Refresh `http://localhost:3000/` and verify the card reflects the persisted article and analysis.
