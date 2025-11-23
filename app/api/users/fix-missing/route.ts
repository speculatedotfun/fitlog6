import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, email, name, role } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json({ user: existingUser, message: 'User already exists' });
    }

    // Create user record with provided data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: name || email.split('@')[0],
        role: role || 'trainer',
        trainer_id: null,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: userError.message || 'Failed to create user record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: userData, message: 'User created successfully' });
  } catch (error: any) {
    console.error('Error in fix missing user API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

