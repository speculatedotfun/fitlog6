import { supabase } from './supabase';
import type { User } from './types';

// Simple and fast auth functions

export async function signUp(email: string, password: string, name: string, role: 'trainer' | 'trainee' = 'trainer') {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Create user record in database
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      name,
      role,
      trainer_id: null,
    })
    .select()
    .single();

  if (userError) {
    console.error('Error creating user record:', userError);
    // User exists in auth, can create record later if needed
  }

  return { user: userData || { id: authData.user.id, email, name, role, trainer_id: null }, session: authData.session };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // Get auth user - this is fast
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Try to get user from database - but don't block if it fails
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    // If user exists in DB, return it
    if (data && !error) {
      return data;
    }

    // If user doesn't exist in DB, create a temp user from auth data
    // This allows the app to work even if DB is slow
    if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
      // Try to create user record in background (don't wait)
      (async () => {
        try {
          await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: (authUser.user_metadata?.role || 'trainer') as 'trainer' | 'trainee',
              trainer_id: null,
            })
            .select()
            .single();
        } catch {
          // Silently fail - user can be created later
        }
      })();

      // Return temp user immediately
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: (authUser.user_metadata?.role || 'trainer') as 'trainer' | 'trainee',
        trainer_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Return temp user if DB query failed for other reasons
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: (authUser.user_metadata?.role || 'trainer') as 'trainer' | 'trainee',
      trainer_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Create trainee account (called by trainer)
export async function createTraineeAccount(
  email: string,
  password: string,
  name: string,
  trainerId: string
) {
  const response = await fetch('/api/trainees/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
      trainerId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create trainee account');
  }

  return await response.json();
}
