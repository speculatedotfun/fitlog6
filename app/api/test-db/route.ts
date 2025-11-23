import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Database tables may not exist. Please run the SQL schema in Supabase.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      userCount: users?.length || 0,
      users: users?.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        name: u.name
      })) || []
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'Make sure you have run the SQL schema in Supabase Dashboard'
    }, { status: 500 });
  }
}