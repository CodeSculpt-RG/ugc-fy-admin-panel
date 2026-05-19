export const MIGRATION_SQL_MAP: Record<string, string> = {
  audit_logs: `-- Migration SQL for audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  module text NOT NULL,
  target_id text NOT NULL,
  ip_address text,
  user_agent text,
  severity text NOT NULL DEFAULT 'Info' CHECK (severity IN ('Info', 'Warning', 'Critical')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access audit logs" ON public.audit_logs FOR ALL USING (true);`,

  security_events: `-- Migration SQL for security_events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  endpoint text,
  severity text NOT NULL DEFAULT 'Warning' CHECK (severity IN ('Low', 'Warning', 'Critical', 'Blocked')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'Dismissed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access security events" ON public.security_events FOR ALL USING (true);`,

  platform_settings: `-- Migration SQL for platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access platform settings" ON public.platform_settings FOR ALL USING (true);
INSERT INTO public.platform_settings (key, value) VALUES (
  'general_config',
  '{"maintenance_mode": false, "auto_approve_creators": false, "platform_fee_percent": 10, "escrow_hold_days": 14}'::jsonb
) ON CONFLICT (key) DO NOTHING;`,

  moderation_cases: `-- Migration SQL for moderation_cases
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.moderation_case_status AS ENUM (
    'pending', 'reviewing', 'resolved', 'dismissed', 'escalated'
  );
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.moderation_case_priority AS ENUM (
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.moderation_case_type AS ENUM (
    'creator_content', 'brand_content', 'campaign', 'profile', 'message', 'payment', 'dispute', 'system'
  );
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type public.moderation_case_type NOT NULL DEFAULT 'system',
  status public.moderation_case_status NOT NULL DEFAULT 'pending',
  priority public.moderation_case_priority NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type text,
  target_id text,
  assigned_admin_id uuid REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  resolved_by uuid REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access moderation cases" ON public.moderation_cases FOR ALL USING (true);`,

  disputes: `-- Migration SQL for disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  creator_id uuid NOT NULL REFERENCES public.users(id),
  brand_id uuid NOT NULL REFERENCES public.users(id),
  type text NOT NULL CHECK (type IN ('Payment', 'Content', 'Refund', 'Fraud', 'Deadline')),
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Resolved', 'Closed')),
  assigned_admin_id uuid REFERENCES auth.users(id),
  resolution_notes text,
  opened_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access disputes" ON public.disputes FOR ALL USING (true);`,

  escrow_records: `-- Migration SQL for escrow_records
CREATE TABLE IF NOT EXISTS public.escrow_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  brand_id uuid NOT NULL REFERENCES public.users(id),
  creator_id uuid NOT NULL REFERENCES public.users(id),
  amount numeric(12, 2) NOT NULL,
  status text NOT NULL DEFAULT 'Held' CHECK (status IN ('Held', 'Released', 'Frozen', 'Disputed', 'Refunded')),
  release_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.escrow_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access escrow" ON public.escrow_records FOR ALL USING (true);`,

  payments: `-- Migration SQL for payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.users(id),
  creator_id uuid NOT NULL REFERENCES public.users(id),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id),
  amount numeric(12, 2) NOT NULL,
  commission numeric(12, 2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'failed', 'refunded', 'cancelled', 'processing')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access payments" ON public.payments FOR ALL USING (true);`,

  reports: `-- Migration SQL for reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('Financial', 'User', 'Campaign', 'Security', 'Dispute')),
  parameters jsonb DEFAULT '{}',
  file_url text,
  status text NOT NULL DEFAULT 'Generating' CHECK (status IN ('Generating', 'Ready', 'Failed')),
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access reports" ON public.reports FOR ALL USING (true);`,

  admin_invites: `-- Migration SQL for admin_invites
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'SUPPORT_ADMIN',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Revoked', 'Expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can access admin invites" ON public.admin_invites FOR ALL USING (true);`,
};

export function getMissingTableInfo(errCode?: string, errMsg?: string) {
  const isMissing =
    errCode === "PGRST205" ||
    errCode === "PGRST200" ||
    errCode === "42P01" ||
    (errMsg && (
      errMsg.includes("schema cache") ||
      errMsg.includes("relationship between") ||
      errMsg.includes("does not exist")
    ));

  if (!isMissing) return null;

  let tableName = "unknown";
  if (errMsg) {
    // Match 'public.table_name' pattern first
    const match =
      errMsg.match(/'public\.([^']+)'/) ||
      errMsg.match(/table '([^']+)'/) ||
      errMsg.match(/between '([^']+)'/) ||
      errMsg.match(/'([^']+)'/);
    if (match && match[1]) {
      tableName = match[1].replace(/^public\./, "");
    }
  }
  return {
    isMissingTable: true,
    tableName,
    sql: MIGRATION_SQL_MAP[tableName] || `-- Table '${tableName}' requires migration.\n-- Run the migration SQL from:\n-- supabase/migrations/20260516_admin_production_tables.sql`,
  };
}

