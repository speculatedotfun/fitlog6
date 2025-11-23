import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Authentication failed'
      }, { status: 401 });
    }

    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'User authenticated but not found in database',
        authUser: {
          id: data.user.id,
          email: data.user.email
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.name
      },
      session: !!data.session
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
