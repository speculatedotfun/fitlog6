"use server";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix-rls-workout-plans.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sql
    });

    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'RLS policies updated successfully', data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
