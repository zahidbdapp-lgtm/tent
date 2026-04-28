import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required. ' +
    'Please set them in your .env.local file.'
  );
}

// Create a singleton Supabase client for client-side usage
let supabaseClient;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

export const supabase = getSupabaseClient();
export const isSupabaseConfigured = supabaseUrl && supabaseKey ? true : false;
