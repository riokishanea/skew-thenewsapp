# Supabase sample dataset

## Goal

Add a repeatable development-only seed script that populates Skew’s database with a small, coherent dataset for exercising source reads, homepage-feed queries, detail queries, analysis rendering, and URL-deduplication behavior.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- Official Supabase guidance on tables and row-level security.

## Existing code inspected

- `supabase/schema.sql` — defines the six canonical tables, constraints, RLS, and least-privilege grants.
- `lib/supabase/queries/articles.ts` — requires sources, articles, and article analyses to exercise `getPublishedArticles`, `getArticleBySlug`, and pending-analysis logic.
- `lib/supabase/queries/sources.ts` — reads active source rows for later pipeline selection.
- `AGENTS.md` — prohibits invented source URLs in scraping behavior and requires active sources to come only from `sources`.

## Decisions and assumptions

- Add a separate `supabase/seed.sql`; never mix development data into `supabase/schema.sql`.
- The seed is explicitly development/demo data, using self-consistent fictional article text and AI-estimated analysis. It must not present invented reporting, headlines, or political framing as real news.
- Seed several recognizable real source homepages as active configuration rows only. The seed does not scrape them, create sub-endpoint URLs, or create fabricated articles attributed to them.
- Seed article and analysis records under one inactive `Skew Demo` source using reserved `example.test` URLs. Keeping this source inactive prevents a later scraper from attempting to scrape demonstration URLs, while allowing the read-query layer to render complete records.
- Do not seed `oxylabs_schedules` or `oxylabs_schedule_runs`: schedule and job IDs must originate from real Oxylabs responses and must never be invented. Do not seed logs because they should represent actual pipeline activity.
- The seed can safely be re-run. It will use stable UUIDs and `INSERT ... ON CONFLICT` operations without deleting production data or modifying existing non-seed records.
- No application code, schema, RLS policy, browser access, API route, scraper, or AI behavior changes in this task.

## Files likely to change

- `supabase/seed.sql`
- `README.md` — add the exact safe sequence for running schema then development seed.

## Implementation requirements

1. Create `supabase/seed.sql` with clear warnings that it is development/demo data and must not be used as a production content source.
2. Use stable UUIDs for seed rows and a transaction (`begin`/`commit`) so references are valid and a failure does not leave a partial dataset.
3. Insert at least three active source configuration rows containing homepage URLs only, plus exactly one inactive `Skew Demo` source for fabricated test content.
4. Insert 6–8 demo articles under `Skew Demo`, each satisfying all `articles` constraints:
   - distinct valid slugs, original URLs, titles, images, timestamps, and meaningful raw text;
   - `analyzed_at` present;
   - all URLs use `https://*.example.test/...` and are clearly non-production.
5. Insert one valid `article_analyses` row for every demo article:
   - labels adhere to the allowed enumerations;
   - sentiment and bias scores stay in range;
   - left/center/right values total exactly 100;
   - summaries, notes, loaded terms, disclaimers, and model values are complete;
   - wording labels framing as AI-estimated demonstration data.
6. Ensure all seeded demo articles show through `getPublishedArticles()` and one known demo slug is retrievable through `getArticleBySlug()`.
7. Use `ON CONFLICT` only with the seed rows’ stable source URLs, article URLs/slugs, and one-to-one analysis article IDs. Never use seed SQL to delete, truncate, or overwrite unrelated records.
8. Keep active real source setup distinct from sample content. Do not add those sources to scraper code or alter source-selection rules.

## Security requirements

- No credentials, keys, or `.env.local` values appear in the seed or README.
- Keep RLS and existing grants/revocations unchanged.
- Use reserved `.example.test` article/image URLs for all fictional content; do not impersonate real publishers or attribute fabricated reporting to them.
- No fake Oxylabs schedule/job identifiers, logs, user records, or Clerk data.

## Acceptance criteria

- `supabase/schema.sql` remains schema-only.
- A fresh development project can run the schema then `seed.sql` without constraint or foreign-key failures.
- Re-running the seed is safe and does not duplicate records.
- The seed gives the server query layer multiple analyzed feed records and valid detail records, while `getPendingAnalysisArticles()` returns no seed articles.
- The data is visibly and technically isolated from later scraping: only real source homepages are active and demo source/article URLs cannot be scraped.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps after implementation

1. In a development Supabase project, first run `supabase/schema.sql` in Dashboard → SQL Editor.
2. Run `supabase/seed.sql` in the same SQL Editor.
3. Run it a second time; confirm it completes without duplicate-key or foreign-key errors.
4. Verify the demo content:

   ```sql
   select a.slug, a.title, s.name, aa.bias_label, aa.left_percentage,
          aa.center_percentage, aa.right_percentage
   from public.articles a
   join public.sources s on s.id = a.source_id
   join public.article_analyses aa on aa.article_id = a.id
   where s.name = 'Skew Demo'
   order by a.published_at desc;
   ```

   Confirm 6–8 rows return and each distribution totals 100.
5. Confirm the scraper will not target demo content:

   ```sql
   select name, listing_url, is_active
   from public.sources
   order by name;
   ```

   Confirm `Skew Demo` is inactive and its `listing_url` is a reserved example URL.
