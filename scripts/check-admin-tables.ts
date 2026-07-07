import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTables() {
  const { data: users } = await supabaseAdmin.from("admin_users").select("*").limit(1);
  const { data: profiles } = await supabaseAdmin.from("admin_profiles").select("*").limit(1);
  
  console.log("admin_users:", users);
  console.log("admin_profiles:", profiles);
}

checkTables();
