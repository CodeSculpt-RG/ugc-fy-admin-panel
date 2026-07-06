import { supabaseAdmin } from "@/lib/supabase/admin";

export type SafeCountResult = {
  count: number;
  missing: boolean;
  error?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQueryBuilder = any;

export async function safeCount(
  table: string,
  queryBuilder?: (query: SupabaseQueryBuilder) => SupabaseQueryBuilder
): Promise<SafeCountResult> {
  let query = supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  
  if (queryBuilder) {
    query = queryBuilder(query);
  }

  const { count, error } = await query;

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return { count: 0, missing: true };
    }
    console.error(`[safeCount] Error counting ${table}:`, error);
    return { count: 0, missing: false, error: error.message };
  }

  return { count: count ?? 0, missing: false };
}
