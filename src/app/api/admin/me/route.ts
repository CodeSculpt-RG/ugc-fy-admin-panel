import { NextResponse } from "next/server";
import { verifyAdminAccess } from "@/lib/auth/admin-auth";

export async function GET(request: Request) {
  try {
    const result = await verifyAdminAccess(request);

    if (!result.ok) {
      const statusCode =
        result.status === 401
          ? 401
          : result.status === 500
            ? 500
            : 403;

      let errorMsg = result.error;
      let errorCode = result.error;

      if (statusCode === 401) {
        errorCode = "UNAUTHENTICATED";
        errorMsg = "Authentication required.";
      } else if (statusCode === 403) {
        errorCode = "UNAUTHORIZED";
        errorMsg = "You are not authorized to access this admin panel.";
      } else if (result.error === "CONFIG_ERROR") {
        errorMsg = "Admin authorization database is not configured.";
      }

      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: errorCode,
          message: errorMsg,
        },
        {
          status: statusCode,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ok: true,
        admin: result.admin,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/admin/me] unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: "INTERNAL_ERROR",
        message: "Unexpected admin session error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
