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

// ============= CACHE HELPERS (extracted to eliminate duplication) =============

interface CachedUserData {
  user: User;
  timestamp: number;
}

const CACHE_KEY = 'cached_user';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function cacheUser(userData: User): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      user: userData,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors (e.g., private mode, quota exceeded)
  }
}

function getCachedUser(): User | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { user, timestamp }: CachedUserData = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return user;
    }
    
    // Cache expired
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function clearUserCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
}

// ============= AUTH PROVIDER =============

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Helper to load user data from database (with caching)
    async function loadUserFromDB(userId: string): Promise<void> {
      try {
        const currentUser = await getCurrentUser();
        if (mounted && currentUser) {
          setUser(currentUser);
          cacheUser(currentUser);
        }
      } catch {
        // Silently fail - temp user or cached user continues to work
      }
    }

    // Helper to create temporary user from auth session
    function createTempUser(session: any): User {
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        role: (session.user.user_metadata?.role || 'trainer') as 'trainer' | 'trainee',
        trainer_id: null,
        profile_image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Initialize auth state
    async function initAuth(): Promise<void> {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (!session?.user) {
          // No session - user not logged in
          setUser(null);
          setLoading(false);
          clearUserCache();
          return;
        }

        // Check cache first for instant load
        const cachedUser = getCachedUser();
        if (cachedUser && cachedUser.id === session.user.id) {
          setUser(cachedUser);
          setLoading(false);
          // Refresh in background to get latest data
          loadUserFromDB(session.user.id);
          return;
        }

        // No valid cache - create temp user for immediate UI render
        const tempUser = createTempUser(session);
        setUser(tempUser);
        setLoading(false);
        
        // Load real user data in background
        loadUserFromDB(session.user.id);
      } catch {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    // Start initialization
    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        clearUserCache();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // Create temp user for immediate UI render
          const tempUser = createTempUser(session);
          setUser(tempUser);
          setLoading(false);
          
          // Load real user data in background
          loadUserFromDB(session.user.id);
        }
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
    clearUserCache();
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