const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('ANON KEY exists:', !!SUPABASE_ANON_KEY);
console.log('SERVICE KEY exists:', !!SUPABASE_SERVICE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

module.exports = { supabase, supabaseAdmin };