import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verifyAdmin";
import { normalizeError } from "@/lib/api/normalizeError";

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const params = await props.params;
    const body = await request.json();

    // Placeholder: Campaigns table doesn't exist yet, so we just mock a success response.
    return NextResponse.json({
      success: true,
      data: { id: params.id, status: body.status, updated: true }
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error(`[PATCH /api/admin/campaigns/[id]/status]`, normalizedError);
    return NextResponse.json(
      { success: false, error: normalizedError },
      { status: 500 }
    );
  }
}
