# 🔐 הוראות הגדרת אימות (Authentication Setup)

## ✅ מה כבר מוכן:

המערכת מוכנה לחיבור ל-Supabase! כל הקוד כבר נכתב ומתחבר אוטומטית.

## 📋 מה צריך לעשות:

### שלב 1: הוסף קובץ `.env.local` 

צור קובץ חדש בשם `.env.local` בתיקיית הפרויקט עם התוכן הבא:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**איך לקבל את הערכים:**
1. פתח את Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לך ל-**Settings** → **API**
4. העתק:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### שלב 2: וודא שהסכמה רצה ב-Supabase

**חשוב מאוד!** הרץ את `supabase-schema.sql` ב-Supabase:
1. פתח Supabase Dashboard → **SQL Editor**
2. העתק את כל התוכן של `supabase-schema.sql`
3. הדבק והרץ (Run)

### שלב 3: הרץ את השרת

```bash
npm run dev
```

### שלב 4: נסה להירשם כמאמן

1. לך ל-http://localhost:3000/auth/register
2. מלא פרטים והרשם
3. זה יוצר אוטומטית:
   - משתמש ב-Supabase Auth
   - רשומה בטבלת `users`

## 🎯 איך זה עובד:

### הרשמת מאמן:
- `/auth/register` → יוצר משתמש ב-Supabase Auth
- יוצר רשומה בטבלת `users` עם `role='trainer'`
- מפנה ל-`/trainer`

### יצירת מתאמן (על ידי מאמן):
- המאמן נכנס ל-`/trainer`
- לוחץ "הוסף מתאמן חדש"
- ממלא: שם, אימייל, סיסמה
- המערכת יוצרת:
  - משתמש ב-Supabase Auth
  - רשומה בטבלת `users` עם `role='trainee'` ו-`trainer_id` של המאמן

### התחברות:
- `/auth/login` → מאפשר למאמנים ומתאמנים להתחבר
- משתמש ב-Supabase Auth לבדיקת סיסמה
- מקבל את פרטי המשתמש מטבלת `users`

## 🔍 בדיקה:

אחרי ההרשמה, בדוק ב-Supabase:
1. **Authentication** → **Users** - תראה את המשתמש החדש
2. **Table Editor** → **users** - תראה את הרשומה בטבלה

## ⚠️ בעיות נפוצות:

### "Supabase credentials are missing"
**פתרון:** וודא שיש קובץ `.env.local` עם הערכים הנכונים

### "relation 'users' does not exist"
**פתרון:** הרץ את `supabase-schema.sql` ב-Supabase SQL Editor

### "email already exists"
**פתרון:** האימייל כבר קיים. נסה עם אימייל אחר או התחבר במקום להירשם

### "invalid credentials"
**פתרון:** בדוק שהאימייל והסיסמה נכונים

### "Email not confirmed"
**פתרון:** 
1. בדוק את תיבת הדואר האלקטרוני שלך
2. לחץ על הקישור באימייל האימות
3. אם לא קיבלת מייל:
   - בדוק בתיקיית הספאם
   - לך ל-Supabase Dashboard → Authentication → Users → מצא את המשתמש → לחץ "Send email verification"

## 📧 אימות אימייל (Email Confirmation):

**לפי ברירת המחדל ב-Supabase, נדרש אימות אימייל:**
1. אחרי ההרשמה, Supabase שולח מייל אימות אוטומטית
2. יש לבדוק את תיבת הדואר ולחץ על הקישור לאימות
3. רק אחרי האימות אפשר להתחבר

**אם לא מקבלים מייל:**
- לך ל-Supabase Dashboard → Authentication → Users
- מצא את המשתמש שלך
- לחץ על "Send email verification" או "Resend confirmation email"

**לכיבוי אימות אימייל (לפיתוח בלבד):**
1. לך ל-Supabase Dashboard → Authentication → Settings
2. מצא את הסעיף "Email Auth"
3. בטל את הסימון ב-"Enable email confirmations"
4. ⚠️ **אזהרה:** זה רק לפיתוח! בפרודקשן חשוב להשאיר אימות אימייל פעיל

## 📝 הערות חשובות:

1. **כל הנתונים נשמרים ב-Supabase** - גם אימות וגם נתוני אפליקציה
2. **הסיסמה חייבת להיות לפחות 6 תווים**
3. **האימייל משמש כשם משתמש** - צריך להיות ייחודי
4. **אימות אימייל נדרש** - אחרי ההרשמה יש לאשר את האימייל לפני התחברות
5. **מייל אימות נשלח אוטומטית** - Supabase שולח מייל אימות אחרי כל הרשמה
6. **RLS Policies** - וודא ש-RLS מוגדר נכון (ראה `setup-rls-policies.sql`)

## ✅ רשימת בדיקה:

- [ ] קובץ `.env.local` קיים עם הערכים הנכונים
- [ ] הסכמה רצה ב-Supabase (`supabase-schema.sql`)
- [ ] השרת רץ (`npm run dev`)
- [ ] נרשמתי כמאמן בהצלחה
- [ ] יכולתי ליצור מתאמן חדש
- [ ] יכולתי להתחבר עם המתאמן שיצרתי

