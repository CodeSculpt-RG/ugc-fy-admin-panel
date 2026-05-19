import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeError } from "@/lib/api/normalizeError";
import { requirePermission } from "@/lib/api/requirePermission";

type PaymentRow = {
  id: string;
  amount?: number | string | null;
  platform_fee?: number | string | null;
  status?: string | null;
  currency?: string | null;
  payer_profile_id?: string | null;
  payee_profile_id?: string | null;
  campaign_id?: string | null;
  payment_method?: string | null;
  reference_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  reviewed?: boolean | null;
};

type PaymentProfile = {
  id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "payments.read");
    if (!check.ok) return check.response;

    const { data: rawPayments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (paymentsError) {
      const isMissing =
        paymentsError.code === "PGRST205" ||
        paymentsError.code === "42P01" ||
        paymentsError.message?.includes("does not exist") ||
        paymentsError.message?.includes("Could not find the table");

      if (isMissing) {
        return NextResponse.json({
          success: true,
          source: "real_supabase_database",
          isMissingTable: true,
          tableName: "payments",
          migrationSql: `CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  payee_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  platform_fee numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'processing', 'disputed')),
  payment_method text,
  reference_id text,
  metadata jsonb NOT NULL DEFAULT '{}',
  reviewed boolean NOT NULL DEFAULT false,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_payer_profile_id ON public.payments(payer_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_profile_id ON public.payments(payee_profile_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can access payments" ON public.payments;

CREATE POLICY "Admins can access payments"
ON public.payments
FOR ALL
USING (true)
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';`,
          data: [],
          count: 0,
        });
      }
      throw paymentsError;
    }

    const payments = (rawPayments ?? []) as PaymentRow[];

    if (payments.length === 0) {
      return NextResponse.json({
        success: true,
        source: "real_supabase_database",
        data: [],
        count: 0,
      });
    }

    const hasPayerProfileId = payments.some((payment) =>
      Object.prototype.hasOwnProperty.call(payment, "payer_profile_id")
    );
    const hasPayeeProfileId = payments.some((payment) =>
      Object.prototype.hasOwnProperty.call(payment, "payee_profile_id")
    );

    const profileIds = Array.from(
      new Set(
        payments
          .flatMap((payment) => [
            hasPayerProfileId ? payment.payer_profile_id : null,
            hasPayeeProfileId ? payment.payee_profile_id : null,
          ])
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    let profiles: PaymentProfile[] = [];

    if (profileIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role, full_name, avatar_url")
        .in("id", profileIds);

      if (error) throw error;

      profiles = (data ?? []) as PaymentProfile[];
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const enrichedPayments = payments.map((payment) => {
      const payerProfile =
        hasPayerProfileId && typeof payment.payer_profile_id === "string"
          ? profileMap.get(payment.payer_profile_id) ?? null
          : null;
      const payeeProfile =
        hasPayeeProfileId && typeof payment.payee_profile_id === "string"
          ? profileMap.get(payment.payee_profile_id) ?? null
          : null;

      const brandName = payerProfile?.full_name || payerProfile?.email || "Unknown payer";
      const creatorName = payeeProfile?.full_name || payeeProfile?.email || "Unknown payee";
      const amountNum = Number(payment.amount) || 0;
      const feeNum = Number(payment.platform_fee) || 0;

      return {
        ...payment,
        brand: brandName,
        creator: creatorName,
        campaign: payment.campaign_id || "General Campaign",
        amount: `$${amountNum.toFixed(2)}`,
        commission: `$${feeNum.toFixed(2)}`,
        status: payment.status ? payment.status.toLowerCase() : "pending",
        date: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        reviewed: payment.reviewed ?? false,

        payer_profile: payerProfile,
        payee_profile: payeeProfile,
        creator_profile: payeeProfile,
        brand_profile: payerProfile,
        user_profile: null,
      };
    });

    return NextResponse.json({
      success: true,
      source: "real_supabase_database",
      data: enrichedPayments,
      count: enrichedPayments.length,
    });
  } catch (error: unknown) {
    const normalizedError = normalizeError(error);
    console.error("[GET /api/admin/payments]", normalizedError);
    return NextResponse.json(
      { success: false, source: "real_supabase_database", error: normalizedError },
      { status: 500 }
    );
  }
}
