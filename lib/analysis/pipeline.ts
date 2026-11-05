import "server-only";

import { createGoogle } from "@ai-sdk/google";
import { APICallError, generateText, Output } from "ai";
import { z } from "zod";

import {
  getPendingAnalysisArticles,
  insertArticleAnalysisAndMarkAnalyzed,
} from "@/lib/supabase/queries/articles";
import { insertLog } from "@/lib/supabase/queries/logs";
import type { ArticleRow } from "@/lib/supabase/types";

import { buildArticleAnalysisPrompt } from "./prompt";
import type {
  AnalysisArticleResult,
  AnalysisRequestOptions,
  AnalysisRunSummary,
  PersistedAnalysis,
  ValidatedAnalysisOutput,
} from "./types";

const DEFAULT_BATCH_SIZE = 5;
const MAX_BATCH_SIZE = 10;
const MAX_REQUEST_LIMIT = 100;
const MAX_MODEL_ATTEMPTS = 2;
const RETRYABLE_PROVIDER_STATUS_CODES = new Set([429, 500, 503]);
const RETRY_BASE_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 15_000;
const RETRY_JITTER_MS = 500;
const ANALYSIS_MODEL = "gemini-3.5-flash-lite";
const SENTIMENT_THRESHOLD = 0.15;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const MIXED_DIFFERENCE_THRESHOLD = 10;
const UNCLEAR_DIFFERENCE_THRESHOLD = 5;

const analysisOutputSchema = z.object({
  summary: z.string().trim().min(1).max(2_000),
  sentimentScore: z.number().min(-1).max(1),
  sentimentLabel: z.enum(["positive", "neutral", "negative"]),
  politicalFramingLabel: z.enum(["left", "center", "right", "mixed", "unclear"]),
  leftPercentage: z.number().min(0).max(100),
  centerPercentage: z.number().min(0).max(100),
  rightPercentage: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  framingNotes: z.string().trim().min(1).max(4_000),
  loadedTerms: z.array(z.string().trim().min(1).max(200)).max(40),
  disclaimer: z.string().trim().min(1).max(1_000),
});

function readGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    throw new Error("Missing required server environment variable: GEMINI_API_KEY");
  }

  return key;
}

function readBatchSize(): number {
  const parsed = Number.parseInt(process.env.ANALYSIS_BATCH_SIZE ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(parsed, MAX_BATCH_SIZE);
}

function normalizeRunLimit(limit: number | undefined): number | undefined {
  if (limit === undefined) {
    return undefined;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_REQUEST_LIMIT);
}

function getProviderStatusCode(error: unknown): number | null {
  if (APICallError.isInstance(error)) {
    return error.statusCode ?? null;
  }

  return null;
}

function isRetryableProviderError(error: unknown): boolean {
  const statusCode = getProviderStatusCode(error);
  return statusCode !== null && RETRYABLE_PROVIDER_STATUS_CODES.has(statusCode);
}

function getRetryDelayMs(attempt: number): number {
  const exponentialDelay = Math.min(
    RETRY_BASE_DELAY_MS * 2 ** (attempt - 1),
    RETRY_MAX_DELAY_MS,
  );

  return exponentialDelay + Math.floor(Math.random() * RETRY_JITTER_MS);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function roundPercentage(value: number): number {
  return Number(value.toFixed(2));
}

function expectedSentimentLabel(score: number): ValidatedAnalysisOutput["sentimentLabel"] {
  if (score >= SENTIMENT_THRESHOLD) {
    return "positive";
  }

  if (score <= -SENTIMENT_THRESHOLD) {
    return "negative";
  }

  return "neutral";
}

function assertFramingLabelMatches(output: ValidatedAnalysisOutput): void {
  const distribution = {
    left: output.leftPercentage,
    center: output.centerPercentage,
    right: output.rightPercentage,
  } as const;
  const sortedPercentages = Object.values(distribution).sort((first, second) => second - first);
  const highestPercentage = sortedPercentages[0];
  const differenceBetweenTopTwo = highestPercentage - sortedPercentages[1];

  if (
    output.politicalFramingLabel === "left" ||
    output.politicalFramingLabel === "center" ||
    output.politicalFramingLabel === "right"
  ) {
    if (distribution[output.politicalFramingLabel] !== highestPercentage) {
      throw new Error("Political framing label does not match the strongest percentage");
    }

    return;
  }

  if (output.politicalFramingLabel === "mixed" && differenceBetweenTopTwo > MIXED_DIFFERENCE_THRESHOLD) {
    throw new Error("Mixed framing requires the two strongest percentages to be close");
  }

  if (
    output.politicalFramingLabel === "unclear" &&
    output.confidence > LOW_CONFIDENCE_THRESHOLD &&
    differenceBetweenTopTwo > UNCLEAR_DIFFERENCE_THRESHOLD
  ) {
    throw new Error("Unclear framing requires low confidence or close percentages");
  }
}

function validateAnalysisOutput(
  candidate: unknown,
  article: Pick<ArticleRow, "title" | "raw_text">,
): ValidatedAnalysisOutput {
  const parsed = analysisOutputSchema.parse(candidate);
  const output: ValidatedAnalysisOutput = {
    ...parsed,
    leftPercentage: roundPercentage(parsed.leftPercentage),
    centerPercentage: roundPercentage(parsed.centerPercentage),
    rightPercentage: roundPercentage(parsed.rightPercentage),
    confidence: Number(parsed.confidence.toFixed(3)),
    loadedTerms: [...new Set(parsed.loadedTerms.map((term) => term.trim()))],
  };

  const percentageTotal = Number(
    (output.leftPercentage + output.centerPercentage + output.rightPercentage).toFixed(2),
  );

  if (percentageTotal !== 100) {
    throw new Error("Framing percentages must total exactly 100 after two-decimal normalization");
  }

  if (output.sentimentLabel !== expectedSentimentLabel(output.sentimentScore)) {
    throw new Error("Sentiment label does not match the sentiment score");
  }

  assertFramingLabelMatches(output);

  const articleText = `${article.title}\n${article.raw_text}`.toLocaleLowerCase();
  if (output.loadedTerms.some((term) => !articleText.includes(term.toLocaleLowerCase()))) {
    throw new Error("Loaded terms must appear in the supplied article text");
  }

  return output;
}

function safeFailureReason(error: unknown): string {
  if (error instanceof z.ZodError) {
    return "Structured output validation failed";
  }

  if (
    error instanceof Error &&
    [
      "Framing percentages must total",
      "Sentiment label does not match",
      "Political framing label does not match",
      "Mixed framing requires",
      "Unclear framing requires",
      "Loaded terms must appear",
    ].some((prefix) => error.message.startsWith(prefix))
  ) {
    return "Structured output validation failed";
  }

  return "Article analysis attempt failed";
}

function createPersistedAnalysis(articleId: string, output: ValidatedAnalysisOutput): PersistedAnalysis {
  return {
    article_id: articleId,
    summary: output.summary,
    sentiment_score: output.sentimentScore,
    sentiment_label: output.sentimentLabel,
    bias_score: (output.rightPercentage - output.leftPercentage) / 100,
    bias_label: output.politicalFramingLabel,
    left_percentage: output.leftPercentage,
    center_percentage: output.centerPercentage,
    right_percentage: output.rightPercentage,
    confidence: output.confidence,
    framing_notes: output.framingNotes,
    loaded_terms: output.loadedTerms,
    disclaimer: output.disclaimer,
    model: ANALYSIS_MODEL,
  };
}

async function writeLogSafely(
  event: string,
  message: string,
  context: Record<string, number | string | string[]>,
  articleId: string | null = null,
): Promise<void> {
  try {
    await insertLog({
      event,
      level: event.includes("failed") ? "error" : "info",
      message,
      source_id: null,
      article_id: articleId,
      context,
    });
  } catch (error) {
    console.error(`[Analysis] Failed to write ${event} log:`, error);
  }
}

async function analyzeArticle(
  article: ArticleRow,
  google: ReturnType<typeof createGoogle>,
): Promise<AnalysisArticleResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_MODEL_ATTEMPTS; attempt += 1) {
    try {
      const { output } = await generateText({
        model: google(ANALYSIS_MODEL),
        // The pipeline owns retry behavior so a failed article makes no more
        // than MAX_MODEL_ATTEMPTS provider calls.
        maxRetries: 0,
        output: Output.object({
          name: "ArticleAnalysis",
          description: "A structured language-and-framing analysis of one supplied news article.",
          schema: analysisOutputSchema,
        }),
        prompt: buildArticleAnalysisPrompt(article),
      });
      const validatedOutput = validateAnalysisOutput(output, article);

      await insertArticleAnalysisAndMarkAnalyzed(
        createPersistedAnalysis(article.id, validatedOutput),
      );

      return { status: "analyzed", articleId: article.id };
    } catch (error) {
      lastError = error;
      const canRetry = attempt < MAX_MODEL_ATTEMPTS && isRetryableProviderError(error);

      if (!canRetry) {
        console.warn(`[Analysis] Attempt ${attempt}/${MAX_MODEL_ATTEMPTS} failed for ${article.id}.`);
        break;
      }

      const delayMs = getRetryDelayMs(attempt);
      const statusCode = getProviderStatusCode(error);
      console.warn(
        `[Analysis] Attempt ${attempt}/${MAX_MODEL_ATTEMPTS} failed for ${article.id} with provider status ${statusCode}; retrying in ${delayMs}ms.`,
      );
      await delay(delayMs);
    }
  }

  const reason = safeFailureReason(lastError);
  return { status: "failed", articleId: article.id, reason };
}

export async function runArticleAnalysisPipeline(
  options: AnalysisRequestOptions = {},
): Promise<AnalysisRunSummary> {
  const startedAt = Date.now();
  const batchSize = readBatchSize();
  const runLimit = normalizeRunLimit(options.limit);
  const google = createGoogle({ apiKey: readGeminiApiKey() });
  const attemptedArticleIds = new Set<string>();
  const failureReasons: Record<string, number> = {};
  let requested = 0;
  let analyzed = 0;
  let skipped = 0;
  let failed = 0;
  let batches = 0;

  console.log(
    `[Analysis] Starting analysis run with batchSize=${batchSize}, limit=${runLimit ?? "all"}.`,
  );
  await writeLogSafely(
    "analysis_started",
    "Starting AI article analysis run",
    { batchSize, limit: runLimit ?? "all", articleIds: options.articleIds ?? [] },
  );

  while (runLimit === undefined || requested < runLimit) {
    const remaining = runLimit === undefined ? batchSize : Math.min(batchSize, runLimit - requested);
    const articles = await getPendingAnalysisArticles({
      limit: remaining,
      articleIds: options.articleIds,
      excludeArticleIds: [...attemptedArticleIds],
    });

    if (articles.length === 0) {
      break;
    }

    batches += 1;
    console.log(`[Analysis] Processing batch ${batches} with ${articles.length} article(s).`);
    let batchAnalyzed = 0;
    let batchSkipped = 0;
    let batchFailed = 0;

    for (const article of articles) {
      attemptedArticleIds.add(article.id);
      requested += 1;
      const result = await analyzeArticle(article, google);

      if (result.status === "analyzed") {
        analyzed += 1;
        batchAnalyzed += 1;
        console.log(`[Analysis] Analyzed article ${article.id}.`);
        continue;
      }

      if (result.status === "skipped") {
        skipped += 1;
        batchSkipped += 1;
        continue;
      }

      failed += 1;
      batchFailed += 1;
      failureReasons[result.reason] = (failureReasons[result.reason] ?? 0) + 1;
      console.error(`[Analysis] Failed to analyze article ${article.id}: ${result.reason}`);
      await writeLogSafely(
        "analysis_article_failed",
        "Article analysis failed after one retry",
        { reason: result.reason },
        article.id,
      );
    }

    console.log(
      `[Analysis] Batch ${batches} complete: analyzed=${batchAnalyzed}, skipped=${batchSkipped}, failed=${batchFailed}.`,
    );
  }

  const summary: AnalysisRunSummary = {
    status: "completed",
    requested,
    analyzed,
    skipped,
    failed,
    batches,
    totalDurationMs: Date.now() - startedAt,
    failureReasons,
  };

  console.log("[Analysis] Analysis pipeline summary:");
  console.log(JSON.stringify(summary, null, 2));
  await writeLogSafely(
    "analysis_completed",
    "AI article analysis run completed",
    {
      requested: summary.requested,
      analyzed: summary.analyzed,
      skipped: summary.skipped,
      failed: summary.failed,
      batches: summary.batches,
      totalDurationMs: summary.totalDurationMs,
    },
  );

  return summary;
}
