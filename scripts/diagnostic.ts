import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error } = await supabase.from("profiles").select("id, role, approval_status, kyc_status");
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log("Total profiles:", profiles.length);
  const creators = profiles.filter(p => p.role === "creator");
  const brands = profiles.filter(p => p.role === "brand");
  
  console.log("Creators:", creators.length);
  console.log("Brands:", brands.length);
  
  function normalize(input: Record<string, unknown>) {
    const approval = (input.approval_status as string)?.toLowerCase().trim() ?? "";
    const kyc = (input.kyc_status as string)?.toLowerCase().trim() ?? "";

    if (input.is_blocked === true || approval === "blocked" || kyc === "blocked") return "blocked";
    if (approval === "rejected" || kyc === "rejected") return "rejected";
    if (approval === "approved" || kyc === "approved") return "approved";
    if (input.is_verified === true && (approval === "" || approval === "approved")) return "approved";
    return "pending";
  }

  console.log("Approved Creators:", creators.filter(p => normalize(p) === "approved").length);
  console.log("Approved Brands:", brands.filter(p => normalize(p) === "approved").length);
  
  const pending = profiles.filter(p => 
    (p.role === "creator" || p.role === "brand") && 
    normalize(p) === "pending"
  );
  console.log("Pending Approvals:", pending.length);
}

main();
