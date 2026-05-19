import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";

const ALLOWED_KEYS = [
  "general_settings",
  "security_settings",
  "notification_settings",
  "email_smtp_settings",
  "database_settings",
  "mobile_app_settings",
];

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "settings.read");
    if (!check.ok) return check.response;

    const { data: settings, error } = await supabaseAdmin
      .from("platform_settings")
      .select("id, key, value, category, label, description, is_public, is_sensitive, created_at, updated_at")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: settings ?? [],
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/settings]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const check = await requirePermission(request, "settings.write");
    if (!check.ok) return check.response;

    const body = await request.json().catch((): null => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          source: "real_supabase_database",
          error: {
            message: "Empty request body",
            code: "EMPTY_BODY",
            details: "PATCH request requires JSON body with key and value.",
            hint: null,
          },
        },
        { status: 400 }
      );
    }

    const { key, value } = body as { key: string; value: unknown };

    if (!key || !ALLOWED_KEYS.includes(key)) {
      return NextResponse.json(
        {
          success: false,
          source: "real_supabase_database",
          error: {
            message: `Invalid setting key: ${key}`,
            code: "INVALID_SETTING_KEY",
            details: "Only allowed setting keys can be modified.",
            hint: `Allowed keys: ${ALLOWED_KEYS.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    const categoryMap: Record<string, string> = {
      general_settings: "general",
      security_settings: "security",
      notification_settings: "notifications",
      email_smtp_settings: "email_smtp",
      database_settings: "database",
      mobile_app_settings: "mobile_app",
    };

    const labelMap: Record<string, string> = {
      general_settings: "General Settings",
      security_settings: "Security Settings",
      notification_settings: "Notification Settings",
      email_smtp_settings: "Email SMTP Settings",
      database_settings: "Database Settings",
      mobile_app_settings: "Mobile App Settings",
    };

    const { data: updatedSetting, error } = await supabaseAdmin
      .from("platform_settings")
      .upsert(
        {
          key,
          value: value ?? {},
          category: categoryMap[key] || "general",
          label: labelMap[key] || key,
          updated_by: check.admin.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) throw error;

    // Audit log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `settings.update`,
      targetType: "platform_setting",
      targetId: key,
      metadata: { newValue: value },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: updatedSetting,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[PATCH /api/admin/settings]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
