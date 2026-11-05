# Switch article analysis to Gemini 3.5 Flash Lite

## Goal

Update the server-only article-analysis model to the API-key-verified `gemini-3.5-flash-lite` model.

## Skills read

- `AGENTS.md`
- `.agents/skills/ai-sdk/SKILL.md`
- Installed `@ai-sdk/google` provider type definitions

## Existing code inspected

- `lib/analysis/pipeline.ts`
- `app/api/analyze/route.ts`
- The user's successful minimal Gemini request using `gemini-3.5-flash-lite`

## Decisions and assumptions

- The successful minimal request is direct evidence that `gemini-3.5-flash-lite` is available to the configured Gemini API key.
- The current source constant is `gemini-3.8-flash-lite`; replace it with the requested exact model ID.
- This is a model-ID-only change. Diagnostic logging, retries, prompting, Zod validation, Supabase persistence, and API authorization remain unchanged.

## Files likely to change

- `lib/analysis/pipeline.ts`
- `prompts/gemini-3-5-flash-lite-model-change.md`

## Implementation requirements

1. Replace `const ANALYSIS_MODEL = "gemini-3.8-flash-lite"` with `const ANALYSIS_MODEL = "gemini-3.5-flash-lite"`.
2. Preserve the existing server-only provider construction and all other pipeline behavior.
3. Continue saving the centralized `ANALYSIS_MODEL` value to `article_analyses.model` for successful analyses.

## Security requirements

- Keep Gemini credentials server-only and do not log, expose, or commit them.
- Do not expose article text, Supabase service-role credentials, or the admin secret.

## Acceptance criteria

- `ANALYSIS_MODEL` equals `gemini-3.5-flash-lite`.
- Existing TypeScript checks and linting pass.
- A later authorized analysis request uses and persists `gemini-3.5-flash-lite` after a valid response.

## Checks to run

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

## Exact manual test steps expected after implementation

1. Restart the development server:

```powershell
npm.cmd run dev
```

2. Request one article analysis:

```powershell
$adminSecret = (Get-Content .env.local | Where-Object { $_ -match '^SKEW_ADMIN_SECRET=' } | ForEach-Object { $_.Substring('SKEW_ADMIN_SECRET='.Length) }).Trim()
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{"limit":1}'
```

3. Confirm the response reports a successful analysis and the saved record's `model` is `gemini-3.5-flash-lite`.
