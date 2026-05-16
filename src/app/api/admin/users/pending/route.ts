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

    const { data: creatorPending, error: cError } = await supabaseAdmin
      .from("creator_profiles")
      .select("user_id")
      .eq("kyc_status", "pending");
      
    if (cError) throw cError;

    const { data: brandPending, error: bError } = await supabaseAdmin
      .from("brand_profiles")
      .select("user_id")
      .eq("kyc_status", "pending");
      
    if (bError) throw bError;

    const pendingIds = [
      ...(creatorPending?.map(p => p.user_id) || []),
      ...(brandPending?.map(p => p.user_id) || [])
    ];

    let users: any[] = [];
    if (pendingIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .in("id", pendingIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map to expected frontend format
      users = (data || []).map(u => ({
        ...u,
        full_name: u.name,
        approval_status: 'pending_review'
      }));
    }

    const count = users.length;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: users ?? [],
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/users/pending]", normalizedError);
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
