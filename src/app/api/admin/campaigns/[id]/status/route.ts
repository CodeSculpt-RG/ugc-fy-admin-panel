import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/admin-auth";
import { normalizeError } from "@/lib/api/normalizeError";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, "campaigns:write");

    const { id } = await params;
    const body = await request.json();

    const allowedStatuses = ["Draft", "Pending", "Active", "Paused", "Completed", "Rejected", "Disputed"];
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid campaign status requested." } },
        { status: 400 }
      );
    }

    const { data: campaign, error } = await supabaseAdmin
      .from("campaigns")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !campaign) {
      throw error || new Error("Failed to update campaign status.");
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: campaign,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[PATCH /api/admin/campaigns/[id]/status]`, normalizedError);
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
