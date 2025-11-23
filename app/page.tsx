"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to appropriate dashboard
    if (!loading && user) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Don't show home page if user is logged in (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">מעביר...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl mb-2">Universal FitLog</CardTitle>
          <CardDescription className="text-lg">
            פלטפורמה לניהול אימונים ותזונה
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/auth/login">
            <Button size="lg" className="w-full">
              התחברות
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="w-full">
              הרשמה למאמן
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
