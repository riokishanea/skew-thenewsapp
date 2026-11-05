# Gemini model availability fix

## Goal

Restore article analysis by replacing the unavailable Gemini model identifier with the model currently available to this configured Gemini account.

## Skills read

- `.agents/skills/ai-sdk/SKILL.md`
- `.agents/skills/supabase/SKILL.md`

## Existing code inspected

- `lib/analysis/pipeline.ts`
- `app/api/analyze/route.ts`
- `lib/supabase/queries/articles.ts`
- `.next/dev/logs/next-development.log`

## Diagnosis

After the null-safe pending-analysis query fix, an authorized one-article analysis run reaches Gemini but both attempts fail. A direct Gemini health request with the configured key returns:

```text
404 NOT_FOUND: models/gemini-2.5-flash is no longer available to new users.
Please update your code to use models/gemini-3.8-flash.
```

The current pipeline hardcodes `gemini-2.5-flash`; the model is unavailable for this account. Supabase querying and route authorization are working.

## Decision

- Change only `ANALYSIS_MODEL` from `gemini-2.5-flash` to `gemini-3.8-flash`.
- Keep the provider as `@ai-sdk/google` using the server-only `GEMINI_API_KEY`.
- Keep structured output validation, the retry policy, persistence sequence, and all API behavior unchanged.

## Files likely to change

- `lib/analysis/pipeline.ts`

## Implementation requirements

1. Update the model constant to `gemini-3.8-flash`.
2. Ensure the saved `article_analyses.model` value continues to reflect the actual model used.
3. Do not add model credentials to client code or modify API authentication.

## Security requirements

- Keep `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, and Supabase service-role credentials server-only.
- Do not include secrets in logs, request bodies, source files, or test output.

## Acceptance criteria

- A limited authorized analysis request reaches Gemini without the model-availability 404.
- A valid model response is validated and written to `article_analyses`; `articles.analyzed_at` is set only afterward.
- Failures are returned in the existing completion summary rather than causing an unhandled route error.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- One authorized `POST /api/analyze` request with `{ "limit": 1 }`.

## Manual test steps

After restarting the development server, run:

```powershell
curl.exe -i -X POST "http://localhost:3000/api/analyze" -H "x-skew-admin-secret: <your replacement SKEW_ADMIN_SECRET>" -H "Content-Type: application/json" --data '{"limit":1}'
```

Expect HTTP 200 and a summary with `analyzed: 1` when a valid pending article is available. Watch the dev-server terminal for the completion summary.
