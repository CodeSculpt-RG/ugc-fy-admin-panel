import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/admin-auth";
import { normalizeError } from "@/lib/api/normalizeError";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, "finance:write");

    const { id } = await params;

    const { data: record, error } = await supabaseAdmin
      .from("escrow_records")
      .update({ status: "Held", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !record) {
      throw error || new Error("Failed to freeze escrow funds.");
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: record,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[POST /api/admin/escrow/[id]/freeze]`, normalizedError);
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
