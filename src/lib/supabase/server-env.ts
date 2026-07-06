import "server-only";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  throw new Error("Infrastructure Failure: SUPABASE_SERVICE_ROLE_KEY is not defined.");
}

export const serverSupabaseEnv = {
  serviceRoleKey,
};
