import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const result = await verifyAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, source: "admin_auth", error: result.error },
        { status: result.status }
      );
    }

    const params = await context.params;
    const notificationId = params.id;
    if (!notificationId) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "Notification ID is required." } },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[PATCH /api/admin/notifications/[id]/read]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
