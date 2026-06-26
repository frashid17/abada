import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { getEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  return createClient<Database>(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}

export function createServiceRoleSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
