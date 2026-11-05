# Oxylabs Scraping Pipeline Implementation

## Goal

Implement the on-demand manual scraping pipeline (`POST /api/scrape`) powered by the Oxylabs Web Scraper API and Supabase persistence. The pipeline loads active homepage sources from Supabase, fetches homepage HTML via Oxylabs, extracts visible story card links, filters candidate URLs against strict rejection rules, deduplicates against stored article URLs (with chunked queries of at most 15 URLs), fetches article detail pages via Oxylabs, validates and cleans article content, saves valid articles append-only into the Supabase `articles` table, emits structured progress logs, and returns a comprehensive run summary.

## Skills read

- `.agents/skills/web-scraper-api/SKILL.md`
- `.agents/skills/supabase/SKILL.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

## Existing code inspected

- `AGENTS.md` (Sections 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17) — source of truth for scraping pipeline, non-article reject lists, article content gate, candidate filtering, deduplication chunking, admin secret protection, and logging.
- `lib/supabase/types.ts` — database types for `SourceRow`, `ArticleRow`, `ArticleInsert`, `LogRow`, etc.
- `lib/supabase/server.ts` — server-only Supabase service-role client factory.
- `lib/supabase/queries/sources.ts` — `getActiveSources()`, `getSourceById()`.
- `lib/supabase/queries/articles.ts` — `findExistingArticleUrls()` (chunks of 15), `insertArticle()`.
- `lib/supabase/queries/logs.ts` — `insertLog()`.
- `supabase/schema.sql` and `supabase/seed.sql` — database schema and active homepage sources.
- Active sources inspected in Supabase:
  1. Reuters (`https://www.reuters.com/`)
  2. NPR (`https://www.npr.org/`)
  3. Fox News (`https://www.foxnews.com/`)
  4. BBC (`https://www.bbc.com/news`)
  5. The Guardian (`https://www.theguardian.com/us`)

## Decisions and assumptions

- **Cheerio Dependency**: Install `cheerio` for robust, deterministic DOM parsing and HTML text extraction on the server.
- **Oxylabs Client**: Build a dedicated helper (`lib/oxylabs/client.ts`) that calls `https://realtime.oxylabs.io/v1/queries` with `source: "universal"`, `url`, `render: "html"`, returning raw HTML. Authenticates via Bearer Token using `OXYLABS_WEB_API_KEY` (`Authorization: Bearer <key>`), with fallback to HTTP Basic Auth if `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD` are provided.
- **Admin Secret Authentication**: In accordance with Section 15, enforce `x-skew-admin-secret` header verification against `process.env.SKEW_ADMIN_SECRET || process.env["x-SKEW-admin-secret"]`. Missing or invalid secret immediately responds with `401 Unauthorized`.
- **Configurable Source Selection**: Per Section 8 and 16, accept optional JSON body parameters:
  - `sources`: optional array of source names (e.g. `["Reuters", "BBC"]`) or source IDs. If omitted, defaults to all active sources.
  - `limitPerSource`: optional number of valid articles to insert per source (defaults to 5).
- **Candidate Link Extraction & Source Strategies** (`lib/scraper/extract.ts`):
  - Homepage URLs from Supabase are entry points only.
  - Extract only visible story/article cards.
  - Normalize relative URLs to absolute URLs using the source homepage as base.
  - Exclude any link matching the **non-article reject list**: category/section listings, author profiles, search, navigation/footer, show/program/podcast hubs, live blogs/feeds, games, product/shopping/reviews, newsletters, corporate/support, and video-only hubs.
  - Source-specific patterns:
    - **Reuters**: `/world/africa`, `/business` etc. are rejected; article paths with slug and identifier are accepted.
    - **NPR**: `/sections/politics`, `/programs/` etc. are rejected; story links with date/ID slugs are accepted.
    - **Fox News**: show, game, live, video hubs are rejected; news/story slugs accepted.
    - **BBC**: `/sport`, `/weather`, `/sounds`, live hubs rejected; `/news/articles/` or news article IDs accepted.
    - **The Guardian**: `/us/environment`, `/thefilter-us`, section listings rejected; story URLs with date paths accepted.
- **Deduplication**:
  - Filter candidate URLs in-memory to remove duplicates within the scrape batch.
  - Call `findExistingArticleUrls()` (which checks in chunks of <= 15 for both `original_url` and `canonical_url` in Supabase) to skip already ingested articles.
- **Article Detail Scraping & Content Gate** (`lib/scraper/parse.ts`):
  - Scrape detail pages using Oxylabs.
  - Extract `title`, `canonical_url`, `published_at`, `image_url`, and `raw_text`.
  - Validate against the article content gate:
    - Must have article-specific URL and title.
    - Must have an image URL.
    - Must have a valid published date (ISO string).
    - Body quality: must pass either 3+ meaningful paragraphs or 900+ meaningful characters after removing scripts, styles, ad placeholders, social sharing, newsletters, related links, navigation dumps.
    - Reject generic titles or non-article pages.
  - Slug generation: generate a clean, URL-safe slug with collision protection (e.g. `slugify(title)` with unique short suffix).
- **Persistence & Run Logging**:
  - Insert valid articles append-only using `insertArticle()`.
  - Leave `analyzed_at` as `null` (AI analysis is handled separately by `POST /api/analyze`).
  - Log neat console messages during execution.
  - Insert log entries into Supabase `logs` table via `insertLog()` for run events.
  - Return a comprehensive summary object matching Section 9 / 16:
    `{ status, sourcesChecked, candidatesFound, candidatesRejected, duplicatesSkipped, detailPagesScraped, articlesInserted, articlesRejected, articlesFailed, totalDurationMs, rejectionReasons }`.

## Files likely to change

- `package.json` — add `cheerio` (and `@types/cheerio` if needed).
- `lib/oxylabs/client.ts` — new: client for Oxylabs Realtime API queries.
- `lib/scraper/extract.ts` — new: candidate URL extraction and source-specific filtering.
- `lib/scraper/parse.ts` — new: article detail parsing, cleanup, and content gate validation.
- `lib/scraper/pipeline.ts` — new: scrape-to-insert orchestrator and run logger.
- `lib/scraper/types.ts` — new: scraper options, candidate interfaces, and run summary types.
- `app/api/scrape/route.ts` — new: `POST /api/scrape` route handler protected by `x-skew-admin-secret`.

## Implementation requirements

1. Install `cheerio` and ensure clean TypeScript compilation.
2. Implement `lib/oxylabs/client.ts`:
   - Authenticate with `OXYLABS_WEB_API_KEY` via `Authorization: Bearer <key>` (or Basic Auth fallback).
   - Post to `https://realtime.oxylabs.io/v1/queries` with `source: "universal"`, `url`, `render: "html"`.
   - Error handling for invalid credentials or non-200 responses.
3. Implement `lib/scraper/extract.ts`:
   - Parse homepage HTML with Cheerio.
   - Extract candidate story links.
   - Apply non-article reject list and source-specific article patterns.
   - Return clean, normalized absolute URLs.
4. Implement `lib/scraper/parse.ts`:
   - Parse article detail HTML with Cheerio.
   - Extract title (e.g. `h1`, `meta[property="og:title"]`).
   - Extract canonical URL (`link[rel="canonical"]`).
   - Extract image URL (`meta[property="og:image"]`, lead `<img>`).
   - Extract published date (`meta[property="article:published_time"]`, `time[datetime]`).
   - Extract and sanitize body text: strip unwanted selectors (`script`, `style`, `nav`, `footer`, `.advertisement`, `.social-share`, `.newsletter`, etc.).
   - Evaluate against the article content gate (image required, published date required, body quality: 3+ paragraphs or 900+ clean chars).
5. Implement `lib/scraper/pipeline.ts`:
   - Orchestrate the scrape-to-insert workflow:
     1. Load selected active sources from Supabase.
     2. Fetch homepage via Oxylabs.
     3. Extract candidate URLs.
     4. Filter against non-article reject rules.
     5. Check existence in Supabase using `findExistingArticleUrls` (max 15 per chunk).
     6. Detail scrape candidates up to the per-source limit.
     7. Validate and clean content.
     8. Insert valid articles via `insertArticle`.
     9. Log progress to console and Supabase `logs`.
     10. Aggregate summary statistics.
6. Implement `app/api/scrape/route.ts`:
   - Check `x-skew-admin-secret` header against server secret.
   - Support `POST` method only.
   - Parse optional body `{ sources?: string[], limitPerSource?: number }`.
   - Execute pipeline and return JSON summary.

## Security requirements

- `OXYLABS_WEB_API_KEY` (and any legacy credentials) must only be accessed in server-side modules (`server-only`).
- `SKEW_ADMIN_SECRET` / `x-SKEW-admin-secret` must never be exposed to the browser or returned in API responses.
- The `POST /api/scrape` endpoint must reject unauthorized requests with status 401.
- Supabase writes use the service-role client server-side only.

## Acceptance criteria

- `POST /api/scrape` returns 401 if `x-skew-admin-secret` is missing or invalid.
- `POST /api/scrape` runs the full pipeline for active sources in Supabase.
- Homepages, listings, and non-article pages are strictly rejected and never saved as articles.
- Articles without image URL or published date are rejected.
- Valid articles are saved append-only into `articles` with null `analyzed_at`.
- Detailed console messages and `logs` table records are created during the scrape.
- The response returns the structured summary object with counts and rejection reasons.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass cleanly.

## Checks to run

```powershell
npm run typecheck
npm run lint
npm run build
```

## Manual test steps expected after implementation

1. Start the Next.js development server:
   ```powershell
   npm run dev
   ```
2. In another terminal, test unauthorized request:
   ```bash
   curl -X POST http://localhost:3000/api/scrape -i
   ```
   Verify `401 Unauthorized`.
3. Test authorized scraping for 1 source (e.g. NPR or BBC, 2 articles limit):
   ```bash
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -H "x-skew-admin-secret: thisistheskewsecret" \
     -d '{"sources": ["NPR"], "limitPerSource": 2}'
   ```
4. Observe server logs in the dev server terminal showing each step (source start, homepage fetched, candidates found/rejected, dedupe, detail scrape, validation, insertion, summary).
5. Verify JSON response contains the summary object with `status: "completed"` and articles inserted.

