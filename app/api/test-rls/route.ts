"use server";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message, user: null }, { status: 401 });
    }

    // Check if the authenticated user exists in the users table
    const { data: dbUser, error: dbUserError } = user ? await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single() : { data: null, error: null };

    // Test if we can read workout_plans
    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('*')
      .limit(1);

    // Find a valid trainee ID for testing
    const { data: trainees, error: traineesError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'trainee')
      .limit(1);

    let traineeId = null;
    if (trainees && trainees.length > 0) {
      traineeId = trainees[0].id;
    }

    let insertError = null;
    let canInsert = false;

    if (dbUser && traineeId && user) {
      // Test if we can insert a workout plan with valid IDs
      const testPlan = {
        trainee_id: traineeId,
        trainer_id: user.id,
        name: 'Test Plan',
        is_active: false,
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        weekly_target_workouts: 3,
      };

      const { data: insertResult, error: insertErr } = await supabase
        .from('workout_plans')
        .insert(testPlan)
        .select();

      insertError = insertErr;
      canInsert = !insertErr;

      // Clean up test data if it was inserted
      if (insertResult && insertResult.length > 0) {
        await supabase
          .from('workout_plans')
          .delete()
          .eq('id', insertResult[0].id);
      }
    }

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      dbUser: dbUser ? { id: dbUser.id, email: dbUser.email, role: dbUser.role } : null,
      dbUserError: dbUserError?.message,
      traineeId,
      traineesError: traineesError?.message,
      canRead: !plansError,
      readError: plansError?.message,
      canInsert,
      insertError: insertError?.message,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST endpoint to create a test workout plan
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find a valid trainee ID for testing
    const { data: trainees } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'trainee')
      .limit(1);

    if (!trainees || trainees.length === 0) {
      return NextResponse.json({ error: 'No trainees found in database' }, { status: 400 });
    }

    const traineeId = trainees[0].id;

    // Try to create a workout plan using the authenticated user's ID
    const testPlan = {
      trainee_id: traineeId,
      trainer_id: user.id,
      name: 'Test Plan',
      is_active: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      weekly_target_workouts: 3,
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('workout_plans')
      .insert(testPlan)
      .select();

    if (insertError) {
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        testPlan
      }, { status: 500 });
    }

    // Clean up test data
    if (insertResult && insertResult.length > 0) {
      await supabase
        .from('workout_plans')
        .delete()
        .eq('id', insertResult[0].id);
    }

    return NextResponse.json({
      message: 'Test insert successful',
      userId: user.id,
      traineeId,
      testPlan,
      insertResult
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}