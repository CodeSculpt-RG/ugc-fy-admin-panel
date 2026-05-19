import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const { data: record, error } = await supabaseAdmin
      .from("disputes")
      .update({ status: "Resolved", resolution_notes: body.resolution || "Resolved by administrative ruling", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !record) {
      throw error || new Error("Failed to resolve dispute.");
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: record,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[POST /api/admin/disputes/[id]/resolve]`, normalizedError);
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
