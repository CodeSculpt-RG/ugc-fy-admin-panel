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

    if (profile.role === "creator") {
      let data = null;
      try {
        const res = await supabaseAdmin
          .from("creator_profiles")
          .select("*")
          .eq("user_id", id)
          .single();
        data = res.data;
      } catch {
        // ignore fallback
      }
      if (data) {
        creator_profile = data;
      } else {
        try {
          const res = await supabaseAdmin
            .from("creator_profiles")
            .select("*")
            .eq("id", id)
            .single();
          if (res.data) creator_profile = res.data;
        } catch {
          // ignore fallback
        }
      }
    } else if (profile.role === "brand") {
      let data = null;
      try {
        const res = await supabaseAdmin
          .from("brand_profiles")
          .select("*")
          .eq("user_id", id)
          .single();
        data = res.data;
      } catch {
        // ignore fallback
      }
      if (data) {
        brand_profile = data;
      } else {
        try {
          const res = await supabaseAdmin
            .from("brand_profiles")
            .select("*")
            .eq("id", id)
            .single();
          if (res.data) brand_profile = res.data;
        } catch {
          // ignore fallback
        }
      }
    }

    // Fetch audit logs targeting this id
    let audit_logs = [];
    try {
      const { data: logs } = await supabaseAdmin
        .from("admin_audit_logs")
        .select("*, actor:admin_profiles(id, full_name, email)")
        .eq("target_id", id)
        .order("created_at", { ascending: false });
      if (logs) audit_logs = logs;
    } catch {
      // ignore audit log fetch failure if table or relationship has issues
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        profile,
        creator_profile,
        brand_profile,
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
