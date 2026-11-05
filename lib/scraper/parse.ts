import * as cheerio from "cheerio";
import type { SourceRow } from "../supabase/types";
import type { ArticleValidationResult, ExtractedArticle } from "./types";

const GENERIC_TITLES = new Set([
  "home",
  "news",
  "latest news",
  "breaking news",
  "world news",
  "us news",
  "politics",
  "business",
  "opinion",
  "entertainment",
  "sports",
  "weather",
  "lifestyle",
  "culture",
  "video",
  "podcasts",
  "shows",
  "watch live",
  "live updates",
  "subscribe",
  "sign in",
  "reuters",
  "npr",
  "fox news",
  "bbc",
  "bbc news",
  "the guardian",
]);

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const truncated = base.slice(0, 80).replace(/-+$/, "");
  return truncated ? `${truncated}-${randomSuffix}` : `article-${randomSuffix}`;
}

function parsePublishedDate($: cheerio.CheerioAPI): string | null {
  const metaSelectors = [
    'meta[property="article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[property="og:published_time"]',
    'meta[name="publication_date"]',
    'meta[name="date"]',
    'meta[property="rnews:datePublished"]',
    'meta[itemprop="datePublished"]',
  ];

  for (const selector of metaSelectors) {
    const val = $(selector).attr("content");
    if (val) {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
  }

  // Look in time tags
  let foundTime: string | null = null;
  $("time[datetime]").each((_, el) => {
    if (foundTime) return;
    const datetime = $(el).attr("datetime");
    if (datetime) {
      const parsed = new Date(datetime);
      if (!isNaN(parsed.getTime())) {
        foundTime = parsed.toISOString();
      }
    }
  });

  return foundTime;
}

function parseImageUrl($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const metaSelectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="twitter:image:src"]',
    'meta[itemprop="image"]',
  ];

  for (const selector of metaSelectors) {
    const content = $(selector).attr("content");
    if (content) {
      try {
        const resolved = new URL(content, baseUrl).toString();
        if (resolved.startsWith("http")) return resolved;
      } catch {
        // continue
      }
    }
  }

  // Fallback: look for hero or article image
  let foundImg: string | null = null;
  $("article img, [data-testid*='article'] img, main figure img, figure img").each((_, el) => {
    if (foundImg) return;
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src && !src.startsWith("data:") && !src.includes("pixel") && !src.includes("icon")) {
      try {
        const resolved = new URL(src, baseUrl).toString();
        if (resolved.startsWith("http")) {
          foundImg = resolved;
        }
      } catch {
        // continue
      }
    }
  });

  return foundImg;
}

function cleanAndExtractBody($: cheerio.CheerioAPI): { paragraphs: string[]; fullText: string } {
  // Selectively remove clutter before extracting text
  const selectorsToRemove = [
    "script",
    "style",
    "noscript",
    "iframe",
    "header",
    "nav",
    "footer",
    "aside",
    ".advertisement",
    ".ad-container",
    ".ad",
    "[id*='ad-']",
    "[class*='advertisement']",
    "[class*='sponsored']",
    ".newsletter",
    ".subscription",
    ".social-share",
    ".share-tools",
    ".related-articles",
    ".related-content",
    ".most-popular",
    ".most-read",
    ".comments",
    "#comments",
    ".author-bio",
    ".bio",
    "figcaption",
  ];

  $(selectorsToRemove.join(", ")).remove();

  // Target the article body containers
  const bodyCandidates = [
    "article [data-component='text-block']",
    "article [data-testid='paragraph']",
    "article p",
    "[data-testid*='article-body'] p",
    "[itemprop='articleBody'] p",
    ".article-body p",
    ".story-body p",
    ".body-description p",
    "main article p",
    "main p",
  ];

  let rawParagraphs: string[] = [];

  for (const selector of bodyCandidates) {
    const elements = $(selector);
    if (elements.length >= 2) {
      elements.each((_, el) => {
        const text = $(el).text().trim();
        // Discard boilerplate lines
        if (
          text.length > 30 &&
          !/cookie|subscribe|read more|advertisement|sign up|follow us/i.test(text)
        ) {
          rawParagraphs.push(text);
        }
      });
      if (rawParagraphs.length >= 2) {
        break;
      }
    }
  }

  // Fallback: If no distinct paragraphs found from specific selectors, grab from general article container
  if (rawParagraphs.length === 0) {
    const articleContainer = $("article, [itemprop='articleBody'], main").first();
    if (articleContainer.length > 0) {
      const text = articleContainer.text().replace(/\s+/g, " ").trim();
      // Split on double newlines or sentence boundaries into candidate chunks
      const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((s) => s.length > 40);
      rawParagraphs = sentences;
    }
  }

  // Deduplicate and filter paragraphs
  const cleanParagraphs = Array.from(new Set(rawParagraphs)).filter(
    (p) => p.length > 25 && !p.startsWith("©"),
  );

  const fullText = cleanParagraphs.join("\n\n").trim();

  return {
    paragraphs: cleanParagraphs,
    fullText,
  };
}

export function parseArticleDetail(
  detailHtml: string,
  targetUrl: string,
  source: SourceRow,
): ArticleValidationResult {
  const $ = cheerio.load(detailHtml);

  // 1. Title extraction
  const rawTitle =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text() ||
    $("title").text();

  const title = (rawTitle || "")
    .replace(/\s*\|.*$/, "") // Strip trailing "| Reuters", etc.
    .replace(/\s*-\s*(BBC News|Fox News|NPR|The Guardian).*$/i, "")
    .trim();

  if (!title || title.length < 10) {
    return { valid: false, reason: "Missing or overly short article title" };
  }

  if (GENERIC_TITLES.has(title.toLowerCase())) {
    return { valid: false, reason: `Generic title rejected: "${title}"` };
  }

  // 2. Canonical URL
  const canonicalHref = $('link[rel="canonical"]').attr("href");
  let canonicalUrl: string | null = null;
  if (canonicalHref) {
    try {
      canonicalUrl = new URL(canonicalHref, targetUrl).toString();
    } catch {
      canonicalUrl = null;
    }
  }

  // 3. Published Date
  const publishedAt = parsePublishedDate($);
  if (!publishedAt) {
    return { valid: false, reason: "Missing published date (article content gate)" };
  }

  // 4. Image URL
  const imageUrl = parseImageUrl($, targetUrl);
  if (!imageUrl) {
    return { valid: false, reason: "Missing image URL (article content gate)" };
  }

  // 5. Body cleanup & validation
  const { paragraphs, fullText } = cleanAndExtractBody($);

  // Content quality check per section 13:
  // Must pass either 3+ meaningful paragraphs or 900+ meaningful characters
  const passesParagraphs = paragraphs.length >= 3;
  const passesLength = fullText.length >= 900;

  if (!passesParagraphs && !passesLength) {
    return {
      valid: false,
      reason: `Insufficient body content: ${paragraphs.length} paragraphs, ${fullText.length} chars (required: >= 3 paragraphs or >= 900 chars)`,
    };
  }

  const slug = slugify(title);

  const article: ExtractedArticle = {
    source_id: source.id,
    original_url: targetUrl,
    canonical_url: canonicalUrl,
    slug,
    title,
    image_url: imageUrl,
    published_at: publishedAt,
    raw_text: fullText,
  };

  return {
    valid: true,
    article,
  };
}

