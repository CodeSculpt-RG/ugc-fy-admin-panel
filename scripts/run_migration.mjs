/**
 * Migration Runner — Executes admin_login_migration.sql against the Supabase project.
 * 
 * This script creates admin tables by using individual PostgREST-compatible operations
 * since the service role key cannot execute raw DDL via REST.
 * 
 * Usage: node scripts/run_migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OWNER_EMAIL = 'ugcfybycreatornavigator@gmail.com';

async function checkTableExists(tableName) {
  const { error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error && error.code === 'PGRST205') {
    return false;  // Table does not exist
  }
  return true;  // Table exists (even if empty or other error)
}

async function seedOwner() {
  console.log('\n📌 Seeding owner account...');
  const { data, error } = await supabase
    .from('admin_users')
    .upsert(
      {
        email: OWNER_EMAIL,
        full_name: 'UGC FY Owner',
        role: 'owner',
        status: 'active',
        password_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select('id, email, role, status, password_enabled, user_id')
    .single();

  if (error) {
    console.error('❌ Failed to seed owner:', error.message);
    return null;
  }

  console.log('✅ Owner row:', data);
  return data;
}

async function verifyOwner() {
  console.log('\n🔍 Verifying owner row...');
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, user_id, email, full_name, role, status, password_enabled, created_at, updated_at')
    .eq('email', OWNER_EMAIL)
    .single();

  if (error) {
    console.error('❌ Owner verification failed:', error.message);
    return;
  }

  console.log('✅ Owner verified:');
  console.log(`   email:            ${data.email}`);
  console.log(`   role:             ${data.role}`);
  console.log(`   status:           ${data.status}`);
  console.log(`   password_enabled: ${data.password_enabled}`);
  console.log(`   user_id:          ${data.user_id || '(pending — will be linked on first login)'}`);
  console.log(`   id:               ${data.id}`);
}

async function main() {
  console.log('============================================================');
  console.log(' UGC FY Admin Panel — Migration Runner');
  console.log(`   Supabase Project: ${supabaseUrl}`);
  console.log('============================================================');

  // Check which tables exist
  const adminUsersExists = await checkTableExists('admin_users');
  const securityEventsExists = await checkTableExists('admin_security_events');
  const bansExists = await checkTableExists('admin_bans');

  console.log('\n📊 Table status:');
  console.log(`   admin_users:            ${adminUsersExists ? '✅ exists' : '❌ MISSING'}`);
  console.log(`   admin_security_events:  ${securityEventsExists ? '✅ exists' : '❌ MISSING'}`);
  console.log(`   admin_bans:             ${bansExists ? '✅ exists' : '❌ MISSING'}`);

  if (!adminUsersExists || !securityEventsExists || !bansExists) {
    console.log('\n⚠️  One or more tables are missing.');
    console.log('   The PostgREST API cannot execute CREATE TABLE statements.');
    console.log('   You MUST run the migration SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('   1. Open https://supabase.com/dashboard/project/qsvpbzyceapgexugmvoa/sql/new');
    console.log('   2. Paste the contents of: scripts/admin_login_migration.sql');
    console.log('   3. Click "Run"');
    console.log('   4. Then re-run this script: node scripts/run_migration.mjs');
    console.log('');
    
    if (!adminUsersExists) {
      console.log('   ❌ Cannot seed owner — admin_users table does not exist yet.');
      process.exit(1);
    }
  }

  // If admin_users exists, seed and verify owner
  if (adminUsersExists) {
    await seedOwner();
    await verifyOwner();
    console.log('\n✅ Migration check complete. All tables and owner seed verified.');
  }
}

main().catch((err) => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
