import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";
import { writeAuditLog } from "@/lib/api/writeAuditLog";
import { getMissingTableInfo } from "@/lib/api/migrationSql";

const SETTING_KEYS = [
  "general_settings",
  "security_settings",
  "notification_settings",
  "email_smtp_settings",
  "database_settings",
  "mobile_app_settings",
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

type SettingDefinition = {
  key: SettingKey;
  defaultValue: Record<string, unknown>;
  category: string;
  label: string;
  isPublic: boolean;
  isSensitive: boolean;
};

const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: "general_settings",
    defaultValue: {
      enterprise_name: "UGC FY Enterprise",
      support_email: "support@ugc-fy.in",
      yield_fee_coefficient: 15,
      currency: "INR",
    },
    category: "general",
    label: "General Settings",
    isPublic: true,
    isSensitive: false,
  },
  {
    key: "security_settings",
    defaultValue: {
      require_admin_2fa: false,
      max_login_attempts: 5,
      session_timeout_minutes: 1440,
      allow_owner_override: true,
    },
    category: "security",
    label: "Security Settings",
    isPublic: true,
    isSensitive: false,
  },
  {
    key: "notification_settings",
    defaultValue: {
      email_notifications: true,
      approval_alerts: true,
      payment_alerts: true,
      security_alerts: true,
    },
    category: "notifications",
    label: "Notification Settings",
    isPublic: true,
    isSensitive: false,
  },
  {
    key: "email_smtp_settings",
    defaultValue: {
      smtp_host: "",
      smtp_port: 587,
      smtp_username: "",
      smtp_from_email: "",
      smtp_secure: false,
    },
    category: "email_smtp",
    label: "Email SMTP Settings",
    isPublic: false,
    isSensitive: true,
  },
  {
    key: "database_settings",
    defaultValue: {
      realtime_enabled: true,
      daily_backup_enabled: true,
      query_timeout_seconds: 30,
      schema_cache_reload: true,
    },
    category: "database",
    label: "Database Settings",
    isPublic: false,
    isSensitive: false,
  },
  {
    key: "mobile_app_settings",
    defaultValue: {
      android_enabled: true,
      ios_enabled: true,
      force_update: false,
      minimum_app_version: "1.0.0",
      maintenance_message: "",
    },
    category: "mobile_app",
    label: "Mobile App Settings",
    isPublic: true,
    isSensitive: false,
  },
];

const SETTING_DEFINITION_MAP = new Map<SettingKey, SettingDefinition>(
  SETTING_DEFINITIONS.map((definition) => [definition.key, definition])
);

function isSettingKey(value: string): value is SettingKey {
  return SETTING_DEFINITION_MAP.has(value as SettingKey);
}

function getSettingDefinition(key: SettingKey): SettingDefinition {
  const definition = SETTING_DEFINITION_MAP.get(key);
  if (!definition) {
    throw new Error(`Unsupported setting key: ${key}`);
  }
  return definition;
}

type RawSettingRow = {
  id?: string;
  key: SettingKey;
  value?: Record<string, unknown> | null;
  category?: string | null;
  label?: string | null;
  description?: string | null;
  is_public?: boolean | null;
  is_sensitive?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function normalizeSettingRow(row: RawSettingRow) {
  const now = new Date().toISOString();
  const definition = getSettingDefinition(row.key);
  const rowValue = row.value && typeof row.value === "object" ? row.value : {};

  return {
    id: row.id ?? row.key,
    key: row.key,
    value: { ...definition.defaultValue, ...rowValue },
    category: row.category ?? definition.category,
    label: row.label ?? definition.label,
    description: row.description ?? null,
    is_public: Boolean(row.is_public ?? definition.isPublic),
    is_sensitive: Boolean(row.is_sensitive ?? definition.isSensitive),
    created_at: row.created_at ?? row.updated_at ?? now,
    updated_at: row.updated_at ?? row.created_at ?? now,
  };
}

function virtualDefaultRow(definition: SettingDefinition): RawSettingRow {
  return {
    key: definition.key,
    value: definition.defaultValue,
    category: definition.category,
    label: definition.label,
    description: null,
    is_public: definition.isPublic,
    is_sensitive: definition.isSensitive,
  };
}

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "settings.read");
    if (!check.ok) return check.response;

    let { data: settings, error } = await supabaseAdmin
      .from("platform_settings")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error && (error.code === "PGRST204" || error.message.includes("category"))) {
      const fallback = await supabaseAdmin
        .from("platform_settings")
        .select("*")
        .order("key", { ascending: true });
      settings = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const normalizedRowsByKey = new Map<string, ReturnType<typeof normalizeSettingRow>>();
    for (const row of settings ?? []) {
      const rawKey = String((row as { key?: unknown }).key ?? "");
      if (isSettingKey(rawKey)) {
        const normalized = normalizeSettingRow({ ...(row as Omit<RawSettingRow, "key">), key: rawKey });
        normalizedRowsByKey.set(normalized.key, normalized);
      }
    }

    for (const definition of SETTING_DEFINITIONS) {
      if (!normalizedRowsByKey.has(definition.key)) {
        normalizedRowsByKey.set(definition.key, normalizeSettingRow(virtualDefaultRow(definition)));
      }
    }

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: SETTING_DEFINITIONS.map((definition) => normalizedRowsByKey.get(definition.key)!),
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    const missingInfo = getMissingTableInfo(normalizedError.code, normalizedError.message);
    if (missingInfo) {
      return NextResponse.json({
        success: true,
        source: "real_supabase_database",
        isMissingTable: true,
        tableName: missingInfo.tableName,
        migrationSql: missingInfo.sql,
        data: [],
      });
    }

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

    if (!key || !isSettingKey(key)) {
      return NextResponse.json(
        {
          success: false,
          source: "real_supabase_database",
          error: {
            message: `Invalid setting key: ${key}`,
            code: "INVALID_SETTING_KEY",
            details: "Only allowed setting keys can be modified.",
            hint: `Allowed keys: ${SETTING_KEYS.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    const { data: currentSetting } = await supabaseAdmin
      .from("platform_settings")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    const currentValue =
      currentSetting?.value && typeof currentSetting.value === "object"
        ? (currentSetting.value as Record<string, unknown>)
        : {};
    const definition = getSettingDefinition(key);
    const nextValue =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...definition.defaultValue, ...currentValue, ...(value as Record<string, unknown>) }
        : { ...definition.defaultValue, ...currentValue };

    let { data: updatedSetting, error } = await supabaseAdmin
      .from("platform_settings")
      .upsert(
        {
          key,
          value: nextValue,
          category: definition.category,
          label: definition.label,
          updated_by: check.admin.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error && (
      error.code === "PGRST204" ||
      error.message.includes("category") ||
      error.message.includes("label") ||
      error.message.includes("updated_by")
    )) {
      const fallback = await supabaseAdmin
        .from("platform_settings")
        .upsert(
          {
            key,
            value: nextValue,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        )
        .select()
        .single();
      updatedSetting = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    // Audit log
    void writeAuditLog({
      actorAdminId: check.admin.id,
      actorRole: check.admin.role,
      action: `settings.update`,
      targetType: "platform_setting",
      targetId: key,
      metadata: { newValue: nextValue },
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: normalizeSettingRow(updatedSetting as RawSettingRow),
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
