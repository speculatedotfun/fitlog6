# מדריך העברת Mock Data ל-Supabase

## מה בוצע:

### ✅ 1. יצירת קובץ Helper Functions (`lib/db.ts`)
קובץ זה מכיל את כל הפונקציות הדרושות לשאילתות Supabase:
- `getTrainerTrainees()` - קבלת רשימת מתאמנים
- `createTrainee()` - יצירת מתאמן חדש
- `getActiveWorkoutPlan()` - קבלת תוכנית אימונים פעילה
- `getRoutinesWithExercises()` - קבלת אימונים עם תרגילים
- `getWorkoutLogs()` - קבלת לוגי אימונים
- `getBodyWeightHistory()` - היסטוריית משקלים
- `getNutritionMenu()` / `updateNutritionMenu()` - ניהול תפריט תזונה
- ועוד...

### ✅ 2. עדכון דף המאמן הראשי (`app/trainer/page.tsx`)
- החלפת mock data בקריאות אמיתיות ל-Supabase
- הוספת loading states
- הוספת error handling
- פונקציית הוספת מתאמן עובדת עם Supabase

### ⚠️ 3. נדרש עדכון:
- **דף ניהול מתאמן** (`app/trainer/trainee/[id]/page.tsx`) - עדיין משתמש ב-mock data
- **דף דשבורד מתאמן** (`app/trainee/dashboard/page.tsx`)
- **דף אימון מתאמן** (`app/trainee/workout/page.tsx`)
- **דף היסטוריה** (`app/trainee/history/page.tsx`)

## הוראות המשך:

### שלב 1: הפעלת Migration
הפעל את הקובץ `migration-add-nutrition-menu.sql` ב-Supabase SQL Editor:
```sql
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS nutrition_menu JSONB;
```

### שלב 2: עדכון TRAINER_ID
בקובץ `app/trainer/page.tsx`, שנה את:
```typescript
const TRAINER_ID = "trainer-id-here";
```
ל-ID האמיתי של המאמן (או קבל אותו מה-auth context).

### שלב 3: החלפת Mock Data בדף ניהול המתאמן
הקובץ `app/trainer/trainee/[id]/page.tsx` צריך:
1. להוסיף `useEffect` לטעינת נתונים
2. להחליף את כל ה-mock data בקריאות ל-`lib/db.ts`
3. לעדכן את כל הפונקציות לשמירה ב-Supabase

### שלב 4: עדכון דפי המתאמן
כל הדפים ב-`app/trainee/` צריכים:
- טעינת נתונים מ-Supabase
- שמירת נתונים ל-Supabase
- Error handling ו-loading states

## הערות חשובות:

1. **Authentication**: כרגע אין authentication מוגדר. יהיה צורך להוסיף Supabase Auth או להשתמש ב-user ID ידני.

2. **Error Handling**: הוסף try-catch לכל הקריאות ל-Supabase.

3. **Loading States**: הוסף loading indicators בכל מקום שיש קריאה ל-Supabase.

4. **Real-time Updates**: לשקול שימוש ב-Supabase Realtime לעדכונים אוטומטיים.

## קבצים שנוצרו:
- ✅ `lib/db.ts` - כל פונקציות ה-database
- ✅ `migration-add-nutrition-menu.sql` - migration לתפריט תזונה
- ✅ `app/trainer/page.tsx` - עודכן להשתמש ב-Supabase

## מה עוד צריך לעשות:
- [ ] עדכן את `app/trainer/trainee/[id]/page.tsx`
- [ ] עדכן את `app/trainee/dashboard/page.tsx`
- [ ] עדכן את `app/trainee/workout/page.tsx`
- [ ] עדכן את `app/trainee/history/page.tsx`
- [ ] הוסף authentication
- [ ] בדוק את כל ה-error handling

