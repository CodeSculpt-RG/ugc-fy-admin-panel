import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";

/**
 * GET /api/admin/me
 * Returns the currently authenticated admin's profile + permissions.
 * Used by AdminAuthContext on mount to hydrate client-side state.
 */
export async function GET(request: Request) {
  try {
    const result = await verifyAdmin(request);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { admin } = result;

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        fullName: admin.fullName,
        permissions: admin.permissions,
        isActive: admin.isActive,
      },
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/me]", normalizedError);
    return NextResponse.json(
      { success: false, error: normalizedError },
      { status: 500 }
    );
  }
}
