"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export default function DiagnosticPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setResult({ success: false, error: authError.message, step: 'auth' });
        return;
      }

      // Test database lookup
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        setResult({
          success: false,
          error: userError.message,
          step: 'database',
          authSuccess: true,
          userId: authData.user.id
        });
        return;
      }

      setResult({
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name
        }
      });

    } catch (error: any) {
      setResult({ success: false, error: error.message, step: 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  const checkUsers = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        setResult({ success: false, error: error.message, step: 'database_check' });
        return;
      }

      setResult({
        success: true,
        users: users?.map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name: u.name
        })) || [],
        step: 'database_check'
      });

    } catch (error: any) {
      setResult({ success: false, error: error.message, step: 'database_check' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <Card>
          <CardHeader>
            <CardTitle>דיאגנוסטיקה - פתרון בעיות לוגין</CardTitle>
            <CardDescription>
              בדיקה של חיבור למסד נתונים ואימות
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Test Login */}
        <Card>
          <CardHeader>
            <CardTitle>בדיקת לוגין</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">סיסמה</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testLogin} disabled={loading}>
                {loading ? 'בודק...' : 'בדוק לוגין'}
              </Button>
              <Button onClick={checkUsers} disabled={loading} variant="outline">
                {loading ? 'בודק...' : 'ראה משתמשים'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className={result.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className={result.success ? "text-green-900" : "text-red-900"}>
                {result.success ? "✅ הצליח!" : "❌ נכשל"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">🔍 מה עלול להיות הבעיה?</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. אימייל לא אומת:</strong> אם הרשמת משתמש חדש, בדוק אם קיבלת מייל אימות מ-Supabase.
                אם כן, לחץ על הקישור באימייל לפני שתנסה להתחבר.
              </div>
              <div>
                <strong>2. סיסמה שגויה:</strong> וודא שאתה משתמש באותה סיסמה שהשתמשת בה ברישום.
              </div>
              <div>
                <strong>3. משתמש לא קיים:</strong> אם הרשמת משתמש אבל הוא לא מופיע ברשימת המשתמשים,
                יש בעיה ביצירת המשתמש במסד הנתונים.
              </div>
              <div>
                <strong>4. הגדרות Supabase:</strong> בדוק ב-Supabase Dashboard → Authentication → Settings
                שאימות אימייל מופעל או כבוי (תלוי אם אתה רוצה אימות אימייל).
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
