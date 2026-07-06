import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./public-env";

export const supabase = createClient(
  publicSupabaseEnv.url,
  publicSupabaseEnv.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "ugc-fy-admin-auth",
    },
  }
);

export const supabaseBrowserClient = supabase;
