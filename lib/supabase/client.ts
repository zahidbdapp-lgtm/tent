import { createBrowserClient, createServerClient } from "@supabase/ssr";

// Helper function to get and validate Supabase URL
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
      "Please set it in your .env.local or Netlify environment variables."
    );
  }
  return url;
}

// Helper function to get and validate Supabase key
function getSupabaseKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable. " +
      "Please set it in your .env.local or Netlify environment variables."
    );
  }
  return key;
}

// Client-side Supabase client for browser usage
export const createClient = () =>
  createBrowserClient(getSupabaseUrl(), getSupabaseKey());

// Server-side Supabase client for Server Components and Route Handlers
export const createServerSupabaseClient = (context?: { cookies: any }) => {
  if (!context) {
    throw new Error("Server context is required for server-side Supabase client");
  }

  return createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: context.cookies,
  });
};
