/* eslint-disable */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('kyc_submissions').select('*').limit(1);
  if (data) {
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      const { data: d2, error: e2 } = await supabase.rpc('get_columns', { table_name: 'kyc_submissions' });
      // If get_columns fails, we can just insert a dummy with `id` to see the error, wait we already did that!
      // Let's do a select on information_schema (if permissions allow)
      console.log("Empty table");
    }
  }
}
run();
