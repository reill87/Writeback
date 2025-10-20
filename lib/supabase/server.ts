import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for server-side usage (Server Components, Server Actions)
 *
 * This client:
 * - Runs only on the server (Server Components, API routes, Server Actions)
 * - Reads/writes cookies for session management via Next.js cookies API
 * - Uses the public anon key (respects RLS)
 * - Properly handles SSR cookie flow
 *
 * @returns Supabase client instance for server usage
 */
export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Creates a Supabase admin client with elevated privileges
 *
 * WARNING: This client bypasses Row Level Security!
 * Only use for:
 * - System operations (creating checkpoints)
 * - Admin tasks
 * - Operations that require elevated permissions
 *
 * NEVER expose service role key to client-side code!
 *
 * @returns Supabase client with admin privileges
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get: () => null,
      set: () => {},
      remove: () => {},
    },
  });
}
