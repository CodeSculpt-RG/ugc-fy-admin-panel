import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";
import { hasPermission } from "@/lib/api/adminPermissions";
import { getAllowedNotificationCategories } from "@/app/services/notificationService";

export async function GET(request: Request) {
  try {
    const result = await verifyAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, source: "admin_auth", error: result.error },
        { status: result.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawCategories = searchParams.get("categories");
    const requestedCategories = rawCategories ? rawCategories.split(",") : [];

    const allowedCategories = getAllowedNotificationCategories((p) => hasPermission(result.admin.permissions, p));

    // Intersect requested categories with actually allowed categories
    const categoriesToFetch = requestedCategories.length > 0 
      ? requestedCategories.filter((c) => allowedCategories.includes(c))
      : allowedCategories;

    // If no categories are permitted, return early
    if (categoriesToFetch.length === 0) {
      return NextResponse.json({
        success: true,
        source: "real_supabase_database",
        data: [],
        unreadCount: 0,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .select("id, admin_id, type, title, message, href, metadata, is_read, created_at, read_at")
      .or(`admin_id.eq.${result.admin.id},admin_id.is.null`)
      .in("type", categoriesToFetch)
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
