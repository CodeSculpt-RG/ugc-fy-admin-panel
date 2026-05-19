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

    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !payment) {
      throw error || new Error("Failed to process payment release.");
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: payment,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[POST /api/admin/payments/[id]/release]`, normalizedError);
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
