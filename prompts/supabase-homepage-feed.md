# Supabase-backed homepage feed

## Goal

Remove the hardcoded homepage preview articles and render only analyzed articles returned by the existing server-side Supabase query layer. With the current source-only seed, the homepage must show a clear empty state until real pipeline data exists.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`

## Existing code inspected

- `app/page.tsx` — contains a local 12-item `PreviewArticle` array and renders it as the homepage news grid.
- `lib/supabase/queries/articles.ts` — provides server-only `getPublishedArticles()`, which returns only `articles` with `analyzed_at` set and matching source/analysis rows.
- `lib/supabase/server.ts` — creates the server-only Supabase service-role client; it must remain outside browser bundles.
- `supabase/seed.sql` — now seeds source homepages only, so no homepage article rows should appear after it is run.
- `components/ui/bias-meter.tsx` and `app/globals.css` — provide the existing visual language for framing meters and cards.

## Decisions and assumptions

- This change affects only the homepage. The existing static, Clerk-protected news-detail preview remains out of scope.
- Make the homepage an async Server Component and call `getPublishedArticles()` directly; do not add a public API route or browser Supabase client.
- Do not retain a fallback preview array. A successful query returning no rows is the intended empty state.
- A homepage record requires a source and saved analysis, matching the existing query contract. The initial source-only seed will therefore show the empty state until actual scrape and analysis pipeline data is inserted.
- Use article `slug` for the existing `/news/[slug]` link. Keep `prefetch={false}`.
- The current schema does not store category, region, alt text, or source-count aggregation. Replace those preview-only fields with persisted source name, sentiment label, AI-estimated framing label, framing percentages, and confidence.

## Files likely to change

- `app/page.tsx`
- `app/globals.css` — only if a small empty-state or persisted metadata style is needed.

## Implementation requirements

1. Remove `PreviewArticle`, the local `articles` array, and all hardcoded article image/title/framing data from `app/page.tsx`.
2. Import and await `getPublishedArticles()` in the homepage Server Component.
3. Render a card for every returned record using only persisted fields:
   - article title, image URL, published date, and slug;
   - source name;
   - sentiment label;
   - AI-estimated bias/framing label;
   - left, center, and right percentages through `BiasMeter`;
   - confidence, formatted as a percentage when present.
4. Preserve the existing header, topic bar, section heading, card-grid structure, footer, responsive grid, and accessible article-link semantics.
5. When `getPublishedArticles()` returns an empty array, render one compact, accessible empty-state panel in the news section that explains there are no analyzed articles yet and that articles appear after ingestion and analysis. Do not render fake cards.
6. Do not access the service-role client from client code, expose credentials, scrape, analyze, mutate data, or add endpoint calls.
7. Let Supabase query errors surface as server errors; do not substitute stale or dummy article data.

## Visual interpretation

- Preserve the current restrained editorial layout: section heading above a three-column desktop card grid, two columns at medium widths, and one column on mobile.
- Persisted cards keep the current image-led visual hierarchy, compact framing bar, title typography, and hover/link behavior.
- Replace the old category/region eyebrow with source name plus sentiment label; show framing and confidence in the existing muted compact metadata style.
- The empty panel should align to the grid’s full width, use the existing neutral surface/border/radius palette, have generous but compact padding, and remain readable at 360px without horizontal overflow.
- Keep all framing language explicitly AI-estimated.

## Security requirements

- The Supabase service role remains server-only.
- No environment values, SQL, raw article text, or analysis internals are rendered unintentionally.
- Do not add RLS policy changes or browser database access.

## Acceptance criteria

- No hardcoded article collection remains in the homepage.
- With only `supabase/seed.sql` applied, the homepage shows exactly one empty state and no article cards.
- After valid analyzed articles exist in Supabase, the homepage shows those records newest first and no preview records.
- Each rendered card includes source, title, image, published date, sentiment, AI-estimated framing, distribution, and confidence.
- Existing header/footer design, signed-out homepage access, responsive behavior, and card routing remain intact.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps after implementation

1. Run `supabase/schema.sql`, then `supabase/seed.sql` in a development Supabase project.
2. Start the site with `npm run dev` and open `http://localhost:3000`.
3. Confirm no old preview card is visible and the empty-state panel says no analyzed articles are available yet.
4. After a later pipeline run inserts and analyzes an article, refresh the homepage. Confirm only the stored record appears, with its source, sentiment, AI-estimated framing distribution, and confidence.
5. Resize to approximately 360px and confirm the empty state and later cards do not overflow horizontally.
