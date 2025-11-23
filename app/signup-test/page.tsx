"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || email.split('@')[0]
        }),
      });

      const data = await response.json();
      setResult(data);

    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        <Card>
          <CardHeader>
            <CardTitle>בדיקת הרשמה - דיאגנוסטיקה</CardTitle>
            <CardDescription>
              בודק בדיוק מה קורה כשאתה מנסה להירשם
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>פרטי הרשמה לבדיקה</CardTitle>
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
              <label className="block text-sm font-medium mb-2">סיסמה (לפחות 6 תווים)</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמה"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">שם (אופציונלי)</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="השם שלך"
              />
            </div>
            <Button onClick={testSignup} disabled={loading} className="w-full">
              {loading ? 'בודק...' : 'בדוק הרשמה'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? "border-green-500" : "border-red-500"}>
            <CardHeader>
              <CardTitle className={result.success ? "text-green-900" : "text-red-900"}>
                {result.success ? "✅ הצליח!" : "❌ נכשל"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">🔍 סיבות אפשריות לשגיאה 422:</h3>
            <div className="space-y-2 text-sm">
              <div>• <strong>אימייל כבר קיים:</strong> המשתמש עדיין קיים ב-Supabase Auth</div>
              <div>• <strong>סיסמה קצרה מדי:</strong> חייבת להיות לפחות 6 תווים</div>
              <div>• <strong>אימייל לא תקין:</strong> בדוק שהאימייל בפורמט נכון</div>
              <div>• <strong>דומיין חסום:</strong> חלק מדומייני האימייל חסומים</div>
              <div>• <strong>יותר מדי ניסיונות:</strong> חכה קצת בין ניסיונות</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
