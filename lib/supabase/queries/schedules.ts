import "server-only";

import { createServiceRoleSupabaseClient } from "../server";
import type {
  OxylabsScheduleInsert,
  OxylabsScheduleRow,
  OxylabsScheduleRunInsert,
  OxylabsScheduleRunRow,
} from "../types";

export async function getSchedules(): Promise<OxylabsScheduleRow[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("oxylabs_schedules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load Oxylabs schedules: ${error.message}`);
  }

  return data;
}

export async function upsertSchedule(
  schedule: OxylabsScheduleInsert,
): Promise<OxylabsScheduleRow> {
  const supabase = createServiceRoleSupabaseClient();
  const scheduleWithUpdatedTimestamp = {
    ...schedule,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("oxylabs_schedules")
    .upsert(scheduleWithUpdatedTimestamp, { onConflict: "source_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to persist Oxylabs schedule: ${error.message}`);
  }

  return data;
}

export async function getScheduleRuns(scheduleId?: string): Promise<OxylabsScheduleRunRow[]> {
  const supabase = createServiceRoleSupabaseClient();
  let query = supabase
    .from("oxylabs_schedule_runs")
    .select("*")
    .order("created_at", { ascending: false });

  if (scheduleId) {
    query = query.eq("schedule_id", scheduleId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load Oxylabs schedule runs: ${error.message}`);
  }

  return data;
}

export async function upsertScheduleRun(
  run: OxylabsScheduleRunInsert,
): Promise<OxylabsScheduleRunRow> {
  const supabase = createServiceRoleSupabaseClient();
  const runWithUpdatedTimestamp = {
    ...run,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("oxylabs_schedule_runs")
    .upsert(runWithUpdatedTimestamp, { onConflict: "schedule_id,job_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to persist Oxylabs schedule run: ${error.message}`);
  }

  return data;
}
