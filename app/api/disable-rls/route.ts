"use server";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Disable RLS temporarily for testing
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE workout_plans DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.error('Error disabling RLS:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'RLS disabled for workout_plans table' });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
