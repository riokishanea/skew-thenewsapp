# Analyze the first pending article with Gemini

## Goal

Run the existing server-side Gemini analysis pipeline for exactly one pending Supabase article: the first pending article in the pipeline's established `scraped_at ASC` order. Persist its validated analysis only when Gemini returns an acceptable result.

## Skills read

- `AGENTS.md`
- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

## Existing code inspected

- `app/api/analyze/route.ts`
- `lib/analysis/pipeline.ts`
- `lib/supabase/queries/articles.ts`
- `prompts/gemini-supabase-analysis-integration.md`

## Decisions and assumptions

- “First article” means the first pending article in `getPendingAnalysisArticles()` ordering: ascending `scraped_at`.
- The existing authenticated API is the only trigger: `POST /api/analyze` with `{ "limit": 1 }`.
- The request will be made locally to the running development server. It is a server-side operation; no browser code will access Gemini or credentials.
- A pending article is one without an `article_analyses` row, not merely an article whose `analyzed_at` is null.

## Files likely to change

- None. This is an operational run of the existing implementation.
- Supabase may receive one new `article_analyses` row and the matching `articles.analyzed_at` timestamp after valid analysis succeeds.
- The `logs` table may receive the pipeline's normal start/completion or failure records.

## Implementation requirements

1. Confirm a local server is reachable before the request; do not start a second development server if one is already running.
2. Read `SKEW_ADMIN_SECRET` only into the request header from `.env.local`; never print, log, commit, or return it.
3. Send `POST http://localhost:3000/api/analyze` with `Content-Type: application/json`, `x-skew-admin-secret`, and body `{ "limit": 1 }`.
4. Let the existing pipeline select the pending article, call the server-only Gemini provider, validate structured output, insert `article_analyses`, and then mark `analyzed_at`.
5. Report the safe API summary (`requested`, `analyzed`, `skipped`, `failed`, and failure reasons if present). Do not expose raw article text, prompts, API keys, or service-role credentials.

## Security requirements

- Keep `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, and Supabase service-role credentials server-only.
- Do not place the admin secret in a URL, source file, commit, or response shown to the user.
- Do not write an analysis row or update `analyzed_at` when Gemini output fails validation.

## Acceptance criteria

- Exactly one pending article is requested when one exists.
- A successful result has `analyzed: 1`, a valid saved analysis row, and a non-null `analyzed_at` for that same article.
- If no pending article exists, the summary reports zero requested/analyzed and makes no mutation.
- If Gemini fails or validation rejects its output, no invalid analysis is stored and the article remains pending.

## Checks to run

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":1}'
```

## Exact manual test steps expected after implementation

1. Start the application with `npm run dev` if it is not already running.
2. In another PowerShell terminal, execute:

```powershell
$adminSecret = (Get-Content .env.local | Where-Object { $_ -match '^SKEW_ADMIN_SECRET=' } | ForEach-Object { $_.Substring('SKEW_ADMIN_SECRET='.Length) }).Trim()
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":1}'
```

3. Watch the `npm run dev` terminal for the article-level and final Gemini analysis logs.
4. Confirm the response has `requested: 1` and `analyzed: 1` if a pending article existed; otherwise it should be a no-op summary.
