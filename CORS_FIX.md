# Fixing CORS Errors with Supabase

If you're seeing CORS errors like:
```
Access to fetch at 'https://your-project.supabase.co/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

## Solution: Configure Supabase Dashboard

The CORS error occurs because Supabase needs to allow requests from your local development origin. Follow these steps:

### Step 1: Go to Supabase Dashboard

1. Navigate to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**

### Step 2: Configure Site URL

1. In the **API Settings** page, find the **Site URL** field
2. Set it to: `http://localhost:3001`
3. Or if you want to allow multiple origins, you can leave it as your production URL

### Step 3: Configure Redirect URLs (Authentication)

1. Go to **Authentication** → **URL Configuration**
2. In the **Redirect URLs** section, add:
   - `http://localhost:3001/**`
   - `http://localhost:3001/auth/callback` (if using OAuth)
3. Make sure **Site URL** is set to `http://localhost:3001`

### Step 4: Save and Restart

1. Click **Save** on all settings pages
2. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

### Alternative: Use Environment Variable for Different Ports

If you're using a different port, make sure to update the Site URL in Supabase dashboard to match your actual port (e.g., `http://localhost:3000` if using port 3000).

## Why This Happens

Supabase enforces CORS policies to prevent unauthorized access. When developing locally, you need to explicitly allow your localhost origin in the Supabase project settings.

## Still Having Issues?

If CORS errors persist after updating the dashboard:

1. **Clear browser cache and cookies** - Old session data might be interfering
2. **Check your `.env.local` file** - Ensure `NEXT_PUBLIC_SUPABASE_URL` is correct
3. **Verify the Supabase project is active** - Check that your project isn't paused
4. **Check browser console** - Look for any additional error messages

## Production Deployment

When deploying to production, make sure to:
1. Update the **Site URL** in Supabase to your production domain
2. Add your production domain to **Redirect URLs**
3. Update your environment variables with production values

