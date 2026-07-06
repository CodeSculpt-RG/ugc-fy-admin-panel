import { supabaseAdmin } from "@/lib/supabase/admin";
import { isOwnerEmail } from "./admin-types";

export async function logAdminSecurityEvent(params: {
  adminUserId?: string | null;
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  eventType: string;
  severity?: "info" | "warning" | "critical";
  metadata?: Record<string, unknown>;
}) {
  try {
    const { error } = await supabaseAdmin.from("admin_security_events").insert({
      admin_user_id: params.adminUserId || null,
      email: params.email ? params.email.toLowerCase().trim() : null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      event_type: params.eventType,
      severity: params.severity || "info",
      metadata: params.metadata || {},
    });

    if (error) {
      console.error("[logAdminSecurityEvent] Failed to insert security log:", error);
    }
  } catch (err) {
    console.error("[logAdminSecurityEvent] Unexpected error inserting security log:", err);
  }
}

export async function isEmailOrIpBanned(
  email: string | null,
  ip: string | null
): Promise<{ banned: boolean; reason: string | null }> {
  try {
    if (email && isOwnerEmail(email)) {
      return { banned: false, reason: null };
    }
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    // Query active bans
    const { data: bans, error } = await supabaseAdmin
      .from("admin_bans")
      .select("*")
      .or(
        `and(ban_type.eq.email,value.eq.${normalizedEmail || "null"}),and(ban_type.eq.ip,value.eq.${ip || "null"})`
      );

    if (error) {
      console.error("[isEmailOrIpBanned] Error reading bans:", error);
      return { banned: false, reason: null };
    }

    if (!bans || bans.length === 0) {
      return { banned: false, reason: null };
    }

    // Check if any ban is active (permanent, or temporary and not expired yet)
    for (const ban of bans) {
      if (ban.severity === "permanent") {
        return { banned: true, reason: ban.reason || "Banned permanently" };
      }
      if (ban.banned_until && new Date(ban.banned_until) > new Date()) {
        return { banned: true, reason: `${ban.reason || "Banned temporarily"} until ${new Date(ban.banned_until).toLocaleString()}` };
      }
    }

    return { banned: false, reason: null };
  } catch (err) {
    console.error("[isEmailOrIpBanned] Exception checking bans:", err);
    return { banned: false, reason: null };
  }
}

export async function createTemporaryBan(
  banType: "email" | "ip",
  value: string,
  durationMinutes: number,
  reason: string
) {
  try {
    const val = banType === "email" ? value.toLowerCase().trim() : value;
    const bannedUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("admin_bans").upsert(
      {
        ban_type: banType,
        value: val,
        reason,
        severity: "temporary",
        banned_until: bannedUntil,
      },
      { onConflict: "ban_type,value" }
    );

    if (error) {
      console.error(`[createTemporaryBan] Failed to create ${banType} ban for ${val}:`, error);
    } else {
      console.warn(`[SECURITY BAN] Created temporary ${banType} ban for ${val} for ${durationMinutes} mins. Reason: ${reason}`);
      await logAdminSecurityEvent({
        email: banType === "email" ? val : null,
        ipAddress: banType === "ip" ? val : null,
        eventType: banType === "email" ? "admin_email_banned" : "admin_ip_banned",
        severity: "warning",
        metadata: { durationMinutes, bannedUntil, reason },
      });
    }
  } catch (err) {
    console.error("[createTemporaryBan] Exception creating temporary ban:", err);
  }
}

export async function applyAbusePolicy(
  email: string | null,
  ip: string | null
) {
  try {
    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    // Owner protection safeguard: do not allow temporary ban or checks on owner email
    const isOwner = isOwnerEmail(email);

    // 1. Email abuse checks
    if (email && !isOwner) {
      const normalizedEmail = email.toLowerCase().trim();
      const { count: emailFailCount, error: emailErr } = await supabaseAdmin
        .from("admin_security_events")
        .select("*", { count: "exact", head: true })
        .eq("email", normalizedEmail)
        .gte("created_at", fifteenMinsAgo)
        .in("event_type", [
          "admin_email_check_rejected_uninvited",
          "admin_login_failed_uninvited_email",
          "admin_login_failed_invalid_password",
        ]);

      if (!emailErr && emailFailCount && emailFailCount >= 3) {
        await createTemporaryBan(
          "email",
          normalizedEmail,
          30,
          "Too many failed or unauthorized admin login attempts within 15 minutes."
        );
      }
    }

    // 2. IP abuse checks
    if (ip) {
      // 15 mins check
      const { count: ip15MinCount, error: ip15Err } = await supabaseAdmin
        .from("admin_security_events")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", fifteenMinsAgo);

      if (!ip15Err && ip15MinCount && ip15MinCount >= 5) {
        await createTemporaryBan(
          "ip",
          ip,
          30,
          "Multiple failed or suspicious requests from this IP address within 15 minutes."
        );
        return;
      }

      // 1 hour check
      const { count: ip1HourCount, error: ip1HourErr } = await supabaseAdmin
        .from("admin_security_events")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", oneHourAgo);

      if (!ip1HourErr && ip1HourCount && ip1HourCount >= 10) {
        await createTemporaryBan(
          "ip",
          ip,
          1440, // 24 hours
          "Suspicious repeated attempts from this IP address within 1 hour."
        );
      }
    }
  } catch (err) {
    console.error("[applyAbusePolicy] Exception executing abuse checks:", err);
  }
}
