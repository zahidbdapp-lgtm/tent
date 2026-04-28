// Supabase client utilities for different contexts

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required. ' +
    'Please set them in your .env.local file.'
  );
}

// Export environment validation
export const isSupabaseConfigured = true;
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseKey;

// Re-export all client creation functions
export { createClient, createServerSupabaseClient } from './client';
export { createMiddlewareClient } from './middleware';

// Legacy export for backward compatibility
export { getSupabaseClient as supabase } from '../supabaseClient';