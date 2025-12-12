# הוראות מהירות להגדרת Policy להעלאת תמונות

## שלב 1: יצירת Policy חדשה

1. ב-Supabase Dashboard, לך ל-**Storage** → **avatars** → **Policies**
2. לחץ על **New Policy**

## שלב 2: הגדרת Policy להעלאת תמונות

### Policy 1: העלאת תמונות (INSERT)

**Policy name:** `Users can upload their own profile images`

**Allowed operation:** 
- ✅ **INSERT** (חובה לסמן!)
- ❌ SELECT (לא צריך)
- ❌ UPDATE (לא צריך)
- ❌ DELETE (לא צריך)

**Target roles:**
- בחר **authenticated** (משתמשים מחוברים)

**Policy definition:**
```sql
(bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[2])
```

לחץ **Review** ואז **Save policy**

---

### Policy 2: קריאת תמונות (SELECT) - גישה ציבורית

**Policy name:** `Public read access for profile images`

**Allowed operation:**
- ✅ **SELECT** (חובה לסמן!)
- ❌ INSERT
- ❌ UPDATE
- ❌ DELETE

**Target roles:**
- השאר **public** (כל אחד יכול לקרוא)

**Policy definition:**
```sql
(bucket_id = 'avatars')
```

לחץ **Review** ואז **Save policy**

---

### Policy 3: עדכון תמונות (UPDATE) - אופציונלי

**Policy name:** `Users can update their own profile images`

**Allowed operation:**
- ✅ **UPDATE** (חובה לסמן!)
- ❌ SELECT
- ❌ INSERT
- ❌ DELETE

**Target roles:**
- בחר **authenticated**

**Policy definition:**
```sql
(bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[2])
```

לחץ **Review** ואז **Save policy**

---

### Policy 4: מחיקת תמונות (DELETE) - אופציונלי

**Policy name:** `Users can delete their own profile images`

**Allowed operation:**
- ✅ **DELETE** (חובה לסמן!)
- ❌ SELECT
- ❌ INSERT
- ❌ UPDATE

**Target roles:**
- בחר **authenticated**

**Policy definition:**
```sql
(bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[2])
```

לחץ **Review** ואז **Save policy**

---

## ⚠️ חשוב!

1. **חובה ליצור לפחות Policy 1 (INSERT) ו-Policy 2 (SELECT)** - בלי זה העלאת התמונות לא תעבוד!
2. **Policy 3 ו-4 הם אופציונליים** - אבל מומלץ ליצור אותם גם כן
3. **ודא שהשם של ה-bucket הוא בדיוק `avatars`** (לא `photos` או משהו אחר)

## בדיקה

לאחר יצירת ה-policies:
1. נסה להעלות תמונת פרופיל מהאפליקציה
2. אם זה עובד - הכל מוכן! ✅
3. אם יש שגיאה - בדוק את ה-console בדפדפן ובדוק שהכל הוגדר נכון


