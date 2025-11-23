# 🗄️ הוראות בניית הסכמה המלאה ב-Supabase

## ⚠️ חשוב: צריך להריץ את כל הסכמה, לא רק חלק!

---

## שלב 1: הרצת הסכמה המלאה (חובה!)

### מה לעשות:
1. פתח Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לחץ על **SQL Editor** בתפריט השמאלי
4. פתח את הקובץ `supabase-schema.sql`
5. **העתק את כל התוכן** (כל הקובץ!)
6. הדבק ב-SQL Editor
7. לחץ על **Run** (או Ctrl+Enter)

### מה הסכמה כוללת:
- ✅ 9 טבלאות:
  - `users` - משתמשים (מאמנים ומתאמנים)
  - `exercise_library` - מאגר תרגילים
  - `workout_plans` - תוכניות אימונים
  - `routines` - אימונים (A, B, C...)
  - `routine_exercises` - תרגילים בתוכנית
  - `workout_logs` - לוגי אימונים
  - `set_logs` - לוגי סטים
  - `nutrition_swaps` - מאגר המרות תזונה
  - `daily_nutrition_logs` - לוגי תזונה יומיים

- ✅ Indexes לביצועים
- ✅ Triggers לעדכון תאריכים
- ✅ Row Level Security (RLS)
- ✅ נתוני התחלה (nutrition_swaps עם מזונות)

✅ **לאחר ההרצה, כל הטבלאות נוצרו!**

---

## שלב 2: הוספת Column לתפריט תזונה (אופציונלי)

אם הסכמה כבר רצה לפני, או שאתה מעדכן סכמה קיימת:

1. ב-SQL Editor, העתק והדבק:
```sql
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS nutrition_menu JSONB;
```

2. לחץ Run

✅ **עכשיו גם תפריט התזונה מוכן!**

---

## שלב 3: בדיקה שהכל נוצר

### בדוק ב-Table Editor:
1. פתח **Table Editor** ב-Supabase
2. תראה את כל הטבלאות ברשימה השמאלית:
   - ✅ users
   - ✅ exercise_library
   - ✅ workout_plans
   - ✅ routines
   - ✅ routine_exercises
   - ✅ workout_logs
   - ✅ set_logs
   - ✅ nutrition_swaps
   - ✅ daily_nutrition_logs

3. פתח את `nutrition_swaps` - תראה שיש כבר נתונים!

---

## שלב 4: בדיקת משתני סביבה (.env)

פתח `.env.local` (או `.env`) וודא שיש:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

אם אין - הוסף מ-Supabase Dashboard → Settings → API

---

## שלב 5: יצירת משתמשים ראשוניים

### א. יצירת מאמן:
1. פתח Table Editor → `users`
2. לחץ "Insert row"
3. מלא:
   - `name`: שם המאמן
   - `email`: אימייל ייחודי
   - `role`: `trainer`
   - `trainer_id`: השאר **NULL** (השדה ריק)
4. שמור - העתק את ה-ID שנוצר!

### ב. יצירת מתאמן:
1. פתח Table Editor → `users`
2. לחץ "Insert row"
3. מלא:
   - `name`: שם המתאמן
   - `email`: אימייל ייחודי
   - `role`: `trainee`
   - `trainer_id`: **הדבק את ה-ID של המאמן** (שלב א')
4. שמור

---

## שלב 6: עדכון TRAINER_ID בקוד

1. פתח `app/trainer/page.tsx`
2. מצא: `const TRAINER_ID = "trainer-id-here";`
3. החלף ב-ID של המאמן (העתקת בשלב 5)

---

## ✅ סיכום - מה צריך להריץ:

1. **`supabase-schema.sql`** - כל הסכמה (חובה!)
2. **`migration-add-nutrition-menu.sql`** - רק אם הסכמה לא כוללת את זה (אופציונלי)

---

## ⚠️ שגיאות נפוצות:

### "relation already exists"
**פתרון:** הטבלה כבר קיימת. זה בסדר! המשך לשלב הבא.

### "column nutrition_menu does not exist"
**פתרון:** הרץ את ה-migration של nutrition_menu (שלב 2)

### "permission denied"
**פתרון:** וודא שהרצת את כל הסכמה כולל RLS Policies

---

## 📝 הערות:

- הסכמה כוללת RLS (Row Level Security) - זה אומר שתצטרך להגדיר Policies כדי שהאפליקציה תוכל לגשת לנתונים
- כרגע, אם RLS מופעל, ייתכן שתצטרך להשבית אותו זמנית לבדיקה או להוסיף Policies

### להשבית RLS זמנית (רק לבדיקה):
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library DISABLE ROW LEVEL SECURITY;
-- ... וכך הלאה לכל הטבלאות
```

**אך זה לא מומלץ לייצור!** עדיף להוסיף Policies מתאימות.

---

## 🎉 אחרי כל זה:

1. הפעל את השרת: `npm run dev`
2. פתח: `http://localhost:3000/trainer`
3. הכל אמור לעבוד! 🚀

