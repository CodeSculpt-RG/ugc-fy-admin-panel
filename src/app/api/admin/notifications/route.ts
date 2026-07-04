import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/api/requirePermission";
import { normalizeError } from "@/lib/api/normalizeError";

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "reports.read");
    if (!check.ok) return check.response;

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .select("id, admin_id, type, title, message, href, metadata, is_read, created_at, read_at")
      .or(`admin_id.eq.${check.admin.id},admin_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      const isMissing =
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("Could not find the table");

      if (isMissing) {
        return NextResponse.json({
          success: true,
          source: "real_supabase_database",
          data: [],
          unreadCount: 0,
          isMissingTable: true,
          tableName: "admin_notifications",
          migrationSql: `CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  href text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);`
        });
      }

      throw error;
    }

    const records = data ?? [];
    const unreadCount = records.filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: records,
      unreadCount,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/notifications]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
