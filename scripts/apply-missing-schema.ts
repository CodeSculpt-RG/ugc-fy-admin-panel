import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env");
  process.exit(1);
}

// const supabase = createClient(supabaseUrl, serviceRoleKey);

const MISSING_TABLES_SQL = [
  // audit_logs
  `CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    action text NOT NULL,
    module text NOT NULL,
    target_id text NOT NULL,
    ip_address text,
    user_agent text,
    severity text NOT NULL DEFAULT 'Info',
    created_at timestamptz DEFAULT now()
  );`,
  
  // security_events
  `CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    ip_address text,
    user_agent text,
    endpoint text,
    severity text NOT NULL DEFAULT 'Warning',
    status text NOT NULL DEFAULT 'Active',
    created_at timestamptz DEFAULT now()
  );`,
  
  // platform_settings
  `CREATE TABLE IF NOT EXISTS public.platform_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL DEFAULT '{}',
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
  );`,
  
  // moderation_cases
  `CREATE TABLE IF NOT EXISTS public.moderation_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id text NOT NULL,
    target_type text NOT NULL,
    title text NOT NULL,
    creator_id uuid,
    campaign_id uuid,
    reporter_id uuid,
    status text NOT NULL DEFAULT 'Pending Review',
    risk_level text NOT NULL DEFAULT 'Medium',
    reason text,
    thumbnail_url text,
    content text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,
  
  // disputes
  `CREATE TABLE IF NOT EXISTS public.disputes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    type text NOT NULL,
    priority text NOT NULL DEFAULT 'Medium',
    status text NOT NULL DEFAULT 'Open',
    assigned_admin_id uuid,
    resolution_notes text,
    opened_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,
  
  // escrow_records
  `CREATE TABLE IF NOT EXISTS public.escrow_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    amount numeric(12, 2) NOT NULL,
    status text NOT NULL DEFAULT 'Held',
    release_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );`,

  // reports
  `CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    type text NOT NULL,
    parameters jsonb DEFAULT '{}',
    file_url text,
    status text NOT NULL DEFAULT 'Generating',
    generated_by uuid,
    created_at timestamptz DEFAULT now()
  );`
];

async function applySchema() {
  console.log("Attempting to apply missing schema tables...");
  
  console.log("\nIMPORTANT: Supabase client cannot execute arbitrary DDL (CREATE TABLE) directly.");
  console.log("Please copy and paste the following SQL into your Supabase SQL Editor:\n");
  
  console.log(MISSING_TABLES_SQL.join("\n\n"));
  
  console.log("\n--------------------------------------------------");
  console.log("After running the SQL above, all Admin Panel features will be fully operational.");
}

applySchema();
