import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isProduction = process.env.NODE_ENV === 'production';

if (!supabaseUrl) {
  if (isProduction) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  console.warn('Warning: SUPABASE_URL not set — using placeholder for development');
  supabaseUrl = 'https://placeholder.supabase.co';
}

// Prefer service role key on the server for trusted operations. Fallback to anon key.
let clientKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!clientKey) {
  if (isProduction) {
    throw new Error('Missing Supabase key: set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  }
  console.warn('Warning: Supabase keys are not set — using placeholder key for development');
  clientKey = 'placeholder-key';
}

const supabase = createClient(supabaseUrl, clientKey, {
  auth: { persistSession: false }
});

export default supabase;
