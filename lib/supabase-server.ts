import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function createServerSupabaseClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options) => {
          cookieStore.set({ name, value, ...options });
        },
        remove: (name: string, options) => {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
      global: {
        headers: {
          'x-client-info': 'trainer-app',
        },
      },
    }
  );
}

