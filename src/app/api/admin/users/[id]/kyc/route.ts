import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requirePermission(request, "kyc.read");
    if (!check.ok) return check.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "User ID required" } },
        { status: 400 }
      );
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, role, approval_status, kyc_status")
      .eq("id", id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, source: "real_supabase_database", error: { message: "Profile not found" } },
        { status: 404 }
      );
    }

    const user = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      user_type: profile.role,
      status: profile.kyc_status || profile.approval_status,
    };

    // 2. Fetch latest KYC submission
    const { data: kycData, error: kycError } = await supabaseAdmin
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kycError && kycError.code !== 'PGRST116') {
      console.error("[GET KYC] Error fetching submission:", kycError);
    }

    // 3. Fetch Media and Generate Signed URLs
    let media: Record<string, unknown>[] = [];
    if (kycData && check.admin.permissions.includes("kyc.media.read")) {
      const { data: mediaData } = await supabaseAdmin
        .from("kyc_media")
        .select("*")
        .eq("kyc_submission_id", kycData.id);

      if (mediaData && mediaData.length > 0) {
        media = await Promise.all(mediaData.map(async (m) => {
          // Generate signed URL (expires in 15 mins)
          const { data: urlData } = await supabaseAdmin
            .storage
            .from(m.storage_bucket)
            .createSignedUrl(m.storage_path, 60 * 15);
            
          return {
            id: m.id,
            media_type: m.media_type,
            label: m.label,
            mime_type: m.mime_type,
            file_size_bytes: m.file_size_bytes,
            storage_bucket: m.storage_bucket,
            storage_path: m.storage_path,
            signed_url: urlData?.signedUrl ?? null
          };
        }));
      }
    }

    // 4. Fetch History
    let history: Record<string, unknown>[] = [];
    if (check.admin.permissions.includes("kyc.history.read")) {
      const { data: historyData } = await supabaseAdmin
        .from("kyc_review_events")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
        
      if (historyData) {
        history = historyData.map((h) => ({
          id: h.id,
          action: h.action,
          before_status: h.before_status,
          after_status: h.after_status,
          reason: h.reason,
          metadata: h.metadata,
          created_at: h.created_at,
          admin_id: h.admin_id
        }));
      }
    }

    return NextResponse.json({
      ok: true,
      user,
      kyc: kycData || null,
      media,
      history
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[GET /api/admin/users/[id]/kyc]`, normalizedError);
    return NextResponse.json(
      { ok: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
