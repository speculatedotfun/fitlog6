"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthTestPage() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('Checking auth status...');

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session data:', sessionData);
        console.log('Session error:', sessionError);
        setSession(sessionData);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('User data:', userData);
        console.log('User error:', userError);
        setUser(userData);

        // Check cookies
        if (typeof document !== 'undefined') {
          const cookies = document.cookie;
          console.log('Cookies:', cookies);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session);
      setSession({ session });
      setUser({ user: session?.user });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Authentication Test</h1>

      <h2>Session</h2>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      <h2>User</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h2>Actions</h2>
      <button
        onClick={async () => {
          const { data, error } = await supabase.auth.getSession();
          console.log('Manual session check:', data, error);
          alert('Check console for session data');
        }}
        style={{ marginRight: '10px', padding: '10px' }}
      >
        Check Session
      </button>

      <button
        onClick={async () => {
          console.log('Testing workout plans query...');
          const testTraineeId = '87f3366b-0130-448a-99d0-07b317d89ae8';

          try {
            // Test different query variations
            console.log('Testing query without boolean filter...');
            const { data: data1, error: error1 } = await supabase
              .from('workout_plans')
              .select('*')
              .eq('trainee_id', testTraineeId);

            console.log('Without boolean:', { data: data1, error: error1 });

            console.log('Testing query with boolean filter...');
            const { data: data2, error: error2 } = await supabase
              .from('workout_plans')
              .select('*')
              .eq('trainee_id', testTraineeId)
              .eq('is_active', true);

            console.log('With boolean:', { data: data2, error: error2 });

            console.log('Testing basic query...');
            const { data: data3, error: error3 } = await supabase
              .from('workout_plans')
              .select('*')
              .limit(5);

            console.log('Basic query:', { data: data3, error: error3 });

            alert(`Queries tested - check console for details`);
          } catch (err) {
            console.error('Client-side query error:', err);
            alert(`Error: ${err}`);
          }
        }}
        style={{ padding: '10px' }}
      >
        Test Workout Plans Query
      </button>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          alert('Signed out');
          window.location.reload();
        }}
        style={{ padding: '10px' }}
      >
        Sign Out
      </button>
    </div>
  );
}
