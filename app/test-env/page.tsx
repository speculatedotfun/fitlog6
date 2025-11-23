export default function TestEnv() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">בדיקת משתני סביבה</h1>
      <div className="space-y-2">
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined'}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'קיים' : 'undefined'}</p>
      </div>
    </div>
  );
}

