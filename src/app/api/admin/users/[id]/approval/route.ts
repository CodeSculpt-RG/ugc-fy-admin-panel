import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { verifyAdmin } from "@/lib/api/verifyAdmin";

export async function PATCH(
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
    const body = await request.json();
    const { status, reason } = body;

    if (!['approved', 'rejected', 'blocked', 'pending_review'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid approval status protocol." },
        { status: 400 }
      );
    }

    // Get user role
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", id)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const isBlocked = status === 'blocked';
    
    // Update active status
    const { error: usersUpdateError } = await supabaseAdmin
      .from("users")
      .update({ is_active: !isBlocked })
      .eq("id", id);
      
    if (usersUpdateError) throw usersUpdateError;

    // Determine KYC status
    let kycStatus = 'pending';
    if (status === 'approved') kycStatus = 'approved';
    else if (status === 'rejected') kycStatus = 'rejected';
    
    let profileData: Record<string, unknown> = {};

    if (!isBlocked && ['approved', 'rejected', 'pending_review'].includes(status)) {
      const updateData: Record<string, unknown> = {
        kyc_status: kycStatus,
        updated_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.kyc_verified_at = new Date().toISOString();
      }

      const table = user.role === 'creator' ? 'creator_profiles' : 'brand_profiles';
      
      const { data, error } = await supabaseAdmin
        .from(table)
        .update(updateData)
        .eq("user_id", id)
        .select()
        .single();

      if (error) throw error;
      profileData = data;
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: profileData,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[PATCH /api/admin/users/[id]/approval]", normalizedError);
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
