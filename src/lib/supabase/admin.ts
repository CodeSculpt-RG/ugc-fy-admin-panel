import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Infrastructure Failure: NEXT_PUBLIC_SUPABASE_URL is not defined in the environment.");
}

if (!serviceRoleKey) {
  throw new Error("Security Failure: SUPABASE_SERVICE_ROLE_KEY is not defined. Administrative operations restricted.");
}

const resolvedSupabaseUrl: string = supabaseUrl;
const resolvedServiceRoleKey: string = serviceRoleKey;

export const supabaseAdmin = createClient(resolvedSupabaseUrl, resolvedServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
