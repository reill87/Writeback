import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for browser/client-side usage
 *
 * This client:
 * - Runs only in the browser (client components)
 * - Automatically handles cookie-based session management
 * - Uses the public anon key (safe for client-side)
 * - Respects Row Level Security policies
 *
 * @returns Supabase client instance for browser usage
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
