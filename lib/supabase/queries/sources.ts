import "server-only";

import { createServiceRoleSupabaseClient } from "../server";
import type { SourceRow } from "../types";

export async function getActiveSources(): Promise<SourceRow[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load active sources: ${error.message}`);
  }

  return data;
}

export async function getSourceById(sourceId: string): Promise<SourceRow | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("id", sourceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load source ${sourceId}: ${error.message}`);
  }

  return data;
}
