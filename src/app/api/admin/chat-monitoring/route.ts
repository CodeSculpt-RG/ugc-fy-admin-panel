import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "moderation.read");
    if (!check.ok) return check.response; 

    // we will fetch conversations
    const { data: conversations, error } = await supabaseAdmin
      .from("conversations")
      .select(`
        id,
        brand_id,
        creator_id,
        campaign_id,
        status,
        last_message_at,
        created_at
      `)
      .order("last_message_at", { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === '42703') {
        // Table or columns don't exist, return empty
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: conversations || []
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: normalizeError(error) },
      { status: 500 }
    );
  }
}
