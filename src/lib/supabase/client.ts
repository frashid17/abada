"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function useSupabaseClient(): SupabaseClient<Database> {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient<Database>(supabaseUrl, supabaseAnonKey, {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }),
    [session],
  );
}
