import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testJoinKeys() {
  const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
  const { data: creatorProfiles } = await supabaseAdmin.from("creator_profiles").select("*");
  const { data: brandProfiles } = await supabaseAdmin.from("brand_profiles").select("*");

  const pList = profiles || [];
  const cpList = creatorProfiles || [];
  const bpList = brandProfiles || [];

  // Filter approved users using the exact JS logic we use
  const approvedCreators = pList.filter(p => p.role === "creator" && (p.approval_status === "approved" || p.kyc_status === "approved" || p.is_verified === true));
  const approvedBrands = pList.filter(p => p.role === "brand" && (p.approval_status === "approved" || p.kyc_status === "approved" || p.is_verified === true));

  console.log(`Total Approved Creators in profiles: ${approvedCreators.length}`);
  console.log(`Total Approved Brands in profiles: ${approvedBrands.length}`);

  // Test Creator Joins
  const joinUserIdToId = approvedCreators.filter(p => cpList.some(cp => cp.user_id === p.id)).length;
  const joinProfileIdToId = approvedCreators.filter(p => cpList.some(cp => cp.profile_id === p.id)).length;
  const joinUserIdToUserId = approvedCreators.filter(p => p.user_id && cpList.some(cp => cp.user_id === p.user_id)).length;

  console.log(`Creator Joins:`);
  console.log(`- cp.user_id = p.id: ${joinUserIdToId}`);
  console.log(`- cp.profile_id = p.id: ${joinProfileIdToId}`);
  console.log(`- cp.user_id = p.user_id: ${joinUserIdToUserId}`);

  // Test Brand Joins
  const bJoinUserIdToId = approvedBrands.filter(p => bpList.some(bp => bp.user_id === p.id)).length;
  const bJoinProfileIdToId = approvedBrands.filter(p => bpList.some(bp => bp.profile_id === p.id)).length;
  const bJoinUserIdToUserId = approvedBrands.filter(p => p.user_id && bpList.some(bp => bp.user_id === p.user_id)).length;

  console.log(`Brand Joins:`);
  console.log(`- bp.user_id = p.id: ${bJoinUserIdToId}`);
  console.log(`- bp.profile_id = p.id: ${bJoinProfileIdToId}`);
  console.log(`- bp.user_id = p.user_id: ${bJoinUserIdToUserId}`);
}

testJoinKeys();
