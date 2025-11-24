import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in build phase (Next.js sets this during build)
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     (process.env.NODE_ENV === 'production' && !process.env.VERCEL && typeof window === 'undefined');

// Only validate and throw during runtime, not during build
if (!isBuildPhase && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('❌ Supabase credentials are missing!');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
  console.error('Get these from: https://app.supabase.com → Project Settings → API');
  console.error('Current values:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'undefined');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'undefined');
  throw new Error('Supabase credentials are required');
}

// For client-side usage (components)
// During build, use placeholder values if env vars are missing
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
    global: {
      headers: {
        'x-client-info': 'trainer-app',
      },
    },
  }
);

// For server-side usage (API routes, server components)
export function createServerSupabaseClient() {
  if (typeof window !== 'undefined') {
    // Client-side - use browser client
    return supabase;
  }

  // Server-side - this would need cookies, but for now return the browser client
  // In a real app, you'd use createServerClient with cookies here
  return supabase;
}
