# AI article analysis pipeline

## Goal

Implement the server-only AI article analysis pipeline behind `POST /api/analyze`. It must analyze valid, pending articles from Supabase with the Vercel AI SDK and the Google Gemini provider, validate structured output, persist each valid analysis, mark the corresponding article as analyzed only after its analysis is stored, and return a useful batch/run summary.

This slice implements the analysis pipeline and its action route only. The existing home feed already renders persisted analysis data; wiring the detail page to stored analysis and adding embeddings/related articles remain separate work.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
- Current Supabase JavaScript documentation for `select` and `insert`
- Current Supabase changelog (reviewed for relevant breaking changes)
- Current AI SDK documentation for structured output and the Google provider

## Existing code inspected

- `AGENTS.md`, especially sections 14, 15, 17, 19, and 21: required `POST /api/analyze` behavior, authorization, data contract, pending detection, model validation, logging, and environment rules.
- `package.json`: `ai` and `@ai-sdk/google` are not installed; `zod` is available transitively.
- `app/api/scrape/route.ts`: existing action-route shape and `maxDuration` convention. Its broader legacy authorization fallback must not be copied to the new route.
- `lib/supabase/queries/articles.ts`: existing `getPendingAnalysisArticles()` uses a relation select followed by a JavaScript filter, and `insertArticleAnalysisAndMarkAnalyzed()` preserves the required write order.
- `lib/supabase/queries/logs.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`, and `supabase/schema.sql`: server-only service-role data access, typed analysis rows, validation constraints, and log storage.
- `app/page.tsx`: analyzed stored records are already rendered in the home feed, including sentiment, AI-estimated framing, percentages, and confidence.
- `.env.example`: it currently lacks the Gemini/admin/batch-size placeholders needed by this pipeline.

## Decisions and assumptions

- This user-approved provider choice supersedes the repository's prior OpenAI-provider assumption for this slice. Use `ai` plus `@ai-sdk/google`, installed at mutually compatible, exact versions and committed in `package-lock.json`. Before coding with them, inspect their bundled version-matched docs and source; do not use remembered legacy `generateObject` APIs.
- Use the direct Google provider with `GEMINI_API_KEY`, kept inside a `server-only` analysis module. Instantiate the provider explicitly with this key rather than relying on the provider's default environment-variable name. Use a current structured-output-capable Gemini model verified in the installed provider docs during implementation; centralize its identifier in one server-only constant and save that exact identifier to `article_analyses.model`.
- Call `generateText` with `Output.object({ schema })` and a Zod schema. The model-generated object receives a second explicit semantic validation/normalization step before any database write.
- The analysis evaluates wording and emphasis in the article text only. It must never infer political framing from the source name.
- Default runs keep fetching pending batches until no pending articles remain. `ANALYSIS_BATCH_SIZE` defaults to `5`, is parsed safely, and is capped to a conservative server-side maximum. A request-level `limit` applies to the entire run, not each batch.
- The optional request body is JSON: `{ "articleIds"?: string[], "limit"?: number }`. With `articleIds`, process only those IDs that are currently pending; without it, process all pending articles. Validate malformed body/IDs/limits with Zod and return `400` without starting analysis.
- No embedding work belongs in this slice: do not add an embedding column, invoke an embeddings model, enable pgvector, add similarity queries, or change the SQL schema/types.
- Do not alter the presentational news-detail page as part of this pipeline-only request.

## Files likely to change

- `package.json`
- `package-lock.json`
- `.env.example`
- `lib/analysis/types.ts` (new)
- `lib/analysis/prompt.ts` (new)
- `lib/analysis/pipeline.ts` (new)
- `lib/supabase/queries/articles.ts`
- `app/api/analyze/route.ts` (new)

## Implementation requirements

1. Install `ai` and `@ai-sdk/google` using npm with exact compatible versions. Retain the resulting lockfile changes. Re-read the installed version-matched AI SDK/provider documentation before choosing imports and call signatures.
2. Add server-only analysis types that distinguish:
   - validated model output;
   - the Supabase insert payload;
   - per-article success/failure/skip result; and
   - an API-safe run summary including `status`, `requested`, `analyzed`, `skipped`, `failed`, `batches`, `totalDurationMs`, and compact failure reasons/counts.
   Do not include raw article text, API keys, prompts, or stack traces in route output.
3. Build a focused article-analysis prompt using the article title and cleaned `raw_text`. It must request:
   - a concise neutral summary;
   - `sentimentScore` from `-1` through `1` and a matching `sentimentLabel` (`positive`, `neutral`, or `negative`);
   - `politicalFramingLabel` (`left`, `center`, `right`, `mixed`, or `unclear`);
   - `leftPercentage`, `centerPercentage`, and `rightPercentage` as 0–100 values totaling exactly `100`;
   - `confidence` from `0` through `1`;
   - evidence-based framing notes;
   - an array of loaded terms actually present in, or directly attributable to, the article wording;
   - an audience-facing disclaimer explaining that framing is an AI estimate based on this article’s language and emphasis, not objective fact.
   The prompt must clearly say to use the article text only, preserve uncertainty, prefer `unclear` and low confidence when evidence is weak, and never base conclusions on the publisher/source name.
4. Define a strict Zod output schema with bounded numeric values, non-empty text fields, permitted labels, and a string-array `loadedTerms`. After generation, explicitly reject output when the percentage sum is not exactly `100` (after a deterministic, documented decimal normalization), the sentiment label conflicts with its score, or the framing label conflicts with the dominant percentage absent close values/low confidence/`unclear` conditions.
5. Retry an article’s model call once only when generation or validation fails. If the retry also fails, do not create an analysis row or set `analyzed_at`; log a safe failure and continue the run with the remaining articles.
6. Extend the pending-analysis data access helper to accept a bounded total query limit and optional article IDs while preserving its required semantics: select articles with their `article_analyses` relation, then filter in TypeScript for no analysis relation. Do not rely on `analyzed_at`, and do not use a joined-table `.eq()` filter.
7. Reuse `insertArticleAnalysisAndMarkAnalyzed()` for writes. Supply all persisted fields, derive `bias_score` in server code as `(rightPercentage - leftPercentage) / 100`, and pass the normalized distribution and exact model identifier. The helper must continue to insert first and update `articles.analyzed_at` only after the analysis row exists.
8. Implement a `server-only` analysis orchestrator that:
   - announces the run and each batch in tidy server console logs;
   - loads batches until no matching pending articles remain or the request-level limit is satisfied;
   - processes articles sequentially within a batch to avoid unbounded Gemini concurrency;
   - logs analyzed, skipped, and failed counts per batch and logs the final summary object;
   - records start, per-article failure, and completion events via `insertLog()` without letting a log-write failure abort the run;
   - returns a successful completed summary even when individual articles fail, and only throws for unrecoverable setup/data-access failures.
9. Add `app/api/analyze/route.ts` as a thin `POST` route handler with `maxDuration = 300`:
   - authorize exclusively with `x-skew-admin-secret`, matching `SKEW_ADMIN_SECRET` using a server-only value;
   - return `401` for a missing or invalid header before reading the request body or calling the pipeline;
   - parse and validate the optional JSON request body;
   - return the pipeline summary as JSON on `200`;
   - return `400` for invalid request JSON/options and a generic `500` error for unrecoverable pipeline failures, while retaining detailed diagnostics only in server logs.
10. Add these server-only placeholders and comments to `.env.example`, keeping its existing entries intact:
    - `GEMINI_API_KEY=`
    - `SKEW_ADMIN_SECRET=`
    - `ANALYSIS_BATCH_SIZE=5`
    Do not add `CRON_SECRET` to `.env.local` or expose any of these variables through `NEXT_PUBLIC_*`.

## Security requirements

- Keep `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, service-role credentials, full prompts, and raw article text exclusively in server-only modules and server logs as appropriate; never return them to the browser.
- Require the documented `x-skew-admin-secret` header. Do not accept query-string credentials, an authorization-bearer fallback, or an Oxylabs credential as analysis authorization.
- Use only article text and title as Gemini input; do not send sources, Clerk data, secrets, or unrelated database fields.
- Persist no invalid model output. If model validation, insertion, or `analyzed_at` update fails, ensure the article is not falsely reported as successfully analyzed.
- Do not use browser code to invoke Gemini, the analysis pipeline, or the service-role Supabase client.

## Acceptance criteria

- `POST /api/analyze` returns `401` without a valid `x-skew-admin-secret` and does not contact Gemini or mutate Supabase.
- By default, the route processes every article with no `article_analyses` row, in configurable batches, regardless of `articles.analyzed_at`.
- An optional list of article IDs and an optional run-wide limit constrain the selected work correctly.
- Each valid analysis stores all required article-analysis fields, uses the correct derived bias score, has percentages totaling 100, and sets `analyzed_at` only after its analysis row is saved.
- Invalid, inconsistent, or failed structured outputs are retried once, then logged/skipped without persisting bad analysis data.
- Progress and a final structured summary appear in the Next.js server terminal and the logs table records safe lifecycle events.
- The existing homepage can display newly analyzed stored articles without UI changes.
- No pgvector/embedding/related-articles work is introduced.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps expected after implementation

1. Put real server-only values in `.env.local` (never commit it):

   ```dotenv
   GEMINI_API_KEY=...
   SKEW_ADMIN_SECRET=...
   ANALYSIS_BATCH_SIZE=5
   ```

2. Confirm the Supabase schema from `supabase/schema.sql` has already been run and that there is at least one scraped article without an `article_analyses` row.

3. Start the app and keep its terminal visible for progress logs:

   ```powershell
   npm run dev
   ```

4. Verify missing authorization is rejected:

   ```powershell
   curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d "{}"
   ```

   Expect `401 Unauthorized`.

5. Run one known pending article by replacing `ARTICLE_UUID` and `YOUR_ADMIN_SECRET`:

   ```powershell
   curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-skew-admin-secret: YOUR_ADMIN_SECRET" -d "{\"articleIds\":[\"ARTICLE_UUID\"],\"limit\":1}"
   ```

   Expect `200` and a summary whose `analyzed` count is `1` when model output is valid. Watch the dev-server terminal for per-batch and final summary logs.

6. Run the full pending queue:

   ```powershell
   curl.exe -i -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -H "x-skew-admin-secret: YOUR_ADMIN_SECRET" -d "{}"
   ```

7. In Supabase SQL Editor, verify successful records and write order:

   ```sql
   select
     a.id,
     a.analyzed_at,
     aa.summary,
     aa.sentiment_label,
     aa.bias_label,
     aa.left_percentage,
     aa.center_percentage,
     aa.right_percentage,
     aa.confidence,
     aa.model
   from public.articles a
   left join public.article_analyses aa on aa.article_id = a.id
   order by a.scraped_at desc;
   ```

   Confirm each successfully analyzed article has both a non-null `analyzed_at` and an analysis row whose percentages total `100`.

8. Reload `http://localhost:3000/` and confirm the analyzed article appears with stored sentiment, AI-estimated framing, distribution, and confidence.
