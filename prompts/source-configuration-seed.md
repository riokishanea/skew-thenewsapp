# Source-only Supabase seed

## Goal

Replace the existing development demo-content seed with the five active source homepage records supplied by the user: Reuters, NPR, Fox News, BBC, and The Guardian.

## Skills read

- `.agents/skills/supabase/SKILL.md`

## Existing code inspected

- `supabase/schema.sql` — `sources` uses `name`, `listing_url`, and `is_active`; it does not have an `active` column.
- `supabase/seed.sql` — currently inserts demo sources, fictional articles, and analyses.
- `AGENTS.md` sections 8 and 11 — active sources must be loaded from the database and store homepage entry URLs only.

## Decisions and assumptions

- Treat the request as a replacement of the committed seed file, not a deletion of rows from an already-provisioned database.
- The seed becomes source configuration only. It will contain no dummy `articles`, `article_analyses`, logs, schedules, or schedule runs.
- Use exactly the supplied source names and homepage URLs. `The Guardian` uses its supplied US homepage URL.
- Use the schema’s `is_active` column, not `active`.
- Use `ON CONFLICT (listing_url) DO NOTHING`, so re-running the seed will not overwrite existing source configuration.
- This replacement means homepage/detail query functions will have no demo article rows until real scraping and analysis are implemented or data is separately added.

## Files likely to change

- `supabase/seed.sql`
- `README.md` — revise the seed description to say it loads configured sources only.

## Implementation requirements

1. Replace `supabase/seed.sql` with a concise idempotent source-only INSERT statement.
2. Insert these five sources as active homepage entries only:
   - Reuters — `https://www.reuters.com/`
   - NPR — `https://www.npr.org/`
   - Fox News — `https://www.foxnews.com/`
   - BBC — `https://www.bbc.com/news`
   - The Guardian — `https://www.theguardian.com/us`
3. Use `(name, listing_url, is_active)` and `ON CONFLICT (listing_url) DO NOTHING`.
4. Do not alter `supabase/schema.sql`, RLS, types, queries, source-selection behavior, or application UI.
5. Update README instructions to distinguish source configuration from article/sample-data seeding.

## Security requirements

- Do not include secrets, credentials, source sub-endpoints, scheduler IDs, fabricated news, or fabricated AI analysis.
- Preserve server-only data access and all existing RLS/grant controls.

## Acceptance criteria

- Re-running `supabase/seed.sql` creates no duplicate source records.
- The five rows use the schema-valid `is_active` column and are all active.
- `getActiveSources()` can return the five configured homepages after the script is run.
- No article or analysis rows are added by the seed.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps after implementation

1. Run `supabase/schema.sql`, then run `supabase/seed.sql` in Supabase Dashboard → SQL Editor.
2. Run `supabase/seed.sql` a second time.
3. Verify the rows:

   ```sql
   select name, listing_url, is_active
   from public.sources
   order by name;
   ```

   Confirm the five configured sources appear once and all have `is_active = true`.
