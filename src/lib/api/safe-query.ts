import type { PostgrestError } from "@supabase/supabase-js";

type QueryError = Pick<PostgrestError, "code" | "message" | "details" | "hint">;

type SafeQueryResponse<T> = {
  data: T | null;
  error: QueryError | null;
};

export type SafeQueryResult<T> =
  | {
      ok: true;
      data: T;
      missing: false;
    }
  | {
      ok: true;
      data: T;
      missing: true;
      missingTable: string;
    }
  | {
      ok: false;
      data: T;
      missing: false;
      error: string;
    };

export function isMissingOptionalTableError(error: QueryError): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message.includes("schema cache") ||
    error.message.includes("does not exist")
  );
}

export async function safeQuery<T>(
  tableName: string,
  fallbackData: T,
  query: PromiseLike<SafeQueryResponse<T>>
): Promise<SafeQueryResult<T>> {
  const { data, error } = await query;

  if (!error) {
    return {
      ok: true,
      data: data ?? fallbackData,
      missing: false,
    };
  }

  if (isMissingOptionalTableError(error)) {
    return {
      ok: true,
      data: fallbackData,
      missing: true,
      missingTable: tableName,
    };
  }

  return {
    ok: false,
    data: fallbackData,
    missing: false,
    error: error.message,
  };
}
