import { NextResponse } from "next/server";
import { requireOwner, normalizeEmail } from "@/lib/auth/admin-auth";
import { isOwnerEmail } from "@/lib/auth/admin-types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAdminSecurityEvent } from "@/lib/auth/admin-security";
import { getRequestIp, getUserAgent } from "@/lib/auth/admin-auth";

type BanType = "email" | "ip";
type BanSeverity = "temporary" | "permanent";

type CreateBanRequestBody = {
  ban_type?: BanType;
  value?: string;
  reason?: string;
  severity?: BanSeverity;
  durationMinutes?: number | string;
};

export async function GET(request: Request) {
  try {
    await requireOwner(request);

    const { data: bans, error } = await supabaseAdmin
      .from("admin_bans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/security/bans] DB error:", error);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, success: true, data: bans ?? [] });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Owner authorization required.";
    console.error("[GET /api/admin/security/bans] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request);
    const ip = getRequestIp(request);
    const userAgent = getUserAgent(request);

    const body = (await request.json().catch(() => ({}))) as CreateBanRequestBody;
    const { ban_type, value, reason, severity, durationMinutes } = body;

    if (!ban_type || !value) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", message: "ban_type and value are required." },
        { status: 400 }
      );
    }

    if (ban_type !== "email" && ban_type !== "ip") {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", message: "ban_type must be either 'email' or 'ip'." },
        { status: 400 }
      );
    }

    let val = value.trim();

    // 1. Safeguards: Owner account protection from bans
    if (ban_type === "email") {
      val = normalizeEmail(val);
      if (isOwnerEmail(val)) {
        return NextResponse.json(
          {
            ok: false,
            error: "FORBIDDEN",
            message: "Security Protocol Violation: Banning the primary owner account is prohibited.",
          },
          { status: 403 }
        );
      }
    }

    let bannedUntil: string | null = null;
    if (severity === "temporary") {
      const minutes = typeof durationMinutes === "number"
        ? durationMinutes
        : durationMinutes
        ? parseInt(durationMinutes, 10)
        : 30;
      bannedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    }

    // 2. Upsert ban
    const { data: banRow, error: dbErr } = await supabaseAdmin
      .from("admin_bans")
      .upsert(
        {
          ban_type,
          value: val,
          reason: reason || "Manual ban by platform owner",
          severity: severity || "temporary",
          banned_until: bannedUntil,
          banned_by: owner.id,
          created_at: new Date().toISOString(),
        },
        { onConflict: "ban_type,value" }
      )
      .select()
      .single();

    if (dbErr || !banRow) {
      console.error("[POST /api/admin/security/bans] DB error:", dbErr);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: dbErr?.message || "Failed to create ban." },
        { status: 500 }
      );
    }

    // 3. Log event
    await logAdminSecurityEvent({
      adminUserId: owner.id,
      email: ban_type === "email" ? val : null,
      ipAddress: ip,
      userAgent,
      eventType: ban_type === "email" ? "admin_email_banned" : "admin_ip_banned",
      severity: "critical",
      metadata: { banId: banRow.id, reason, severity, bannedUntil, targetValue: val },
    });

    return NextResponse.json({ ok: true, success: true, data: banRow });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Access Denied: Owner authorization required.";
    console.error("[POST /api/admin/security/bans] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}
