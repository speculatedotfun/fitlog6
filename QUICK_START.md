# 🚀 התחלה מהירה - 4 שלבים בלבד!

## ⚠️ חשוב: צריך להריץ את כל הסכמה ב-Supabase!

## שלב 1: הרץ את כל הסכמה ב-Supabase (5 דקות)

1. פתח Supabase Dashboard → SQL Editor
2. פתח את הקובץ `supabase-schema.sql`
3. **העתק את כל התוכן** (כל הקובץ!)
4. הדבק ב-SQL Editor
5. לחץ Run ✅

זה יוצר את כל הטבלאות, Indexes, Triggers ונתוני התחלה!

---

## שלב 2: הוסף Column לתפריט תזונה (אם צריך)

אם הסכמה רצה בהצלחה, הוסף גם:
```sql
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS nutrition_menu JSONB;
```

## שלב 3: בדוק את ה-.env (1 דקה)

פתח `.env.local` וודא שיש:
```
NEXT_PUBLIC_SUPABASE_URL=הכתובת שלך
NEXT_PUBLIC_SUPABASE_ANON_KEY=המפתח שלך
```

---

## שלב 4: עדכן את ID המאמן (1 דקה)

1. פתח `app/trainer/page.tsx`
2. מצא את השורה: `const TRAINER_ID = "trainer-id-here";`
3. החלף ב-ID האמיתי שלך מ-Supabase (Table Editor → users)

---

## ✅ זהו! עכשיו תוכל:

- לראות את המתאמנים שלך ב-`/trainer`
- להוסיף מתאמן חדש
- הכל מתחבר ל-Supabase!

---

## 📖 הוראות מפורטות:

- `SUPABASE_FULL_SETUP.md` - הוראות מפורטות לבניית כל הסכמה
- `SETUP_INSTRUCTIONS.md` - הוראות כללית

