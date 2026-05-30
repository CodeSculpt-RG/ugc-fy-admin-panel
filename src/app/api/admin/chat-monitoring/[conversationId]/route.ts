import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";

export async function GET(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const check = await requirePermission(request, "moderation.read");
    if (!check.ok) return check.response;

    const params = await context.params;
    const conversationId = params.conversationId;

    const { data: messages, error } = await supabaseAdmin
      .from('admin_messages_view')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        // Table/view doesn't exist yet, return empty
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: messages || []
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: normalizeError(error) },
      { status: 500 }
    );
  }
}
