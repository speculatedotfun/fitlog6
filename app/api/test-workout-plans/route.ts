import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Test basic workout_plans query
    const { data: allPlans, error: allError } = await supabase
      .from('workout_plans')
      .select('*')
      .limit(5);

    // Test with boolean filter
    const { data: activePlans, error: activeError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    // Test specific trainee query (using a dummy ID)
    const testTraineeId = '87f3366b-0130-448a-99d0-07b317d89ae8';
    const { data: traineePlans, error: traineeError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('trainee_id', testTraineeId)
      .limit(5);

    // Test the exact failing query
    const { data: exactQuery, error: exactError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('trainee_id', testTraineeId)
      .eq('is_active', true);

    return NextResponse.json({
      allPlans: {
        count: allPlans?.length || 0,
        error: allError?.message,
        code: allError?.code
      },
      activePlans: {
        count: activePlans?.length || 0,
        error: activeError?.message,
        code: activeError?.code
      },
      traineePlans: {
        count: traineePlans?.length || 0,
        error: traineeError?.message,
        code: traineeError?.code
      },
      exactQuery: {
        count: exactQuery?.length || 0,
        error: exactError?.message,
        code: exactError?.code,
        data: exactQuery
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
