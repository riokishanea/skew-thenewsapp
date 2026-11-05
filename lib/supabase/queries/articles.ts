import "server-only";

import { createServiceRoleSupabaseClient } from "../server";
import type {
  ArticleAnalysisInsert,
  ArticleAnalysisRow,
  ArticleInsert,
  ArticleRow,
  SourceRow,
} from "../types";

const URL_QUERY_CHUNK_SIZE = 15;
const DEFAULT_HOME_ARTICLE_LIMIT = 24;
const MAX_HOME_ARTICLE_LIMIT = 60;

export type ArticleDetails = {
  article: ArticleRow;
  source: SourceRow;
  analysis: ArticleAnalysisRow | null;
};

export type PublishedArticle = {
  article: ArticleRow;
  source: SourceRow;
  analysis: ArticleAnalysisRow;
};

export type PendingAnalysisArticle = ArticleRow;

export type PendingAnalysisOptions = {
  limit: number;
  articleIds?: readonly string[];
  excludeArticleIds?: readonly string[];
};

type ArticleWithAnalysisRelation = ArticleRow & {
  article_analyses: Array<Pick<ArticleAnalysisRow, "id">> | null;
};

function chunk<T>(items: readonly T[], size: number): T[][] {
  const groups: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }

  return groups;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_HOME_ARTICLE_LIMIT;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_HOME_ARTICLE_LIMIT);
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetails | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (articleError) {
    throw new Error(`Failed to load article ${slug}: ${articleError.message}`);
  }

  if (!article) {
    return null;
  }

  const [sourceResult, analysisResult] = await Promise.all([
    supabase.from("sources").select("*").eq("id", article.source_id).single(),
    supabase
      .from("article_analyses")
      .select("*")
      .eq("article_id", article.id)
      .maybeSingle(),
  ]);

  if (sourceResult.error) {
    throw new Error(`Failed to load source for article ${slug}: ${sourceResult.error.message}`);
  }

  if (analysisResult.error) {
    throw new Error(`Failed to load analysis for article ${slug}: ${analysisResult.error.message}`);
  }

  return {
    article,
    source: sourceResult.data,
    analysis: analysisResult.data,
  };
}

export async function getPublishedArticles(limit?: number): Promise<PublishedArticle[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("*")
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(normalizeLimit(limit));

  if (articlesError) {
    throw new Error(`Failed to load published articles: ${articlesError.message}`);
  }

  if (articles.length === 0) {
    return [];
  }

  const articleIds = articles.map((article) => article.id);
  const sourceIds = [...new Set(articles.map((article) => article.source_id))];
  const [sourcesResult, analysesResult] = await Promise.all([
    supabase.from("sources").select("*").in("id", sourceIds),
    supabase.from("article_analyses").select("*").in("article_id", articleIds),
  ]);

  if (sourcesResult.error) {
    throw new Error(`Failed to load article sources: ${sourcesResult.error.message}`);
  }

  if (analysesResult.error) {
    throw new Error(`Failed to load article analyses: ${analysesResult.error.message}`);
  }

  const sourcesById = new Map(sourcesResult.data.map((source) => [source.id, source]));
  const analysesByArticleId = new Map(
    analysesResult.data.map((analysis) => [analysis.article_id, analysis]),
  );

  return articles.flatMap((article) => {
    const source = sourcesById.get(article.source_id);
    const analysis = analysesByArticleId.get(article.id);

    return source && analysis ? [{ article, source, analysis }] : [];
  });
}

export async function findExistingArticleUrls(urls: readonly string[]): Promise<Set<string>> {
  const uniqueUrls = [...new Set(urls.filter((url) => url.length > 0))];

  if (uniqueUrls.length === 0) {
    return new Set();
  }

  const supabase = createServiceRoleSupabaseClient();
  const existingUrls = new Set<string>();

  for (const urlChunk of chunk(uniqueUrls, URL_QUERY_CHUNK_SIZE)) {
    const [originalResult, canonicalResult] = await Promise.all([
      supabase.from("articles").select("original_url").in("original_url", urlChunk),
      supabase.from("articles").select("canonical_url").in("canonical_url", urlChunk),
    ]);

    if (originalResult.error) {
      throw new Error(`Failed to check existing article URLs: ${originalResult.error.message}`);
    }

    if (canonicalResult.error) {
      throw new Error(`Failed to check canonical article URLs: ${canonicalResult.error.message}`);
    }

    for (const row of originalResult.data) {
      existingUrls.add(row.original_url);
    }

    for (const row of canonicalResult.data) {
      if (row.canonical_url) {
        existingUrls.add(row.canonical_url);
      }
    }
  }

  return existingUrls;
}

export async function insertArticle(article: ArticleInsert): Promise<ArticleRow> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("articles").insert(article).select("*").single();

  if (error) {
    throw new Error(`Failed to insert article: ${error.message}`);
  }

  return data;
}

export async function getPendingAnalysisArticles({
  limit,
  articleIds,
  excludeArticleIds,
}: PendingAnalysisOptions): Promise<PendingAnalysisArticle[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, article_analyses(id)")
    .order("scraped_at", { ascending: true })
    .overrideTypes<ArticleWithAnalysisRelation[]>();

  if (error) {
    throw new Error(`Failed to load pending analysis articles: ${error.message}`);
  }

  // This is deliberately a LEFT JOIN followed by a JavaScript filter. It does not
  // rely on analyzed_at, which can be set while an analysis row is absent.
  const selectedArticleIds = articleIds ? new Set(articleIds) : null;
  const excludedArticleIds = new Set(excludeArticleIds);

  return data
    .filter(
      (article) =>
        (article.article_analyses?.length ?? 0) === 0 &&
        (selectedArticleIds === null || selectedArticleIds.has(article.id)) &&
        !excludedArticleIds.has(article.id),
    )
    .slice(0, Math.max(Math.floor(limit), 1))
    .map(({ article_analyses: articleAnalyses, ...article }) => {
      void articleAnalyses;
      return article;
    });
}

export async function insertArticleAnalysisAndMarkAnalyzed(
  analysis: ArticleAnalysisInsert,
): Promise<ArticleAnalysisRow> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("article_analyses")
    .insert(analysis)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert article analysis: ${error.message}`);
  }

  // The write order guarantees analyzed_at is only set after a valid analysis row
  // exists. A future RPC can make these two writes fully transactional.
  const { error: updateError } = await supabase
    .from("articles")
    .update({ analyzed_at: new Date().toISOString() })
    .eq("id", analysis.article_id);

  if (updateError) {
    throw new Error(`Analysis saved, but failed to mark article as analyzed: ${updateError.message}`);
  }

  return data;
}
