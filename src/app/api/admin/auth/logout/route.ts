import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabase = createSupabaseServerClient(token);
      await supabase.auth.signOut();
    }

    const cookieStore = await cookies();
    cookieStore.delete("admin-token");

    const response = NextResponse.json({ success: true, ok: true });
    // Also explicitly expire the cookie in the headers just to be robust
    response.headers.set(
      "Set-Cookie",
      "admin-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax"
    );

    return response;
  } catch (error) {
    console.error("[POST /api/admin/auth/logout] error:", error);
    return NextResponse.json({ success: false, ok: false }, { status: 500 });
  }
}
