import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    console.log('Testing signup with:', { email, name, passwordLength: password?.length });

    // Test Supabase signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({
        success: false,
        error: authError.message,
        errorCode: authError.status,
        details: authError
      }, { status: 400 });
    }

    console.log('Supabase auth success:', authData);

    // Test creating user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user?.id,
        email,
        name: name || email.split('@')[0],
        role: 'trainer',
        trainer_id: null,
      })
      .select()
      .single();

    if (userError) {
      console.error('Database insert error:', userError);
      return NextResponse.json({
        success: false,
        error: 'Auth successful but database insert failed',
        authData,
        dbError: userError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Signup successful!',
      user: userData,
      authUser: authData.user
    });

  } catch (error: any) {
    console.error('Test signup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
