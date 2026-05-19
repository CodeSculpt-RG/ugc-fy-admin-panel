import { NextResponse } from "next/server";
import { verifyAdmin } from "./verifyAdmin";
import { type AdminPermission, type VerifiedAdmin } from "./adminPermissions";

type RequirePermissionSuccess = {
  ok: true;
  admin: VerifiedAdmin;
};

type RequirePermissionFailure = {
  ok: false;
  response: NextResponse;
};

export type RequirePermissionResult = RequirePermissionSuccess | RequirePermissionFailure;

/**
 * Verify the admin bearer token AND check for a specific permission.
 *
 * Usage:
 *   const check = await requirePermission(request, "users.read");
 *   if (!check.ok) return check.response;
 *   // check.admin is now fully typed VerifiedAdmin
 */
export async function requirePermission(
  request: Request,
  permission: AdminPermission
): Promise<RequirePermissionResult> {
  const result = await verifyAdmin(request);

  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, source: "admin_auth", error: result.error },
        { status: result.status }
      ),
    };
  }

  if (!result.admin.permissions.includes(permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          source: "admin_auth",
          error: {
            message: `You do not have permission to access ${permission.split('.')[0]}.`,
            code: "ADMIN_PERMISSION_DENIED",
            details: `Required permission: ${permission}`,
            hint: "Ask an owner or super admin to grant access.",
          },
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, admin: result.admin };
}
