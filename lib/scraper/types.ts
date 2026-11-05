import type { ArticleRow, SourceRow } from "../supabase/types";

export type ScrapeRequestOptions = {
  sources?: string[];
  limitPerSource?: number;
};

export type CandidateLink = {
  url: string;
  source: SourceRow;
};

export type ExtractedArticle = {
  source_id: string;
  original_url: string;
  canonical_url: string | null;
  slug: string;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
};

export type ArticleValidationResult =
  | {
      valid: true;
      article: ExtractedArticle;
    }
  | {
      valid: false;
      reason: string;
    };

export type ScrapeRunSummary = {
  status: "completed" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  totalDurationMs: number;
  rejectionReasons: Record<string, number>;
  insertedArticles?: Array<Pick<ArticleRow, "id" | "title" | "slug" | "original_url">>;
  error?: string;
};

