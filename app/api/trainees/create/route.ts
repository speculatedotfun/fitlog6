import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, name, trainerId } = await request.json();

    if (!email || !password || !name || !trainerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create auth user (this requires service role key in production)
    // For now, we'll create the user directly in the database
    // In production, you might want to use Supabase Admin API
    
    // First, create user record - the auth will be handled separately
    // Or use a server-side service role key to create auth user
    
    // For now, let's use a workaround - create user with a temporary password
    // The trainer will need to tell the trainee their credentials
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'trainee',
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'trainee',
        trainer_id: trainerId,
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
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

