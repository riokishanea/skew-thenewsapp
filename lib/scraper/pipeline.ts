import "server-only";

import { fetchHtmlViaOxylabs } from "../oxylabs/client";
import { findExistingArticleUrls, insertArticle } from "../supabase/queries/articles";
import { insertLog } from "../supabase/queries/logs";
import { getActiveSources } from "../supabase/queries/sources";
import type { ArticleRow } from "../supabase/types";
import { extractCandidateUrls } from "./extract";
import { parseArticleDetail } from "./parse";
import type { ScrapeRequestOptions, ScrapeRunSummary } from "./types";

const DEFAULT_LIMIT_PER_SOURCE = 5;

export async function runScrapePipeline(
  options: ScrapeRequestOptions = {},
): Promise<ScrapeRunSummary> {
  const startTime = Date.now();
  const limitPerSource = Math.max(1, Math.min(options.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE, 20));

  console.log(`[Scraper] Starting scrape run with limitPerSource=${limitPerSource}...`);

  // 1. Load active sources from Supabase
  let activeSources = await getActiveSources();

  if (options.sources && options.sources.length > 0) {
    const selectedFilter = options.sources.map((s) => s.toLowerCase().trim());
    activeSources = activeSources.filter(
      (source) =>
        selectedFilter.includes(source.name.toLowerCase()) ||
        selectedFilter.includes(source.id.toLowerCase()),
    );
  }

  if (activeSources.length === 0) {
    console.warn("[Scraper] No matching active sources found to scrape.");
    return {
      status: "completed",
      sourcesChecked: 0,
      candidatesFound: 0,
      candidatesRejected: 0,
      duplicatesSkipped: 0,
      detailPagesScraped: 0,
      articlesInserted: 0,
      articlesRejected: 0,
      articlesFailed: 0,
      totalDurationMs: Date.now() - startTime,
      rejectionReasons: { "No active sources matching request": 1 },
      insertedArticles: [],
    };
  }

  console.log(
    `[Scraper] Active sources selected (${activeSources.length}): ${activeSources.map((s) => s.name).join(", ")}`,
  );

  // Log pipeline start
  try {
    await insertLog({
      event: "scrape_started",
      level: "info",
      message: `Starting scrape run for ${activeSources.length} sources`,
      source_id: null,
      article_id: null,
      context: {
        sources: activeSources.map((s) => s.name),
        limitPerSource,
      },
    });
  } catch (logErr) {
    console.error("[Scraper] Failed to record start log:", logErr);
  }

  let candidatesFound = 0;
  let candidatesRejected = 0;
  let duplicatesSkipped = 0;
  let detailPagesScraped = 0;
  let articlesInserted = 0;
  let articlesRejected = 0;
  let articlesFailed = 0;
  const rejectionReasons: Record<string, number> = {};
  const insertedArticles: Array<Pick<ArticleRow, "id" | "title" | "slug" | "original_url">> = [];

  function recordRejection(reason: string) {
    rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
  }

  for (const source of activeSources) {
    console.log(`[Scraper] === Processing Source: ${source.name} (${source.listing_url}) ===`);

    let homepageHtml: string;
    try {
      homepageHtml = await fetchHtmlViaOxylabs(source.listing_url);
      console.log(`[Scraper] Homepage fetched successfully for ${source.name}.`);
    } catch (fetchErr) {
      console.error(`[Scraper] Failed to fetch homepage for ${source.name}:`, fetchErr);
      articlesFailed++;
      recordRejection(`Homepage fetch error: ${source.name}`);
      continue;
    }

    // Extract candidates from homepage
    const extraction = extractCandidateUrls(homepageHtml, source);
    candidatesFound += extraction.candidates.length;
    candidatesRejected += extraction.rejectedCount;

    for (const [reason, count] of Object.entries(extraction.rejectionReasons)) {
      rejectionReasons[reason] = (rejectionReasons[reason] || 0) + count;
    }

    console.log(
      `[Scraper] Found ${extraction.candidates.length} candidate URLs for ${source.name} (${extraction.rejectedCount} candidate URLs filtered out).`,
    );

    if (extraction.candidates.length === 0) {
      console.warn(`[Scraper] No viable candidate URLs extracted from ${source.name}.`);
      continue;
    }

    // Deduplication against Supabase (chunks of <= 15 checked inside findExistingArticleUrls)
    const existingUrlsSet = await findExistingArticleUrls(extraction.candidates);
    const newCandidates = extraction.candidates.filter((url) => !existingUrlsSet.has(url));

    const sourceDuplicates = extraction.candidates.length - newCandidates.length;
    duplicatesSkipped += sourceDuplicates;

    console.log(
      `[Scraper] Deduplication check: ${newCandidates.length} new candidate URLs (${sourceDuplicates} already stored in Supabase).`,
    );

    let insertedForSource = 0;

    for (const targetUrl of newCandidates) {
      if (insertedForSource >= limitPerSource) {
        console.log(
          `[Scraper] Reached target limit of ${limitPerSource} articles for ${source.name}.`,
        );
        break;
      }

      console.log(`[Scraper] Scraping article detail: ${targetUrl}`);
      detailPagesScraped++;

      let detailHtml: string;
      try {
        detailHtml = await fetchHtmlViaOxylabs(targetUrl);
      } catch (detailFetchErr) {
        console.error(`[Scraper] Error scraping detail URL (${targetUrl}):`, detailFetchErr);
        articlesFailed++;
        recordRejection("Detail page fetch error");
        continue;
      }

      const validation = parseArticleDetail(detailHtml, targetUrl, source);

      if (!validation.valid) {
        articlesRejected++;
        recordRejection(validation.reason);
        console.warn(`[Scraper] Article rejected (${targetUrl}): ${validation.reason}`);
        continue;
      }

      try {
        const saved = await insertArticle({
          source_id: validation.article.source_id,
          original_url: validation.article.original_url,
          canonical_url: validation.article.canonical_url,
          slug: validation.article.slug,
          title: validation.article.title,
          image_url: validation.article.image_url,
          published_at: validation.article.published_at,
          raw_text: validation.article.raw_text,
          scraped_at: new Date().toISOString(),
          analyzed_at: null,
        });

        articlesInserted++;
        insertedForSource++;
        insertedArticles.push({
          id: saved.id,
          title: saved.title,
          slug: saved.slug,
          original_url: saved.original_url,
        });

        console.log(
          `[Scraper] Successfully inserted article (${insertedForSource}/${limitPerSource} for ${source.name}): "${saved.title}" (slug: ${saved.slug})`,
        );
      } catch (insertErr) {
        console.error(`[Scraper] Failed to insert article (${targetUrl}) into database:`, insertErr);
        articlesFailed++;
        recordRejection("Database insert error");
      }
    }
  }

  const totalDurationMs = Date.now() - startTime;

  const summary: ScrapeRunSummary = {
    status: "completed",
    sourcesChecked: activeSources.length,
    candidatesFound,
    candidatesRejected,
    duplicatesSkipped,
    detailPagesScraped,
    articlesInserted,
    articlesRejected,
    articlesFailed,
    totalDurationMs,
    rejectionReasons,
    insertedArticles,
  };

  console.log("[Scraper] === Scrape Pipeline Summary ===");
  console.log(JSON.stringify(summary, null, 2));

  // Log pipeline completion
  try {
    await insertLog({
      event: "scrape_completed",
      level: "info",
      message: `Scrape finished in ${totalDurationMs}ms. Inserted ${articlesInserted} articles.`,
      source_id: null,
      article_id: null,
      context: {
        sourcesChecked: summary.sourcesChecked,
        candidatesFound: summary.candidatesFound,
        candidatesRejected: summary.candidatesRejected,
        duplicatesSkipped: summary.duplicatesSkipped,
        detailPagesScraped: summary.detailPagesScraped,
        articlesInserted: summary.articlesInserted,
        articlesRejected: summary.articlesRejected,
        articlesFailed: summary.articlesFailed,
        totalDurationMs: summary.totalDurationMs,
        rejectionReasons: summary.rejectionReasons,
      },
    });
  } catch (logErr) {
    console.error("[Scraper] Failed to record completion log:", logErr);
  }

  return summary;
}
