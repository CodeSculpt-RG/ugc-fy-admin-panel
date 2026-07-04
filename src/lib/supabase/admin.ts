import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const resolvedSupabaseUrl: string = supabaseUrl || "http://localhost:54321";
const resolvedServiceRoleKey: string = serviceRoleKey || "missing_key";

export const supabaseAdmin = createClient(resolvedSupabaseUrl, resolvedServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const isSupabaseAdminConfigured = () => {
  return !!supabaseUrl && !!serviceRoleKey;
};
