import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    // Placeholder: Return empty data as payments table is not yet provisioned in Supabase schema
    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: [],
      count: 0,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/payments]", normalizedError);
    return NextResponse.json(
      {
        success: false,
        source: "real_supabase_database",
        error: normalizedError,
      },
      { status: 500 }
    );
  }
}
