"use server";

import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    supabaseUrl: {
      exists: !!supabaseUrl,
      value: supabaseUrl ? 'Set' : 'Not set',
      length: supabaseUrl?.length || 0
    },
    supabaseKey: {
      exists: !!supabaseKey,
      value: supabaseKey ? 'Set' : 'Not set',
      length: supabaseKey?.length || 0
    }
  });
}
