import { createBrowserClient, createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// Client-side Supabase client for browser usage
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);

// Server-side Supabase client for Server Components and Route Handlers
export const createServerSupabaseClient = (context?: { cookies: any }) => {
  if (!context) {
    throw new Error("Server context is required for server-side Supabase client");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: context.cookies,
  });
};
