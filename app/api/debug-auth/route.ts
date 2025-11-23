import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Check current session using the main supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Get cookies for debugging
    const cookieStore = await cookies();
    const supabaseCookies = cookieStore.getAll().filter(cookie =>
      cookie.name.includes('supabase') || cookie.name.includes('sb-')
    );

    // Check if user exists in database
    let dbUser = null;
    let dbError = null;
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      dbUser = data;
      dbError = error;
    }

    return NextResponse.json({
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role
        } : null,
        expires_at: session?.expires_at,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        role: user?.user_metadata?.role,
        error: userError?.message
      },
      database: {
        user: dbUser,
        error: dbError?.message
      },
      cookies: supabaseCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value.substring(0, 50) + '...', // truncate for security
        hasValue: !!cookie.value
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in debug-auth:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
