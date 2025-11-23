"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "trainer" | "trainee";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Wait for loading to complete
    if (loading) {
      setRedirecting(false);
      return;
    }

    // Don't redirect if already redirecting
    if (redirecting) return;

    // Small delay to ensure React has processed all state updates
    // This prevents race condition where loading=false but user is still null
    const timeoutId = setTimeout(() => {
      if (!user) {
        setRedirecting(true);
        router.push("/auth/login");
      } else if (user && requiredRole && user.role !== requiredRole) {
        setRedirecting(true);
        // Redirect to appropriate dashboard
        if (user.role === "trainer") {
          router.push("/trainer");
        } else {
          router.push("/trainee/dashboard");
        }
      }
    }, 300); // Delay to ensure state is fully settled and user is loaded

    return () => clearTimeout(timeoutId);
  }, [user, loading, router, requiredRole, redirecting]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

