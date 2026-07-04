/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
     const { data, error } = await supabase.from('applications').select('*').limit(1);
     console.log('applications check:', { exists: !!data && !error?.message?.includes("Could not find the table"), err: error?.message });
}
run();
