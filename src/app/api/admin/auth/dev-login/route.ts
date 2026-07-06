import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSafeAdminRedirect } from "@/lib/auth/safe-redirect";
import { OWNER_EMAIL, normalizeEmail, isOwnerEmail } from "@/lib/auth/admin-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  // 1. Production check
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "NOT_AVAILABLE",
        message: "Dev login is disabled in production.",
      },
      { status: 404 }
    );
  }

  // 2. Feature flag check
  if (process.env.ENABLE_OWNER_DEV_LOGIN !== "true") {
    return NextResponse.json(
      {
        success: false,
        error: "DEV_LOGIN_DISABLED",
        message: "Owner dev login is disabled.",
      },
      { status: 403 }
    );
  }

  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next");
  const safeNext = getSafeAdminRedirect(next);

  // 3. Email constraint check
  const emailParam = requestUrl.searchParams.get("email");
  const email = normalizeEmail(emailParam ?? "");

  if (!isOwnerEmail(email)) {
    return NextResponse.json(
      {
        success: false,
        error: "OWNER_ONLY",
        message: "This debug login is restricted to the owner account.",
      },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const supabaseClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const OWNER_USER_ID = "211a701e-b34e-4bb7-8b2a-72de065dd879";
  const TEMP_PASSWORD = "TestPassword123!";

  try {
    // 1. Reset/set password to temporary password (for development check-in fallback)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      OWNER_USER_ID,
      { password: TEMP_PASSWORD }
    );

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: "PASSWORD_UPDATE_FAILED",
          message: "Failed to update owner password: " + updateError.message,
        },
        { status: 500 }
      );
    }

    // 2. Sign in with password to get token
    const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: TEMP_PASSWORD,
    });

    if (signInError || !data.session) {
      return NextResponse.json(
        {
          success: false,
          error: "SIGN_IN_FAILED",
          message: "Failed to sign in owner: " + (signInError?.message || "No session"),
        },
        { status: 500 }
      );
    }

    // 3. Set cookie and redirect
    const response = NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    response.cookies.set("admin-token", data.session.access_token, {
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
      sameSite: "lax",
      secure: false, // development only
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Owner dev login error:", message);
    return NextResponse.json(
      {
        success: false,
        error: "DEV_LOGIN_FAILED",
        message: "Unable to complete owner dev login.",
      },
      { status: 500 }
    );
  }
}
