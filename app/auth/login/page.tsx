"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn, getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogOut, Mail, Lock, Eye, EyeOff, User, Dumbbell, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"trainer" | "trainee">("trainer");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingRole, setIsValidatingRole] = useState(false);

  // Redirect if already authenticated (but not if we're validating role)
  useEffect(() => {
    if (!authLoading && user && !isValidatingRole && !loading) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, authLoading, router, isValidatingRole, loading]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary relative" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">בודק התחברות...</p>
        </div>
      </div>
    );
  }

  // Show already logged in state
  if (user && !isValidatingRole && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl border-border bg-card">
          <CardHeader className="text-center space-y-3 pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">אתה כבר מחובר!</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              אתה מחובר כ-<span className="font-semibold text-foreground">{user.name}</span> ({user.role === "trainer" ? "מאמן" : "מתאמן"})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                לחץ על הכפתור כדי לעבור לדף שלך או להתנתק
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    if (user.role === "trainer") {
                      router.push("/trainer");
                    } else {
                      router.push("/trainee/dashboard");
                    }
                  }}
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all"
                >
                  <Dumbbell className="h-4 w-4 ml-2" />
                  עבור לדף שלי
                </Button>
                <Button
                  onClick={async () => {
                    await signOut();
                    router.refresh();
                  }}
                  variant="outline"
                  className="w-full h-12 text-base border-input hover:bg-accent text-muted-foreground transition-all"
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
      
      // Clear any existing session to start fresh
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 200));

      setIsValidatingRole(true);

      // Use API route to avoid CORS issues (server-side auth)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          setError('שגיאה בשרת - תגובה לא תקינה. נסה שוב מאוחר יותר.');
          setIsValidatingRole(false);
          setLoading(false);
          return;
        }
      } else {
        setError(`שגיאה בהתחברות (${response.status}). נסה שוב או פנה לתמיכה.`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      if (!response.ok || !result.success) {
        setError(result?.error || `שגיאה בהתחברות (${response.status})`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      // Get user data and session from API response
      const userData = result.user;
      const accessToken = result.session?.access_token;
      const refreshToken = result.session?.refresh_token;

      // If we have session tokens, set them on the client
      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } catch (sessionErr) {
          console.error('Error setting session:', sessionErr);
        }
      }

      // Wait a moment for session to be set and cookies to sync
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!userData) {
        setError('התחברות הצליחה אבל פרטי המשתמש לא התקבלו. נסה שוב.');
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      // Validate user has a role
      if (!userData.role) {
        await supabase.auth.signOut();
        setError(`שגיאה: תפקיד המשתמש לא מוגדר במסד הנתונים.`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      // Normalize roles for comparison
      const userRoleNormalized = (userData.role || "").trim().toLowerCase();
      const selectedRoleNormalized = (role || "").trim().toLowerCase();

      // Check if the selected role matches the user's actual role
      if (userRoleNormalized !== selectedRoleNormalized) {
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const roleHebrew = role === "trainer" ? "מאמן" : "מתאמן";
        const actualRoleHebrew = userData.role === "trainer" ? "מאמן" : "מתאמן";
        setError(`⚠️ התפקיד שנבחר לא תואם לחשבון שלך.\n\nבחרת: ${roleHebrew}\nהחשבון שלך: ${actualRoleHebrew}\n\nאנא בחר את התפקיד הנכון ונסה שוב.`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      setIsValidatingRole(false);
      
      if (userData.role === "trainer") {
        window.location.href = "/trainer";
      } else if (userData.role === "trainee") {
        window.location.href = "/trainee/dashboard";
      } else {
        await supabase.auth.signOut();
        setError(`שגיאה: תפקיד המשתמש לא מוגדר. התפקיד הנוכחי: ${userData.role || 'לא מוגדר'}`);
        setIsValidatingRole(false);
        setLoading(false);
      }
    } catch (err: any) {
      setIsValidatingRole(false);
      
      if (err.message?.includes("Email not confirmed") || err.message?.includes("email not confirmed")) {
        setError("⚠️ האימייל שלך לא אומת עדיין. אנא בדוק את תיבת הדואר האלקטרוני ולחץ על הקישור לאימות האימייל.\n\nאם לא קיבלת מייל, אפשר לבקש שליחה מחדש.");
      } else {
        setError(err.message || "שגיאה בהתחברות");
      }
    } finally {
      setLoading(false);
      setIsValidatingRole(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header with Logo */}
      <div className="pt-8 pb-4 px-4 text-center">
        <h1 className="text-2xl font-bold">
          <span className="text-foreground">Universal </span>
          <span className="text-primary">FitLog</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-border bg-card">
          <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-3xl font-bold text-foreground">
              כניסה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selector */}
            <div className="flex gap-3 p-1 bg-muted/50 rounded-lg">
              <Button
                type="button"
                variant={role === "trainer" ? "default" : "ghost"}
                className={`flex-1 h-11 font-medium transition-all ${
                  role === "trainer" 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
                onClick={() => {
                  setRole("trainer");
                  setError(null);
                }}
              >
                <User className="h-4 w-4 ml-2" />
                מאמן
              </Button>
              <Button
                type="button"
                variant={role === "trainee" ? "default" : "ghost"}
                className={`flex-1 h-11 font-medium transition-all ${
                  role === "trainee" 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
                onClick={() => {
                  setRole("trainee");
                  setError(null);
                }}
              >
                <Dumbbell className="h-4 w-4 ml-2" />
                מתאמן
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg text-destructive-foreground text-sm whitespace-pre-line">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">{error}</div>
                  </div>
                </div>
              )}
              
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                  דוא"ל
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="Email"
                    required
                    className="pr-10 h-12 text-base bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  סיסמה
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    required
                    className="pr-10 pl-10 h-12 text-base bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  "התחבר"
                )}
              </Button>
            </form>
            
            {/* Links */}
            <div className="space-y-2 text-center">
              <div>
                <Link 
                  href="#" 
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  שכחת סיסמה?
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  אין לך חשבון?{" "}
                  <Link 
                    href="/auth/register" 
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    הירשם
                  </Link>
                </p>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium bg-transparent border-input text-foreground hover:bg-accent hover:border-accent-foreground transition-all"
                onClick={() => {
                  alert('התחברות עם Google - יתווסף בהמשך');
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                    <span className="text-[#4285F4] font-bold text-xs">G</span>
                  </div>
                  התחבר עם Google
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
