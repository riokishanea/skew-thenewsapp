import type { ArticleAnalysisInsert } from "@/lib/supabase/types";

export type AnalysisRequestOptions = {
  articleIds?: string[];
  limit?: number;
};

export type ValidatedAnalysisOutput = {
  summary: string;
  sentimentScore: number;
  sentimentLabel: "positive" | "neutral" | "negative";
  politicalFramingLabel: "left" | "center" | "right" | "mixed" | "unclear";
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  confidence: number;
  framingNotes: string;
  loadedTerms: string[];
  disclaimer: string;
};

export type AnalysisArticleResult =
  | { status: "analyzed"; articleId: string }
  | { status: "failed"; articleId: string; reason: string }
  | { status: "skipped"; articleId: string; reason: string };

export type AnalysisRunSummary = {
  status: "completed";
  requested: number;
  analyzed: number;
  skipped: number;
  failed: number;
  batches: number;
  totalDurationMs: number;
  failureReasons: Record<string, number>;
};

export type PersistedAnalysis = ArticleAnalysisInsert;
