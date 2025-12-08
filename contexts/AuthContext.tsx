"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Helper to cache user data in sessionStorage
    const cacheUser = (userData: User) => {
      try {
        sessionStorage.setItem('cached_user', JSON.stringify({
          user: userData,
          timestamp: Date.now(),
        }));
      } catch (e) {
        // Ignore storage errors (e.g., in private mode)
      }
    };

    // Helper to get cached user data
    const getCachedUser = (): User | null => {
      try {
        const cached = sessionStorage.getItem('cached_user');
        if (!cached) return null;
        
        const { user: cachedUser, timestamp } = JSON.parse(cached);
        // Cache is valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return cachedUser;
        }
        return null;
      } catch {
        return null;
      }
    };

    // Initial load - check session first
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (!session?.user) {
          // No session - user is not logged in
          setUser(null);
          setLoading(false);
          // Clear cache
          try {
            sessionStorage.removeItem('cached_user');
          } catch {}
          return;
        }

        // Check cache first
        const cachedUser = getCachedUser();
        if (cachedUser && cachedUser.id === session.user.id) {
          setUser(cachedUser);
          setLoading(false);
          // Still refresh in background
          getCurrentUser()
            .then((currentUser) => {
              if (mounted && currentUser) {
                setUser(currentUser);
                cacheUser(currentUser);
              }
            })
            .catch(() => {
              // Silently fail - use cached user
            });
          return;
        }

        // Session exists - create user from auth data immediately
        const tempUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: (session.user.user_metadata?.role || 'trainer') as 'trainer' | 'trainee',
          trainer_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Set user first, then use a useEffect-like pattern to end loading
        // This ensures user is set before loading becomes false
        setUser(tempUser);
        // Use queueMicrotask to ensure user state update is processed first
        queueMicrotask(() => {
          if (mounted) {
            setLoading(false);
          }
        });

        // Load real user data from DB in background (non-blocking)
        getCurrentUser()
          .then((currentUser) => {
            if (mounted && currentUser) {
              setUser(currentUser);
              cacheUser(currentUser);
            }
          })
          .catch(() => {
            // Keep temp user - app continues to work
          });
      } catch {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // Helper to cache user data
          const cacheUser = (userData: User) => {
            try {
              sessionStorage.setItem('cached_user', JSON.stringify({
                user: userData,
                timestamp: Date.now(),
              }));
            } catch (e) {
              // Ignore storage errors
            }
          };

          // Create user from auth data first
          const tempUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: (session.user.user_metadata?.role || 'trainer') as 'trainer' | 'trainee',
            trainer_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          // Set user first, then end loading
          setUser(tempUser);
          queueMicrotask(() => {
            if (mounted) {
              setLoading(false);
            }
          });
        }
        
        // Load real user data from DB in background
        getCurrentUser()
          .then((currentUser) => {
            if (mounted && currentUser) {
              setUser(currentUser);
              // Cache the user data
              try {
                sessionStorage.setItem('cached_user', JSON.stringify({
                  user: currentUser,
                  timestamp: Date.now(),
                }));
              } catch (e) {
                // Ignore storage errors
              }
            }
          })
          .catch(() => {
            // Silently fail
          });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    // Clear cache
    try {
      sessionStorage.removeItem('cached_user');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
