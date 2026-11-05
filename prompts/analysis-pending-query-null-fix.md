# Pending analysis query null-handling fix

## Goal

Fix the analysis pipeline crash when Supabase returns `null` for an article's `article_analyses` relation.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`

## Existing code inspected

- `lib/supabase/queries/articles.ts`
- `lib/analysis/pipeline.ts`
- `app/api/analyze/route.ts`
- `.next/dev/logs/next-development.log`

## Diagnosis

An authorized `POST /api/analyze` request reaches the pipeline, then exits with:

```text
TypeError: Cannot read properties of null (reading 'length')
```

The error originates in `getPendingAnalysisArticles`: its JavaScript LEFT JOIN filter calls `article.article_analyses.length === 0`, but Supabase returned `null` for at least one row's nested relation. The Gemini provider is not reached.

## Decision

- Treat both `null` and an empty relation array as "no analysis exists".
- Preserve the required JavaScript-side LEFT JOIN filtering pattern; do not use a joined-table `.eq()` filter.
- Make the relation type accurately nullable.

## Files likely to change

- `lib/supabase/queries/articles.ts`

## Implementation requirements

1. Change `ArticleWithAnalysisRelation.article_analyses` to allow `null`.
2. Filter pending articles by treating `null` or an empty array as no existing analysis.
3. Keep article-ID selection, attempted-ID exclusion, sort order, and requested limit behavior unchanged.
4. Do not alter the pipeline's Gemini prompt, output schema, or persistence order.

## Security requirements

- Do not log or expose Gemini, Supabase, or admin-secret credentials.
- Preserve service-role access as server-only.

## Acceptance criteria

- An authorized `POST /api/analyze` no longer fails with the relation-null TypeError.
- Articles without an `article_analyses` row are returned as pending whether the nested relation is `null` or `[]`.
- Existing analyses remain excluded from the pending result.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- An authorized local `POST /api/analyze` request limited to one article.

## Manual test steps

After replacing the previously exposed admin secret and restarting the dev server, run:

```powershell
curl.exe -i -X POST "http://localhost:3000/api/analyze" -H "x-skew-admin-secret: <your replacement SKEW_ADMIN_SECRET>" -H "Content-Type: application/json" --data '{"limit":1}'
```

Watch the server terminal for the analysis summary and Gemini/Supabase error logs, if any.
