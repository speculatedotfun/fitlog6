import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Create server-side Supabase client with cookies
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

    // 1. Security: Verify the requesting user
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verify the user is a trainer (optional but recommended)
    const { data: trainerProfile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', currentUser.id)
      .eq('role', 'trainer')
      .single();

    if (profileError || !trainerProfile) {
      return NextResponse.json(
        { error: 'Only trainers can create trainee accounts' },
        { status: 403 }
      );
    }

    // 3. Get request body (without trainerId - we use the authenticated user's ID)
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      );
    }

    // 4. Create auth user
    const { data: authData, error: authError: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'trainee',
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // 5. Create user record in database with authenticated trainer's ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'trainee',
        trainer_id: currentUser.id, // Use authenticated user's ID, not from request body!
      })
      .select()
      .single();

    if (userError) {
      // Try to delete auth user if user creation fails
      // Note: This might not work without admin privileges
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('Error creating trainee:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

