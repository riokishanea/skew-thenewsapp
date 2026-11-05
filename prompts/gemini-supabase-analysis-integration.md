np# Gemini-backed Supabase article analysis integration

## Goal

Make Gemini analysis a real server-side data flow: analyze pending articles stored in Supabase through the existing authenticated endpoint, persist the validated response to `article_analyses`, mark each successfully persisted article as analyzed, and render those stored records on both the home feed and the matching news-details page. The browser must only read rendered stored data; it must never call Gemini or write analysis rows.

## Skills read

- `AGENTS.md`
- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`
- Installed Next.js route-handler and dynamic-route documentation
- Installed `@ai-sdk/google` provider documentation

## Existing code inspected

- `lib/analysis/pipeline.ts`
- `lib/analysis/prompt.ts`
- `lib/analysis/types.ts`
- `app/api/analyze/route.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/types.ts`
- `app/page.tsx`
- `app/news/[slug]/page.tsx`
- `.env.example`
- Existing Gemini analysis prompt files

## Decisions and assumptions

- `GEMINI_API_KEY` and `SKEW_ADMIN_SECRET` are configured in `.env.local`; their values must not be read, logged, committed, or returned in responses.
- Keep the installed Vercel AI SDK 7 / `@ai-sdk/google` 4 integration. It uses a server-only provider instance, `generateText`, and structured output validation.
- Keep `gemini-3.8-flash`: it is a currently documented Gemini API model, and the installed provider accepts model IDs in this form.
- Existing `POST /api/analyze` remains the only manual analysis trigger and processes all pending articles by default. It accepts optional `articleIds` or `limit` without adding a browser trigger.
- A pending item is an `articles` row with no related `article_analyses` row. Do not replace this with an `analyzed_at IS NULL` filter.
- The existing static detail page is demonstrably disconnected from the stored article and analysis records. Replace its fabricated article, analysis, related-story, and source-count claims with persisted data or omit unsupported sections.

## Files likely to change

- `app/news/[slug]/page.tsx`
- `lib/supabase/queries/articles.ts` only if a small read helper is required
- `lib/analysis/pipeline.ts` only if a real integration defect is found during verification
- `app/api/analyze/route.ts` only if needed to preserve the documented API contract
- `prompts/gemini-supabase-analysis-integration.md`

## Implementation requirements

1. Preserve the current server-only Gemini pipeline:
   - create the Google provider with `GEMINI_API_KEY` only on the server;
   - submit each pending article’s title and cleaned `raw_text` to Gemini;
   - use structured output plus Zod validation;
   - validate labels, exact 100% framing total, loaded terms, and derived `bias_score` before a database write;
   - insert `article_analyses` first, then set `articles.analyzed_at` only after the insert succeeds;
   - retain bounded batch processing, the existing retry policy, safe console/log-table run summaries, and no secret leakage.
2. Keep `POST /api/analyze` thin and admin-secret protected. Preserve request validation and its optional `articleIds`/`limit` inputs. Do not add a public GET route or a client-side action button.
3. Convert `app/news/[slug]/page.tsx` into a dynamic Server Component that follows this Next.js version’s `params: Promise<{ slug: string }>` convention, protects the page with Clerk, and calls `getArticleBySlug(slug)`.
4. Use `notFound()` for a missing slug. Render the stored article title, image, source name, date, and cleaned article text. Do not substitute placeholder content.
5. Render the stored analysis when present: neutral summary, sentiment label/score, AI-estimated framing label and percentages, confidence, framing notes, loaded terms (safely narrow the JSON field to strings), disclaimer, and model name where appropriate.
6. If an article has no saved analysis, render a truthful pending-analysis state; do not fabricate results. The home feed should remain limited to successfully analyzed persisted records.
7. Preserve the existing visual system and `BiasMeter`; provide only data it can validate. Remove unsupported assertions such as a multi-source count or hard-coded related stories rather than inventing database data.
8. Do not change schema, generate embeddings, add related-article functionality, scrape content, or change Clerk/auth architecture as part of this task.

## Security requirements

- Keep `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, and Supabase’s service-role key server-only.
- Do not expose secrets in source, browser bundles, errors, logs, curl output, or committed environment files.
- Keep the admin secret exclusively in `x-skew-admin-secret`; never put it in a URL/query string.
- Treat article content as untrusted input, retaining the existing prompt-injection boundary instruction.
- UI pages only read persisted Supabase data; all Gemini calls and writes remain in server-only modules.

## Acceptance criteria

- Calling the authenticated analysis endpoint with an empty JSON body analyzes pending valid articles from Supabase and returns an accurate summary.
- For each successful article, a valid `article_analyses` row exists and its parent `articles.analyzed_at` is non-null.
- An invalid Gemini response is never stored; a failed record is counted/logged and remains pending for a future retry.
- The home page lists only persisted analyzed records.
- A real `/news/<stored-slug>` page renders the associated Supabase article and saved Gemini analysis—not static sample content.
- The browser never receives Gemini credentials or directly calls the model.
- Typecheck, lint, and production build pass.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps after implementation

1. Ensure `.env.local` contains non-empty server-only values for `GEMINI_API_KEY`, `SKEW_ADMIN_SECRET`, Supabase URL, and service-role key. Restart the dev server after any environment change:

   ```powershell
   npm run dev
   ```

2. In a separate PowerShell terminal, use the same secret value from `.env.local` without printing it, then request analysis of all pending articles:

   ```powershell
   $adminSecret = (Get-Content .env.local | Where-Object { $_ -match '^SKEW_ADMIN_SECRET=' } | ForEach-Object { $_.Substring('SKEW_ADMIN_SECRET='.Length) }).Trim()
   Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/analyze -Headers @{ 'x-skew-admin-secret' = $adminSecret; 'Content-Type' = 'application/json' } -Body '{}'
   ```

3. Watch the terminal running Next.js for per-batch Gemini progress and the final analysis summary. Confirm successful records have `analyzed > 0` when pending articles exist and `failed` is zero or has an actionable non-secret reason.
4. Sign in with Clerk, open `http://localhost:3000`, and confirm returned cards reflect persisted Supabase analysis values.
5. Open one card’s `/news/<slug>` URL and verify its body, analysis summary, sentiment, AI-estimated framing, percentages, confidence, notes, loaded terms, disclaimer, and model match the corresponding stored records.
6. Repeat the same POST. It should find no previously analyzed articles because pending detection is based on the related analysis row.
