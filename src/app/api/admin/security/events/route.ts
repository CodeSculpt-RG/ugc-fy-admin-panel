import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireOwner(request);

    // Parse query params for pagination
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const { data: events, error, count } = await supabaseAdmin
      .from("admin_security_events")
      .select("*, admin_users(email, full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[GET /api/admin/security/events] DB error:", error);
      return NextResponse.json(
        { ok: false, error: "DATABASE_ERROR", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      data: events ?? [],
      count: count ?? 0,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Access Denied: Owner authorization required.";
    console.error("[GET /api/admin/security/events] authorization error:", errMsg);
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: errMsg },
      { status: 403 }
    );
  }
}
