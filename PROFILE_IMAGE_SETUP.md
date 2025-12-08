# הוראות הגדרת העלאת תמונות פרופיל

## שלב 1: הוספת עמודה לטבלת users

1. פתח Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לחץ על **SQL Editor** בתפריט השמאלי
4. העתק והדבק את הקוד הבא:

```sql
-- Add profile_image_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
```

5. לחץ על **Run**

## שלב 2: יצירת Storage Bucket (חובה!)

⚠️ **זה השלב החשוב ביותר!** ללא ה-bucket, העלאת התמונות לא תעבוד.

1. ב-Supabase Dashboard, לחץ על **Storage** בתפריט השמאלי
2. לחץ על **New bucket** (כפתור כחול בפינה הימנית העליונה)
3. מלא את הפרטים:
   - **Name**: `avatars` (חשוב: בדיוק את השם הזה!)
   - **Public bucket**: ✅ **כן** (חובה לסמן את זה כדי שהתמונות יהיו נגישות)
4. לחץ על **Create bucket**

✅ **אחרי יצירת ה-bucket, תראה אותו ברשימת ה-buckets**

## שלב 3: הגדרת Storage Policies

1. לאחר יצירת ה-bucket, לחץ על **Policies** ליד ה-bucket `avatars`
2. לחץ על **New Policy**
3. בחר **For full customization** (הקוד המלא)
4. העתק והדבק את הקוד הבא:

```sql
-- Policy: Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Allow public read access to profile images
CREATE POLICY "Public read access for profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Allow users to update their own profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Allow users to delete their own profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
```

5. לחץ על **Review** ואז **Save policy**

## שלב 4: בדיקה

1. היכנס לאפליקציה
2. לך לדף ההגדרות (`/trainee/settings`)
3. לחץ על אייקון המצלמה ליד תמונת הפרופיל
4. בחר תמונה מהמחשב
5. התמונה אמורה להיטען ולהציג בפרופיל

## הערות חשובות

- **גודל מקסימלי**: 5MB
- **פורמטים נתמכים**: כל סוגי התמונות (jpg, png, gif, webp וכו')
- **אבטחה**: רק משתמשים מחוברים יכולים להעלות תמונות, והם יכולים להעלות רק תמונות משלהם
- **גישה ציבורית**: התמונות נגישות לכל אחד (public read), כך שהן יוצגו באפליקציה

## פתרון בעיות

### שגיאה: "Failed to upload image"
- ודא שה-bucket `avatars` נוצר
- ודא שה-policies הוגדרו נכון
- בדוק את ה-console בדפדפן לשגיאות נוספות

### התמונה לא מוצגת
- ודא שה-bucket הוא public
- בדוק שה-URL של התמונה נכון ב-console
- ודא שה-`profile_image_url` עודכן בטבלת users

### שגיאת הרשאות
- ודא שהמשתמש מחובר
- ודא שה-policies מאפשרים למשתמש המחובר להעלות קבצים

