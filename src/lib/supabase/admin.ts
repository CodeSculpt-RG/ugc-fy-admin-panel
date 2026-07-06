import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./public-env";
import { serverSupabaseEnv } from "./server-env";

export const supabaseAdmin = createClient(
  publicSupabaseEnv.url,
  serverSupabaseEnv.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const isSupabaseAdminConfigured = () => {
  return !!publicSupabaseEnv.url && !!serverSupabaseEnv.serviceRoleKey;
};
