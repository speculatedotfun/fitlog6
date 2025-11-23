# הוראות התקנה והעברת Mock Data ל-Supabase

## שלב 1: הוספת Column לתפריט תזונה ב-Supabase

### מה לעשות:
1. פתח את Supabase Dashboard שלך: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לחץ על **SQL Editor** בתפריט השמאלי
4. פתח את הקובץ `migration-add-nutrition-menu.sql`
5. העתק את התוכן:
   ```sql
   ALTER TABLE workout_plans 
   ADD COLUMN IF NOT EXISTS nutrition_menu JSONB;
   ```
6. הדבק ב-SQL Editor
7. לחץ על **Run** (או Ctrl+Enter)
8. תוודא שהשאילתה הצליחה

✅ **זהו! ה-column נוסף לטבלה.**

---

## שלב 2: בדיקת משתני סביבה (.env)

### מה לבדוק:
1. וודא שיש לך קובץ `.env.local` בתיקיית הפרויקט
2. הקובץ צריך להכיל:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. אם אין לך - הוסף את הערכים מ-Supabase Dashboard → Settings → API

✅ **אם המשתנים קיימים, אפשר להמשיך לשלב הבא.**

---

## שלב 3: עדכון ID של המאמן

### מה לעשות:
1. פתח את Supabase Dashboard → Table Editor
2. פתח את הטבלה `users`
3. מצא את השורה של המאמן שלך (role = 'trainer')
4. העתק את ה-ID (העמודה הראשונה, UUID)
5. פתח את הקובץ `app/trainer/page.tsx`
6. מצא את השורה:
   ```typescript
   const TRAINER_ID = "trainer-id-here";
   ```
7. החלף ל:
   ```typescript
   const TRAINER_ID = "הה-ID-שהעתקת-כאן";
   ```

✅ **המאמן מוגדר כעת.**

---

## שלב 4: בדיקה ראשונית

### מה לעשות:
1. הפעל את השרת:
   ```bash
   npm run dev
   ```
2. פתח את הדפדפן: http://localhost:3000/trainer
3. בדוק שאתה רואה את הדף של המאמן
4. נסה להוסיף מתאמן חדש

⚠️ **אם יש שגיאות בקונסול, בדוק:**
- שה-migration בוצע (שלב 1)
- שמשתני הסביבה נכונים (שלב 2)
- שה-ID של המאמן נכון (שלב 3)

---

## שלב 5: יצירת נתונים ראשוניים ב-Supabase (אופציונלי)

אם אין לך נתונים ב-Supabase, תוכל ליצור אותם ידנית:

### א. יצירת מאמן:
1. פתח Table Editor → `users`
2. לחץ על "Insert row"
3. מלא:
   - `name`: שם המאמן
   - `email`: אימייל
   - `role`: `trainer`
   - `trainer_id`: השאר NULL
4. שמור

### ב. יצירת מתאמן:
1. פתח Table Editor → `users`
2. לחץ על "Insert row"
3. מלא:
   - `name`: שם המתאמן
   - `email`: אימייל
   - `role`: `trainee`
   - `trainer_id`: העתק את ה-ID של המאמן
4. שמור

### ג. יצירת תרגילים ראשוניים:
1. פתח Table Editor → `exercise_library`
2. הוסף תרגילים, לדוגמה:
   - `name`: "סקוואט בסמיט"
   - `muscle_group`: "רגליים"
   - `image_url`: (אופציונלי) URL לתמונה
   - `special_instructions`: (אופציונלי) הוראות

---

## שלב 6: מה עובד כרגע?

### ✅ עובד:
- דף המאמן הראשי (`/trainer`)
  - טעינת רשימת מתאמנים מ-Supabase
  - הוספת מתאמן חדש ל-Supabase
  - הצגת סטטוס של מתאמנים

### ⚠️ עדיין לא עובד (צריך עדכון):
- דף ניהול מתאמן (`/trainer/trainee/[id]`)
- דף דשבורד מתאמן (`/trainee/dashboard`)
- דף אימון (`/trainee/workout`)
- דף היסטוריה (`/trainee/history`)

---

## שאלות נפוצות:

### Q: איך אני יודע שה-migration הצליח?
**A:** ב-SQL Editor, אחרי הרצת השאילתה, תראה הודעה "Success. No rows returned" או "Success".

### Q: מה אם יש לי שגיאה "column does not exist"?
**A:** זה אומר שה-migration לא בוצע. חזור לשלב 1 והריץ את ה-migration שוב.

### Q: איך אני מקבל את ה-URL וה-Key של Supabase?
**A:** 
1. פתח Supabase Dashboard
2. בחר פרויקט
3. Settings → API
4. העתק:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Q: האם אני צריך להפעיל את השרת מחדש אחרי שינוי .env?
**A:** כן! עצור את השרת (Ctrl+C) והפעל שוב (`npm run dev`).

---

## מה הלאה?

לאחר שסיימת את כל השלבים:
1. נסה להוסיף מתאמן חדש דרך הממשק
2. בדוק שהוא נראה בטבלת `users` ב-Supabase
3. המשך לעדכון הקבצים הנוספים (אם תרצה)

זה כל מה שצריך! 🎉

