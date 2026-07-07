import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumns(table: string) {
  // Querying information_schema requires postgres role or raw query, which we might not have with supabase-js.
  // We can just try selecting one row to see what comes back.
  const { data, error } = await supabaseAdmin.from(table).select("*").limit(1);
  if (error) {
    console.log(`Error fetching ${table}:`, error.message);
  } else if (data && data.length > 0) {
    console.log(`Columns for ${table}:`, Object.keys(data[0]).join(", "));
  } else {
    console.log(`No rows in ${table} to determine columns`);
  }
}

async function run() {
  await checkColumns("profiles");
  await checkColumns("creator_profiles");
  await checkColumns("brand_profiles");
}

run();
