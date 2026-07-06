import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseEnv } from "./public-env";

export function createSupabaseServerClient(token?: string) {
  return createClient(publicSupabaseEnv.url, publicSupabaseEnv.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...(token
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      : {}),
  });
}
