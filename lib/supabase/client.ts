import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function requiredPublicEnvironment(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}`);
  }

  return value;
}

export function createPublicSupabaseClient() {
  return createClient<Database>(
    requiredPublicEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredPublicEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
