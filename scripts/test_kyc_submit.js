/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://eiswwwetrenkyqhsdebh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpc3d3d2V0cmVua3lxaHNkZWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM3OTM4MSwiZXhwIjoyMDkyOTU1MzgxfQ.Pd7wVFN2-7h6JaHrUrhKxL7jCN_OGsaTqaqtChBGQYE');

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
