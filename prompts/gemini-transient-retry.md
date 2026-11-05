yr# Gemini transient retry and backoff

## Goal

Make the article-analysis pipeline resilient to temporary Gemini capacity and rate-limit failures without retrying invalid requests or writing incomplete analyses.

## Skills read

- `.agents/skills/ai-sdk/SKILL.md`
- `.agents/skills/supabase/SKILL.md`

## Existing code inspected

- `lib/analysis/pipeline.ts`
- `app/api/analyze/route.ts`
- `lib/supabase/queries/articles.ts`
- Gemini API error guidance

## Diagnosis

The current Gemini model is valid but returned HTTP `503 UNAVAILABLE` because of temporary high demand. The pipeline makes its two attempts immediately, which is unlikely to recover from a transient capacity failure. Gemini guidance recommends application-level retry with backoff for temporary service-unavailable and rate-limit errors.

## Decision

- Retain a maximum of two model attempts per article.
- Before the second attempt, wait using a bounded exponential-backoff delay with jitter only for retryable provider failures (`429`, `500`, `503`).
- Do not delay/retry schema-validation failures, prompt/output validation failures, invalid requests, unavailable-model errors, authentication failures, or Supabase persistence failures.
- Keep failed articles pending for a later full run.

## Files likely to change

- `lib/analysis/pipeline.ts`

## Implementation requirements

1. Add small, server-only helpers to extract an HTTP status safely from AI SDK/provider errors and identify retryable statuses.
2. Add a bounded jittered delay before retry attempt two for only `429`, `500`, and `503` errors.
3. Log the retry status and delay without logging API keys, headers, article content, or provider request bodies.
4. Preserve the existing result summary, output validation, and write order: save a valid analysis first, then set `analyzed_at`.
5. Keep the route within its existing 300-second maximum duration.

## Security requirements

- Never log `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, Supabase credentials, or raw provider authorization details.
- Do not expose provider errors or credentials to browser responses.
- Preserve the server-only boundary.

## Acceptance criteria

- A 503, 500, or 429 first attempt performs one delayed retry.
- A non-retryable provider/configuration error fails immediately without a delayed second request.
- An invalid structured response preserves the existing validation failure behavior.
- Failed analyses remain eligible in later runs.
- A valid analysis is persisted exactly once and only then marks the article analyzed.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- One authorized `POST /api/analyze` request with `{ "limit": 1 }`.

## Manual test steps

```powershell
curl.exe -i -X POST "http://localhost:3000/api/analyze" -H "x-skew-admin-secret: <your replacement SKEW_ADMIN_SECRET>" -H "Content-Type: application/json" --data '{"limit":1}'
```

Watch the server terminal for a retry log after a transient provider failure and for the final run summary.
