import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const OWNER_EMAIL = "ugcfybycreatornavigator@gmail.com";
const OWNER_PASSWORD = "Ugcfy@2026";
const OWNER_USER_ID = "211a701e-b34e-4bb7-8b2a-72de065dd879";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase admin environment variables.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("📌 Starting owner password setup...");

  let userId = OWNER_USER_ID;

  // 1. Try updating the user's password directly using the pre-seeded user ID
  console.log(`Attempting to update password for pre-seeded user ID: ${OWNER_USER_ID}...`);
  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    OWNER_USER_ID,
    {
      password: OWNER_PASSWORD,
      email_confirm: true,
    }
  );

  if (updateError) {
    console.warn(`⚠️ Direct update failed: ${updateError.message}. Trying to find/create user by email...`);

    // Let's try to create the user in case they don't exist under that specific ID
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      email_confirm: true,
    });

    if (createError) {
      // If user already exists error occurs, we can try to update by finding them, but since listUsers failed,
      // let's log the error.
      console.error("❌ Failed to create owner auth user:", createError.message);
      process.exit(1);
    } else if (createData.user) {
      console.log(`✅ Auth user created successfully with ID: ${createData.user.id}`);
      userId = createData.user.id;
    }
  } else if (updateData.user) {
    console.log(`✅ Password updated successfully for existing user ID: ${userId}`);
  }

  // 2. Ensure admin_users row exists and is configured
  console.log("Ensuring admin_users database record exists and password is enabled...");
  const { error: upsertError } = await supabaseAdmin
    .from("admin_users")
    .upsert(
      {
        user_id: userId,
        email: OWNER_EMAIL,
        full_name: "UGC FY Owner",
        role: "owner",
        status: "active",
        password_enabled: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      }
    );

  if (upsertError) {
    console.error("❌ Failed to upsert owner row in admin_users:", upsertError.message);
    process.exit(1);
  }

  console.log("Owner password enabled successfully.");
  console.log(`Owner email: ${OWNER_EMAIL}`);
  console.log(`Owner user id: ${userId}`);
}

main().catch((err) => {
  console.error("Unexpected script error:", err);
  process.exit(1);
});
