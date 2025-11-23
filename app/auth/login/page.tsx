"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn, getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogOut } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"trainer" | "trainee">("trainer");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">בודק התחברות...</p>
        </div>
      </div>
    );
  }

  // Show already logged in state
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">אתה כבר מחובר!</CardTitle>
            <CardDescription>
              אתה מחובר כ-{user.name} ({user.role === "trainer" ? "מאמן" : "מתאמן"})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                לחץ על הכפתור כדי לעבור לדף שלך או להתנתק
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (user.role === "trainer") {
                      router.push("/trainer");
                    } else {
                      router.push("/trainee/dashboard");
                    }
                  }}
                  className="w-full"
                >
                  עבור לדף שלי
                </Button>
                <Button
                  onClick={async () => {
                    await signOut();
                    router.refresh();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 ml-2" />
                  התנתק
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login for:', email);

      // Sign in using Supabase directly
      console.log('Attempting sign in for:', email);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        setError(signInError.message);
        return;
      }

      console.log('Sign in successful:', data.user?.id);
      console.log('Session data:', data.session);

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify session was created
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { session: !!sessionData.session, error: sessionError });

      if (!sessionData.session) {
        setError('התחברות הצליחה אבל הסשן לא נוצר. נסה שוב.');
        return;
      }

      console.log('Getting user data from database...');

      // Add timeout to prevent infinite hanging
      const getUserWithTimeout = async (timeoutMs: number = 5000) => {
        return Promise.race([
          getCurrentUser(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('User data fetch timeout')), timeoutMs)
          )
        ]);
      };

      let userData;

      try {
        // Get user data from database with timeout
        userData = await getUserWithTimeout(3000);
        console.log('User data from database:', userData);

        // Retry once if needed
        if (!userData) {
          console.log('Retrying user data fetch...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Calling getCurrentUser again...');
          userData = await getUserWithTimeout(3000);
          console.log('User data after retry:', userData);
        }
      } catch (timeoutError) {
        console.error('User data fetch timed out:', timeoutError);
        setError('התחברות הצליחה אבל טעינת פרטי המשתמש נכשלה. נסה שוב.');
        setLoading(false);
        return;
      }

      // If still no user data, check if user exists in auth but not in users table
      if (!userData) {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // User exists in auth but not in users table - this is a data issue
          setError(`⚠️ המשתמש קיים ב-Auth אבל לא בטבלת users. זה קורההרשמה נכשלת חלקית.\n\nפתרונות:\n1. בדוק ב-Supabase Dashboard → Table Editor → users אם המשתמש קיים\n2. אם לא - צור את המשתמש ידנית בטבלת users עם אותו ID מה-Auth\n3. או נסה להירשם מחדש עם אימייל אחר`);
          console.error("User exists in auth but not in users table:", authUser.id);
        } else {
          setError("שגיאה בטעינת פרטי המשתמש. נסה לרענן את הדף.");
        }
        setLoading(false);
        return;
      }

      console.log("User logged in:", userData); // Debug log
      console.log("User role:", userData.role); // Debug log

      // Redirect based on role
      if (userData.role === "trainer") {
        console.log('Redirecting to trainer page...');
        router.push("/trainer");
      } else if (userData.role === "trainee") {
        console.log('Redirecting to trainee dashboard...');
        router.push("/trainee/dashboard");
      } else {
        setError(`שגיאה: תפקיד המשתמש לא מוגדר. התפקיד הנוכחי: ${userData.role || 'לא מוגדר'}`);
        console.error("User role is not trainer or trainee:", userData);
      }
    } catch (err: any) {
      console.error("Login error:", err); // Debug log
      
      // Check if error is about email not confirmed
      if (err.message?.includes("Email not confirmed") || err.message?.includes("email not confirmed")) {
        setError("⚠️ האימייל שלך לא אומת עדיין. אנא בדוק את תיבת הדואר האלקטרוני ולחץ על הקישור לאימות האימייל.\n\nאם לא קיבלת מייל, אפשר לבקש שליחה מחדש.");
      } else {
        setError(err.message || "שגיאה בהתחברות");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">התחברות</CardTitle>
          <CardDescription>התחבר לחשבון שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={role === "trainer" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("trainer")}
            >
              מאמן
            </Button>
            <Button
              type="button"
              variant={role === "trainee" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("trainee")}
            >
              מתאמן
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm whitespace-pre-line">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">סיסמה</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  מתחבר...
                </>
              ) : (
                "התחבר"
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              אין לך חשבון?{" "}
              <Link href="/auth/register" className="text-blue-600 hover:underline">
                הירשם כאן
              </Link>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              חזור לדף הבית
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

