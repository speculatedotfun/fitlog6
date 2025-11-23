"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Don't show register form if already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">מעביר...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password, name, "trainer");
      
      // Check if email confirmation is needed
      if (result.session === null) {
        // Email confirmation required - show message
        setError(null);
        alert("✅ ההרשמה הצליחה! אנא בדוק את תיבת הדואר האלקטרוני שלך ואשר את האימייל לפני ההתחברות.\n\n📧 מייל אימות נשלח ל: " + email);
        router.push("/auth/login");
        return;
      }
      
      router.push("/trainer");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">הרשמה למאמן</CardTitle>
          <CardDescription>צור חשבון מאמן חדש</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">שם מלא</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם מלא"
                required
              />
            </div>
            
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
                placeholder="לפחות 6 תווים"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">אימות סיסמה</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="הזן שוב את הסיסמה"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  נרשם...
                </>
              ) : (
                "הירשם"
              )}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            <p className="font-medium mb-1">📧 חשוב:</p>
            <p>אחרי ההרשמה, תישלח אליך הודעת אימייל לאימות החשבון. יש לבדוק את תיבת הדואר ולחץ על הקישור לאימות לפני ההתחברות.</p>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              כבר יש לך חשבון?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                התחבר כאן
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

