import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function requiredServerEnvironment(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY",
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function createServiceRoleSupabaseClient() {
  return createClient<Database>(
    requiredServerEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredServerEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
