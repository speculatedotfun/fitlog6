# 🔧 Fix CORS Error - Step by Step Guide

## ⚠️ IMPORTANT: You MUST configure this in Supabase Dashboard

The CORS error happens because Supabase blocks requests from origins not in the allowed list. Follow these exact steps:

---

## Step 1: Open Supabase Dashboard

1. Go to: **https://app.supabase.com**
2. **Sign in** to your account
3. **Select your project** (the one with URL: `zycffezzeiwewanxwtsi.supabase.co`)

---

## Step 2: Configure Site URL (API Settings)

1. In the left sidebar, click **Settings** (gear icon)
2. Click **API** (under Project Settings)
3. Find the **Site URL** field
4. **Change it to**: `http://localhost:3001`
5. **Click "Save"** at the bottom

---

## Step 3: Configure Redirect URLs (Authentication)

1. In the left sidebar, click **Authentication**
2. Click **URL Configuration** (under Configuration)
3. Find the **Redirect URLs** section
4. **Add these URLs** (one per line):
   ```
   http://localhost:3001/**
   http://localhost:3001/auth/callback
   http://127.0.0.1:3001/**
   http://127.0.0.1:3001/auth/callback
   ```
5. **Click "Save"** at the bottom

---

## Step 4: Verify Site URL in Authentication

1. Still in **Authentication** → **URL Configuration**
2. Check the **Site URL** field (at the top)
3. Make sure it says: `http://localhost:3001`
4. If not, **change it** and **click "Save"**

---

## Step 5: Clear Browser Cache

1. **Close your browser completely**
2. **Reopen it**
3. Or use **Incognito/Private mode** to test

---

## Step 6: Restart Your Dev Server

1. **Stop** your Next.js server (Ctrl+C in terminal)
2. **Start it again**:
   ```bash
   npm run dev
   ```
3. **Open**: `http://localhost:3001`

---

## Step 7: Test Login

Try logging in again. The CORS error should be gone!

---

## ❌ Still Not Working?

If you still see CORS errors after following all steps:

### Check 1: Verify Your Project is Active
- Go to **Settings** → **General**
- Make sure your project is **not paused**

### Check 2: Verify Environment Variables
- Open `.env.local` file
- Make sure you have:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://zycffezzeiwewanxwtsi.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

### Check 3: Check Browser Console
- Open browser DevTools (F12)
- Go to **Network** tab
- Try logging in
- Look at the failed request
- Check if the error message changed

### Check 4: Try Different Browser
- Sometimes browser extensions cause issues
- Try Chrome, Firefox, or Edge

---

## 📸 Visual Guide

**Settings → API:**
```
Site URL: [http://localhost:3001        ]
```

**Authentication → URL Configuration:**
```
Site URL: [http://localhost:3001        ]

Redirect URLs:
[+] http://localhost:3001/**
[+] http://localhost:3001/auth/callback
[+] http://127.0.0.1:3001/**
[+] http://127.0.0.1:3001/auth/callback
```

---

## ✅ Success Indicators

After fixing, you should see:
- ✅ No CORS errors in console
- ✅ Login works successfully
- ✅ You can access Supabase API from your app

---

## 🆘 Need More Help?

If it's still not working, check:
1. Are you using the correct Supabase project?
2. Did you save all changes in the dashboard?
3. Did you restart the dev server?
4. Did you clear browser cache?

## ✅ WORKAROUND: API Route Proxy (Already Implemented)

If you're still experiencing CORS errors even after configuring Supabase, **we've already implemented a workaround**:

The login now uses an API route (`/api/auth/login`) that handles authentication **server-side**, which bypasses CORS entirely. This means:

- ✅ **No CORS errors** - authentication happens on the server
- ✅ **Works immediately** - no dashboard configuration needed
- ✅ **More secure** - credentials never exposed to client

**The login should work now even without Supabase dashboard configuration!**

Try logging in again - it should work via the API route proxy.

