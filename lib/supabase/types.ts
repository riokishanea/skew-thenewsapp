export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type SourceRow = {
  id: string;
  name: string;
  listing_url: string;
  parser_strategy: string | null;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleRow = {
  id: string;
  source_id: string;
  original_url: string;
  canonical_url: string | null;
  slug: string;
  title: string;
  image_url: string;
  published_at: string;
  raw_text: string;
  scraped_at: string;
  analyzed_at: string | null;
  created_at: string;
};

export type ArticleAnalysisRow = {
  id: string;
  article_id: string;
  summary: string;
  sentiment_score: number;
  sentiment_label: "positive" | "neutral" | "negative";
  bias_score: number;
  bias_label: "left" | "center" | "right" | "mixed" | "unclear";
  left_percentage: number;
  center_percentage: number;
  right_percentage: number;
  confidence: number;
  framing_notes: string;
  loaded_terms: Json;
  disclaimer: string;
  model: string;
  created_at: string;
  updated_at: string;
};

export type LogRow = {
  id: string;
  event: string;
  level: "info" | "warning" | "error";
  message: string;
  source_id: string | null;
  article_id: string | null;
  context: Json;
  created_at: string;
};

export type OxylabsScheduleRow = {
  id: string;
  source_id: string;
  schedule_id: string;
  is_enabled: boolean;
  cadence: string;
  state: string | null;
  payload: Json;
  created_at: string;
  updated_at: string;
};

export type OxylabsScheduleRunRow = {
  id: string;
  schedule_id: string;
  oxylabs_run_id: string | null;
  job_id: string;
  status: string;
  result_status: string | null;
  result_metadata: Json;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      sources: Table<SourceRow, Omit<SourceRow, "id" | "created_at" | "updated_at"> & Partial<Pick<SourceRow, "id" | "created_at" | "updated_at" | "parser_strategy" | "logo_url" | "is_active">>, Partial<Omit<SourceRow, "id" | "created_at">>>;
      articles: Table<ArticleRow, Omit<ArticleRow, "id" | "created_at" | "scraped_at" | "analyzed_at" | "canonical_url"> & Partial<Pick<ArticleRow, "id" | "created_at" | "scraped_at" | "analyzed_at" | "canonical_url">>, Partial<Omit<ArticleRow, "id" | "created_at" | "source_id" | "original_url">>>;
      article_analyses: Table<ArticleAnalysisRow, Omit<ArticleAnalysisRow, "id" | "created_at" | "updated_at"> & Partial<Pick<ArticleAnalysisRow, "id" | "created_at" | "updated_at">>, Partial<Omit<ArticleAnalysisRow, "id" | "article_id" | "created_at">>>;
      logs: Table<LogRow, Omit<LogRow, "id" | "created_at" | "source_id" | "article_id" | "context" | "level"> & Partial<Pick<LogRow, "id" | "created_at" | "source_id" | "article_id" | "context" | "level">>, Partial<Omit<LogRow, "id" | "created_at">>>;
      oxylabs_schedules: Table<OxylabsScheduleRow, Omit<OxylabsScheduleRow, "id" | "created_at" | "updated_at" | "state" | "payload" | "is_enabled" | "cadence"> & Partial<Pick<OxylabsScheduleRow, "id" | "created_at" | "updated_at" | "state" | "payload" | "is_enabled" | "cadence">>, Partial<Omit<OxylabsScheduleRow, "id" | "created_at" | "source_id" | "schedule_id">>>;
      oxylabs_schedule_runs: Table<OxylabsScheduleRunRow, Omit<OxylabsScheduleRunRow, "id" | "created_at" | "updated_at" | "oxylabs_run_id" | "result_status" | "result_metadata" | "started_at" | "finished_at"> & Partial<Pick<OxylabsScheduleRunRow, "id" | "created_at" | "updated_at" | "oxylabs_run_id" | "result_status" | "result_metadata" | "started_at" | "finished_at">>, Partial<Omit<OxylabsScheduleRunRow, "id" | "created_at" | "schedule_id" | "job_id">>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
export type ArticleAnalysisInsert = Database["public"]["Tables"]["article_analyses"]["Insert"];
export type LogInsert = Database["public"]["Tables"]["logs"]["Insert"];
export type OxylabsScheduleInsert = Database["public"]["Tables"]["oxylabs_schedules"]["Insert"];
export type OxylabsScheduleRunInsert = Database["public"]["Tables"]["oxylabs_schedule_runs"]["Insert"];
