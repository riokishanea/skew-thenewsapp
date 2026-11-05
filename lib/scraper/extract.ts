import * as cheerio from "cheerio";
import type { SourceRow } from "../supabase/types";

const GENERIC_REJECT_PATTERNS = [
  /\/category\//i,
  /\/categories\//i,
  /\/section\//i,
  /\/sections\//i,
  /\/topic\//i,
  /\/topics\//i,
  /\/tag\//i,
  /\/tags\//i,
  /\/author\//i,
  /\/authors\//i,
  /\/profile\//i,
  /\/people\//i,
  /\/search(\/|\?|$)/i,
  /\/privacy(-policy)?/i,
  /\/terms(-of-service|-of-use)?/i,
  /\/cookie(-policy)?/i,
  /\/about(-us)?/i,
  /\/contact(-us)?/i,
  /\/help(\/|$)/i,
  /\/support(\/|$)/i,
  /\/subscribe(\/|$)/i,
  /\/subscription(\/|$)/i,
  /\/newsletter(s)?(\/|$)/i,
  /\/games?(\/|$)/i,
  /\/crosswords?(\/|$)/i,
  /\/puzzles?(\/|$)/i,
  /\/weather(\/|$)/i,
  /\/podcasts?(\/|$)/i,
  /\/shows?(\/|$)/i,
  /\/programs?(\/|$)/i,
  /\/radio(\/|$)/i,
  /\/video(s)?(\/|$)/i,
  /\/live(-news|-feed|-updates|-stream)?(\/|$)/i,
  /\/liveblog(\/|$)/i,
  /\/interactive(\/|$)/i,
  /\/shop(ping)?(\/|$)/i,
  /\/store(\/|$)/i,
  /\/product(s)?(\/|$)/i,
  /\/reviews?(\/|$)/i,
  /\/careers?(\/|$)/i,
  /\/press(-releases)?(\/|$)/i,
  /\/sitemap/i,
  /\/feed(\/|$)/i,
  /\/rss(\/|$)/i,
  /\/advertis(e|ing)(\/|$)/i,
  /\/accessibility(\/|$)/i,
];

const ASSET_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp|avif|ico|pdf|mp4|mp3|m3u8|css|js|json|xml)$/i;

export type ExtractedCandidates = {
  candidates: string[];
  rejectedCount: number;
  rejectionReasons: Record<string, number>;
};

function normalizeUrl(rawHref: string, baseUrl: string): string | null {
  try {
    const trimmed = rawHref.trim();
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("javascript:") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:")
    ) {
      return null;
    }

    const resolved = new URL(trimmed, baseUrl);

    // Keep only http / https
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }

    // Strip hash and common tracking params
    resolved.hash = "";
    resolved.searchParams.delete("utm_source");
    resolved.searchParams.delete("utm_medium");
    resolved.searchParams.delete("utm_campaign");
    resolved.searchParams.delete("utm_term");
    resolved.searchParams.delete("utm_content");

    return resolved.toString();
  } catch {
    return null;
  }
}

function checkSourceSpecificUrl(url: URL, sourceName: string): { isArticle: boolean; reason?: string } {
  const path = url.pathname.replace(/\/+$/, "");
  const segments = path.split("/").filter(Boolean);

  const lowerName = sourceName.toLowerCase();

  if (lowerName.includes("reuters")) {
    // Reuters articles usually have a detailed path with a date or article ID slug:
    // e.g. /world/americas/slug-YYYY-MM-DD/ or /business/slug-id/
    // Category listings: /world/, /world/africa, /business, /markets, /sustainability
    if (segments.length <= 1) {
      return { isArticle: false, reason: "Reuters category or section listing" };
    }
    const lastSegment = segments[segments.length - 1];
    // Category listings like /world/africa, /world/americas have short single-word slugs
    if (!lastSegment.includes("-") && !/\d/.test(lastSegment)) {
      return { isArticle: false, reason: "Reuters category or section listing" };
    }
    return { isArticle: true };
  }

  if (lowerName.includes("npr")) {
    // NPR articles follow date-based paths: /YYYY/MM/DD/<id>/<slug>
    // Sections like /sections/politics or /series/ are listings
    if (segments.length >= 4 && /^\d{4}$/.test(segments[0]) && /^\d{2}$/.test(segments[1])) {
      return { isArticle: true };
    }
    if (path.includes("/sections/") || segments.length < 3) {
      return { isArticle: false, reason: "NPR section or non-article listing" };
    }
    // General story check if slug contains hyphens and ID
    if (segments.some((s) => /^\d{6,}$/.test(s))) {
      return { isArticle: true };
    }
    return { isArticle: false, reason: "NPR non-article URL structure" };
  }

  if (lowerName.includes("fox")) {
    // Fox articles typically have /<category>/<long-slug-with-hyphens>
    // Show/video/live are already caught by generic reject, but verify slug length
    if (segments.length < 2) {
      return { isArticle: false, reason: "Fox News section listing" };
    }
    const lastSegment = segments[segments.length - 1];
    if (lastSegment.split("-").length < 3) {
      return { isArticle: false, reason: "Fox News category or short non-article path" };
    }
    return { isArticle: true };
  }

  if (lowerName.includes("bbc")) {
    // BBC news articles follow /news/articles/<id> or /news/<slug-with-id>
    if (path.includes("/news/articles/")) {
      return { isArticle: true };
    }
    if (path.startsWith("/news/") && segments.length >= 2) {
      const lastSegment = segments[segments.length - 1];
      // e.g., world-us-canada-12345678
      if (/-\d{6,}$/.test(lastSegment)) {
        return { isArticle: true };
      }
    }
    return { isArticle: false, reason: "BBC section, sport, live, or non-article path" };
  }

  if (lowerName.includes("guardian")) {
    // Guardian articles: /<section>/YYYY/<month>/<day>/<slug>
    // e.g. /us-news/2026/mar/01/headline-slug
    const hasDatePattern = segments.some(
      (s, idx) => /^\d{4}$/.test(s) && idx + 2 < segments.length,
    );
    if (hasDatePattern) {
      return { isArticle: true };
    }
    return { isArticle: false, reason: "The Guardian section or topic listing" };
  }

  // Fallback for general sources: require at least 2 segments and a hyphenated slug
  if (segments.length >= 2 && segments[segments.length - 1].includes("-")) {
    return { isArticle: true };
  }

  return { isArticle: false, reason: "Generic non-article URL structure" };
}

export function extractCandidateUrls(
  homepageHtml: string,
  source: SourceRow,
): ExtractedCandidates {
  const $ = cheerio.load(homepageHtml);
  const candidatesSet = new Set<string>();
  const rejectionReasons: Record<string, number> = {};
  let rejectedCount = 0;

  function recordRejection(reason: string) {
    rejectedCount++;
    rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
  }

  // Remove header, nav, footer, aside, forms, and ad containers before extracting visible story links
  $("header, nav, footer, aside, form, [role='navigation'], [role='banner'], [role='contentinfo'], .advertisement, #cookie-banner").remove();

  // Target visible story cards and article links
  const linkSelectors = [
    "main a[href]",
    "article a[href]",
    "[data-testid*='card'] a[href]",
    "[data-testid*='story'] a[href]",
    "[data-testid*='article'] a[href]",
    ".story a[href]",
    ".card a[href]",
    "h2 a[href]",
    "h3 a[href]",
    "h1 a[href]",
    "a[href]",
  ];

  const seenHref = new Set<string>();

  $(linkSelectors.join(", ")).each((_, el) => {
    const rawHref = $(el).attr("href");
    if (!rawHref) return;

    if (seenHref.has(rawHref)) return;
    seenHref.add(rawHref);

    const normalized = normalizeUrl(rawHref, source.listing_url);
    if (!normalized) {
      recordRejection("Malformed or non-HTTP URL");
      return;
    }

    const urlObj = new URL(normalized);

    // Ensure link belongs to same host (or recognized domain for the source)
    const sourceBaseHost = new URL(source.listing_url).hostname.replace(/^www\./, "");
    const candidateHost = urlObj.hostname.replace(/^www\./, "");
    if (!candidateHost.includes(sourceBaseHost) && !sourceBaseHost.includes(candidateHost)) {
      recordRejection("External domain link");
      return;
    }

    // Check homepage itself
    if (urlObj.pathname === "/" || urlObj.pathname === "") {
      recordRejection("Homepage URL");
      return;
    }

    // Check static asset extensions
    if (ASSET_EXTENSIONS.test(urlObj.pathname)) {
      recordRejection("Asset / Media link");
      return;
    }

    // Check generic non-article reject list
    const matchedGeneric = GENERIC_REJECT_PATTERNS.find((regex) => regex.test(urlObj.pathname));
    if (matchedGeneric) {
      recordRejection("Non-article reject list pattern");
      return;
    }

    // Check source-specific article patterns
    const sourceCheck = checkSourceSpecificUrl(urlObj, source.name);
    if (!sourceCheck.isArticle) {
      recordRejection(sourceCheck.reason || "Source-specific reject check");
      return;
    }

    candidatesSet.add(normalized);
  });

  return {
    candidates: Array.from(candidatesSet),
    rejectedCount,
    rejectionReasons,
  };
}

