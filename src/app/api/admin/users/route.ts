import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { verifyAdmin } from "@/lib/api/verifyAdmin";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { data: users, error, count } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: users ?? [],
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/users]", normalizedError);
    return NextResponse.json(
      {
        success: false,
        source: "real_supabase_database",
        error: normalizedError,
      },
      { status: 500 }
    );
  }
}
