# Analyze four pending articles and display them on the home page

## Goal

Run the existing server-side Gemini analysis pipeline for exactly four pending Supabase articles. Each successfully persisted analysis should automatically appear on the existing home-page feed after refresh.

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

- Process the next four pending articles in ascending `scraped_at` order using `{ "limit": 4 }`.
- The existing server-only pipeline uses `gemini-3.5-flash-lite`.
- The home page already renders persisted records that have both `analyzed_at` and a matching `article_analyses` row; no UI edit is needed.

## Files likely to change

- No source files. This is an operational run.
- Supabase may receive up to four valid analysis rows and matching `analyzed_at` timestamps, plus normal run logs.

## Implementation requirements

1. Send one authenticated `POST /api/analyze` request with `{ "limit": 4 }`.
2. Read `SKEW_ADMIN_SECRET` only into the request header from `.env.local`; never expose it.
3. Keep the existing sequential processing, validation, retry, and persistence behavior unchanged.
4. Report the safe summary counts, including any failures without raw article text or credentials.
5. Reload the home page and confirm the persisted cards render.

## Security requirements

- Keep Gemini, Supabase service-role, and admin credentials server-only.
- Do not expose raw article text, prompts, or secrets.

## Acceptance criteria

- The response reports `requested: 4` when at least four pending articles exist.
- Every successful result has a valid analysis row and non-null `analyzed_at`.
- The home page shows stored cards for successfully analyzed articles after refresh.
- Failed articles remain pending and do not create invalid analysis rows.

## Checks to run

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":4}'
```

## Exact manual test steps expected after implementation

1. Start the development server with `npm.cmd run dev`.
2. Run:

```powershell
$adminSecret = (Get-Content .env.local | Where-Object { $_ -match '^SKEW_ADMIN_SECRET=' } | ForEach-Object { $_.Substring('SKEW_ADMIN_SECRET='.Length) }).Trim()
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":4}'
```

3. Watch the server terminal for per-article progress and the final summary.
4. Refresh `http://localhost:3000/` to see all successfully analyzed cards.
