import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create admin client for server-side operations
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function POST(request: Request) {
  try {
    const { userId, email, name, role, trainerId } = await request.json();

    if (!userId || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use admin client if available, otherwise use regular client
    const client = supabaseAdmin || createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

    // Create user record in users table
    const { data: userData, error: userError } = await client
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        role,
        trainer_id: trainerId || null,
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

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('Error in create user API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

