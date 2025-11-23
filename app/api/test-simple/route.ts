import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Ignore cookie errors in API routes
              }
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({
      message: "API works with SSR client",
      timestamp: new Date().toISOString(),
      session: !!session,
      user: !!user,
      userId: user?.id,
      cookies: cookieStore.getAll().filter(c => c.name.includes('sb-')).length
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
