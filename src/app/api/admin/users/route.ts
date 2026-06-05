import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "users.read");
    if (!check.ok) return check.response;

    const { data: profiles, error, count } = await supabaseAdmin
      .from("profiles")
      .select(`
        id, 
        email, 
        phone,
        full_name, 
        avatar_url, 
        role, 
        approval_status, 
        profile_completed,
        kyc_status,
        is_verified,
        created_at, 
        updated_at,
        platform_id,
        is_visible_publicly,
        brand_profiles!brand_profiles_profile_id_fkey(*),
        creator_profiles!creator_profiles_id_fkey(*)
      `, { count: "exact" })
      .in('role', ['brand', 'creator'])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedUsers = (profiles ?? []).map(u => {

      return {
        id: u.id,
        platform_id: u.platform_id,
        full_name: u.full_name,
        username: u.email ? u.email.split('@')[0] : null,
        email: u.email,
        role: u.role,
        approval_status: u.approval_status,
        is_visible_publicly: u.is_visible_publicly,
        kyc_status: u.kyc_status,
        created_at: u.created_at,
        updated_at: u.updated_at,
        
        // Pass these so getDisplayName in frontend doesn't break if it expects it
        brand_profiles: u.brand_profiles,
        creator_profiles: u.creator_profiles
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: mappedUsers,
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/users]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
