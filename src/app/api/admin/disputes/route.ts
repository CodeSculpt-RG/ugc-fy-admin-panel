import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "disputes.read");
    if (!check.ok) return check.response;

    const { data, error } = await supabaseAdmin
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const isMissing = error.code === "PGRST205" || error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("Could not find the table");
      if (isMissing) {
        // Notify PostgREST
        try {
          await supabaseAdmin.rpc("notify_pgrst");
        } catch {
          // ignore
        }
        
        return NextResponse.json({
          success: true,
          source: "real_supabase_database",
          isMissingTable: true,
          tableName: "disputes",
          migrationSql: "-- Create disputes table\nCREATE TABLE IF NOT EXISTS public.disputes (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),\n  creator_id uuid NOT NULL REFERENCES public.profiles(id),\n  brand_id uuid NOT NULL REFERENCES public.profiles(id),\n  type text NOT NULL CHECK (type IN ('Payment', 'Content', 'Refund', 'Fraud', 'Deadline')),\n  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),\n  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Resolved', 'Closed')),\n  assigned_admin_id uuid REFERENCES auth.users(id),\n  resolution_notes text,\n  opened_date timestamptz DEFAULT now(),\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);",
          data: [],
          count: 0,
        });
      }
      throw error;
    }

    const records = data ?? [];

    const profileIds = Array.from(
      new Set(
        records
          .flatMap((r) => [r.brand_id, r.creator_id])
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    let profiles: Array<{ id: string; email: string | null; full_name: string | null }> = [];
    if (profileIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", profileIds);
      if (profs) profiles = profs;
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const campaignIds = Array.from(
      new Set(
        records
          .map((r) => r.campaign_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    let campaigns: Array<{ id: string; title: string }> = [];
    if (campaignIds.length > 0) {
      const { data: camps } = await supabaseAdmin
        .from("campaigns")
        .select("id, title")
        .in("id", campaignIds);
      if (camps) campaigns = camps;
    }
    const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

    const formattedData = records.map((r) => {
      const brandProf = r.brand_id ? profileMap.get(r.brand_id) : null;
      const creatorProf = r.creator_id ? profileMap.get(r.creator_id) : null;
      const campObj = r.campaign_id ? campaignMap.get(r.campaign_id) : null;

      const typeStr = String(r.type || "Content");
      const priorityStr = String(r.priority || "Medium");
      const statusStr = String(r.status || "Open");

      return {
        id: String(r.id || "unknown"),
        creator: creatorProf?.full_name || creatorProf?.email || "Unknown Creator",
        brand: brandProf?.full_name || brandProf?.email || "Unknown Brand",
        creatorId: r.creator_id ? String(r.creator_id) : undefined,
        brandId: r.brand_id ? String(r.brand_id) : undefined,
        campaign: campObj?.title || `Campaign ID_${String(r.campaign_id || "unknown").slice(0, 8)}`,
        type: ["Payment", "Content", "Refund", "Fraud", "Deadline"].includes(typeStr) ? (typeStr as "Payment" | "Content" | "Refund" | "Fraud" | "Deadline") : "Content",
        priority: ["Low", "Medium", "High", "Critical"].includes(priorityStr) ? (priorityStr as "Low" | "Medium" | "High" | "Critical") : "Medium",
        status: ["Open", "In Review", "Resolved", "Closed"].includes(statusStr) ? (statusStr as "Open" | "In Review" | "Resolved" | "Closed") : "Open",
        openedDate: r.opened_date || r.created_at ? new Date(r.opened_date || r.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "Just now",
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: formattedData,
      count: formattedData.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/disputes]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const check = await requirePermission(request, "disputes.write");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { targetEmailOrId, type, priority, description } = body;

    if (!targetEmailOrId || !type || !description) {
      return NextResponse.json(
        { success: false, error: "Validation Failure: Target identifier, dispute type, and description are required." },
        { status: 400 }
      );
    }

    // Lookup user in public.profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .or(`email.eq.${targetEmailOrId},id.eq.${targetEmailOrId}`)
      .limit(1)
      .maybeSingle();

    // Lookup any active campaign to link
    const { data: campaign } = await supabaseAdmin
      .from("campaigns")
      .select("id, brand_id")
      .limit(1)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Infrastructure State Error: No active campaigns exist in the database to link to this dispute case." },
        { status: 400 }
      );
    }

    let creatorId = check.admin.id;
    let brandId = campaign.brand_id;

    if (profile) {
      if (profile.role === "creator") {
        creatorId = profile.id;
      } else {
        brandId = profile.id;
      }
    }

    const { data: dispute, error } = await supabaseAdmin
      .from("disputes")
      .insert({
        campaign_id: campaign.id,
        creator_id: creatorId,
        brand_id: brandId,
        type,
        priority: priority || "Medium",
        status: "Open",
        resolution_notes: description,
        assigned_admin_id: check.admin.id,
      })
      .select()
      .single();

    if (error) throw error;

    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `dispute.open`,
      targetType: "dispute",
      targetId: dispute.id,
      metadata: { targetEmailOrId, type, priority },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      message: "Dispute case opened successfully.",
      data: dispute,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[POST /api/admin/disputes]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
