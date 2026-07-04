import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizeError } from '@/lib/api/normalizeError';
import { buildActivityAccessFilter } from '@/lib/auth/rbac';

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "profile.read");
    if (!check.ok) return check.response; // 401 or 403

    const admin = check.admin;

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") as "own" | "team" | "all";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)));
    
    // RBAC Filter Check
    const accessFilter = buildActivityAccessFilter(admin, scope || "own");
    
    if (!accessFilter.allowed) {
      return NextResponse.json({
        ok: false,
        error: { code: "FORBIDDEN", message: accessFilter.error || "Access denied" }
      }, { status: 403 });
    }

    let query = supabaseAdmin
      .from("admin_activity_logs")
      .select("*", { count: "exact" });

    // Apply strict server-side scoping
    if (accessFilter.ownOnly) {
      query = query.or(`actor_admin_id.eq.${admin.id},target_admin_id.eq.${admin.id}`);
    } else if (accessFilter.modules && accessFilter.modules.length > 0) {
      query = query.in("module", accessFilter.modules);
    }
    
    // Apply user-provided filters safely
    const moduleFilter = url.searchParams.get("module");
    if (moduleFilter) {
      // Don't allow bypassing team scopes
      if (!accessFilter.modules || accessFilter.modules.includes(moduleFilter) || accessFilter.modules.includes("ALL")) {
        query = query.eq("module", moduleFilter);
      }
    }
    
    const actionFilter = url.searchParams.get("action");
    if (actionFilter) query = query.eq("action", actionFilter);

    const fromDate = url.searchParams.get("from");
    if (fromDate) query = query.gte("created_at", fromDate);

    const toDate = url.searchParams.get("to");
    if (toDate) query = query.lte("created_at", toDate);

    // Apply Pagination
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    query = query.order("created_at", { ascending: false }).range(fromIndex, toIndex);

    const { data, count, error } = await query;

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: 'ACTIVITY_TABLE_NOT_CONFIGURED',
              message: 'Admin activity logging is not configured yet.',
            },
          },
          { status: 501 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      data: data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      },
      permissions: {
        canReadOwn: buildActivityAccessFilter(admin, "own").allowed,
        canReadTeam: buildActivityAccessFilter(admin, "team").allowed,
        canReadAll: buildActivityAccessFilter(admin, "all").allowed
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('[GET /api/admin/profile/activity]', error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: normalizeError(error).message } },
      { status: 500 }
    );
  }
}
