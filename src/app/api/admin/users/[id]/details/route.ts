import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "users.read");
    if (!check.ok) return check.response;

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!id) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "User ID required" } },
        { status: 400 }
      );
    }

    // 1. Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, source: "real_supabase_database", error: { message: "Profile not found" } },
          { status: 404 }
        );
      }
      throw profileError;
    }

    let creator_profile = null;
    let brand_profile = null;
    let audit_logs: unknown[] = [];
    let kyc_submission = null;

    // Parallelize role profile fetch and audit logs fetch
    const roleFetchPromise = async () => {
      if (profile.role === "creator") {
        const { data } = await supabaseAdmin.from("creator_profiles").select("*").eq("user_id", id).single();
        if (data) return { type: 'creator', data };
        const { data: fallback } = await supabaseAdmin.from("creator_profiles").select("*").eq("id", id).single();
        return { type: 'creator', data: fallback };
      } else if (profile.role === "brand") {
        const { data } = await supabaseAdmin.from("brand_profiles").select("*").eq("user_id", id).single();
        if (data) return { type: 'brand', data };
        const { data: fallback } = await supabaseAdmin.from("brand_profiles").select("*").eq("id", id).single();
        return { type: 'brand', data: fallback };
      }
      return null;
    };

    const auditFetchPromise = async () => {
      const { data } = await supabaseAdmin
        .from("admin_audit_logs")
        .select("*, actor:admin_profiles(id, full_name, email)")
        .eq("target_id", id)
        .order("created_at", { ascending: false });
      return data || [];
    };

    const kycFetchPromise = async () => {
      const { data } = await supabaseAdmin
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    };

    const [roleResult, logsResult, kycResult] = await Promise.all([
      roleFetchPromise().catch(() => null),
      auditFetchPromise().catch(() => []),
      kycFetchPromise().catch(() => null)
    ]);

    if (roleResult?.type === 'creator') creator_profile = roleResult.data;
    if (roleResult?.type === 'brand') brand_profile = roleResult.data;
    if (logsResult) audit_logs = logsResult as unknown[];
    if (kycResult) kyc_submission = kycResult;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        profile,
        creator_profile,
        brand_profile,
        kyc_submission,
        audit_logs,
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[GET ${request.url}]`, normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
