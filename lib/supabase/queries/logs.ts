import "server-only";

import { createServiceRoleSupabaseClient } from "../server";
import type { LogInsert, LogRow } from "../types";

export async function insertLog(log: LogInsert): Promise<LogRow> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("logs").insert(log).select("*").single();

  if (error) {
    throw new Error(`Failed to insert pipeline log: ${error.message}`);
  }

  return data;
}
