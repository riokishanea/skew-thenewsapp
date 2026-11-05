# Switch article analysis to Gemini 2.5 Flash

## Goal

Change the server-only article-analysis model from `gemini-3.8-flash` to `gemini-2.5-flash` while preserving the existing Gemini pipeline, validation, persistence, authentication, and retry behavior.

## Skills read

- `AGENTS.md`
- `.agents/skills/ai-sdk/SKILL.md`
- Installed `@ai-sdk/google` 4.0.0 type definitions and README

## Existing code inspected

- `lib/analysis/pipeline.ts`
- `app/api/analyze/route.ts`
- `prompts/gemini-model-availability-fix.md`
- `node_modules/@ai-sdk/google/dist/index.d.ts`

## Decisions and assumptions

- “Gemini 2.5” means `gemini-2.5-flash`, the installed provider's fast text model suitable for this structured article-analysis workload.
- Make the smallest possible source change: the centralized `ANALYSIS_MODEL` constant only.
- `@ai-sdk/google` 4.0.0 includes `gemini-2.5-flash` as a recognized language-model ID.
- A previous project diagnostic recorded that this API key received a `404 NOT_FOUND` for `gemini-2.5-flash`. The requested change will still be made, but the manual test must confirm account-level availability before relying on the model.

## Files likely to change

- `lib/analysis/pipeline.ts`
- `prompts/gemini-2-5-flash-model-change.md`

## Implementation requirements

1. Replace only `const ANALYSIS_MODEL = "gemini-3.8-flash"` with `const ANALYSIS_MODEL = "gemini-2.5-flash"`.
2. Continue creating the Google provider server-side with `GEMINI_API_KEY` and continue passing the model constant to `google(ANALYSIS_MODEL)`.
3. Ensure successful saved `article_analyses.model` values continue to equal the exact model used.
4. Do not alter the API route, request contract, Zod output schema, retry/backoff policy, prompt, database query, write order, or UI.

## Security requirements

- Do not expose or log `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, Supabase service-role credentials, or article text.
- Keep Gemini access server-only and retain the existing admin-secret check on `POST /api/analyze`.

## Acceptance criteria

- The analysis pipeline's sole model constant is `gemini-2.5-flash`.
- The project typecheck and lint pass.
- An authorized `{ "limit": 1 }` analysis request either saves a validated row whose `model` is `gemini-2.5-flash`, or reports the provider error without saving invalid data.

## Checks to run

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

## Exact manual test steps expected after implementation

1. Restart the local server after the code change:

```powershell
npm.cmd run dev
```

2. Send one authorized server-side analysis request:

```powershell
$adminSecret = (Get-Content .env.local | Where-Object { $_ -match '^SKEW_ADMIN_SECRET=' } | ForEach-Object { $_.Substring('SKEW_ADMIN_SECRET='.Length) }).Trim()
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":1}'
```

3. Watch the Next.js terminal. A successful run reports `analyzed: 1`; if the configured Gemini account still rejects this model, it reports a model-availability error and leaves the article pending.
