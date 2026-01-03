# Authentication Troubleshooting Guide

## 🔴 Current Issues

1. **Email signup not working**
2. **Google OAuth redirects to "This site can't be reached"**

---

## 🔧 Immediate Fixes Required

### Issue 1: Email Signup Not Working

**Possible Causes:**
1. Email confirmation is required but user hasn't confirmed
2. Supabase email provider not configured
3. User already exists
4. Rate limiting

**How to Fix:**

#### Step 1: Check Browser Console
Open browser DevTools (F12) → Console tab and look for errors when clicking "Create Account"

#### Step 2: Check if Signup Actually Worked
Even if the UI doesn't redirect, the account might have been created:
1. Go to Supabase Dashboard → Authentication → Users
2. Check if your email appears in the user list
3. If yes, check your email inbox (and spam) for verification email

#### Step 3: Verify Email Auth Settings
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/providers

**Email Provider Settings:**
- ✅ Enable email provider: **ON**
- ✅ Confirm email: **ON** (default - this is likely why it "doesn't work")
- ⚠️ **This means users MUST click the verification email before they can log in**

**For Testing (Optional - Not recommended for production):**
You can temporarily disable email confirmation:
1. Go to Email provider settings
2. Turn OFF "Confirm email"
3. Try signup again
4. **Remember to turn it back ON for production!**

#### Step 4: Check Email Templates
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/templates

Make sure these templates are enabled:
- ✅ Confirm signup
- ✅ Magic Link
- ✅ Reset Password

**Template Variables:**
Confirm the "Confirm signup" template has `{{ .ConfirmationURL }}` in the email body.

---

### Issue 2: Google OAuth "This site can't be reached"

**Root Cause:**
The redirect URL is not configured in Supabase, so Google OAuth doesn't know where to redirect after authentication.

**How to Fix:**

#### Step 1: Get Your Vercel URL
Your deployed app URL should be something like:
```
https://your-app-name.vercel.app
```

Find it in your Vercel dashboard or check the deployment URL.

#### Step 2: Configure Supabase Redirect URLs
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/url-configuration

**Add these URLs:**

**Site URL:**
```
https://your-actual-vercel-url.vercel.app
```

**Redirect URLs (Add both):**
```
https://your-actual-vercel-url.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

⚠️ **CRITICAL:** Replace `your-actual-vercel-url` with your real Vercel URL!

#### Step 3: Enable Google OAuth Provider
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/providers

**Google Provider Settings:**
1. Click on "Google" in the providers list
2. Toggle **"Enable Google provider"** to ON
3. **IMPORTANT:** You need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URIs:
     ```
     https://szsktzmggsytdgilhrgq.supabase.co/auth/v1/callback
     ```
   - Copy Client ID and Client Secret
4. Paste Client ID and Client Secret in Supabase
5. Save

**Alternative Quick Fix (For Testing):**
If you don't want to set up Google OAuth right now, you can disable it:
1. Open `.env.local`
2. Change: `VITE_ENABLE_GOOGLE_AUTH=false`
3. Also update Vercel environment variable
4. Redeploy

This will hide the "Sign up with Google" button.

---

## 🧪 Testing Steps

### Test Email Signup:
1. Open browser DevTools (F12) → Console
2. Go to signup page
3. Fill in the form with a **valid email you have access to**
4. Click "Create Account"
5. Check console for errors
6. Check your email inbox (and spam folder)
7. Click the confirmation link in email
8. Go to login page and try to log in

### Test Google OAuth (After Configuration):
1. Click "Sign up with Google"
2. Should redirect to Google login
3. Choose your Google account
4. Should redirect back to `/auth/callback`
5. Should then redirect to the main app

---

## 🔍 Debugging Checklist

### Vercel Environment Variables
Check that these are set in Vercel:
- [ ] `VITE_SUPABASE_URL` = `https://szsktzmggsytdgilhrgq.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = (your anon key)
- [ ] `VITE_APP_URL` = Your Vercel URL
- [ ] `VITE_ENABLE_GOOGLE_AUTH` = `true` or `false`

### Supabase Configuration
- [ ] Email provider enabled
- [ ] Email confirmation setting (decide ON or OFF)
- [ ] Email templates enabled
- [ ] Site URL set to your Vercel URL
- [ ] Redirect URLs include `/auth/callback`
- [ ] Google provider enabled (if using)
- [ ] Google OAuth credentials added (if using)

### Database
- [ ] Run the SQL migration (001_initial_schema.sql)
- [ ] Verify trigger exists: `handle_new_user()`
- [ ] Check RLS policies are enabled

---

## 📝 Common Error Messages

### "Invalid login credentials"
- User hasn't verified email yet
- Wrong email/password
- User doesn't exist

### "Email not confirmed"
- User needs to click verification link in email
- Check spam folder

### "User already registered"
- Try logging in instead
- Or use password reset

### "This site can't be reached" (Google OAuth)
- Redirect URLs not configured in Supabase
- Google provider not enabled
- Wrong redirect URL format

---

## 🚀 Quick Start Checklist

**Minimum Required for Email Signup:**
1. [ ] Run SQL migration
2. [ ] Email provider enabled in Supabase
3. [ ] Vercel environment variables set
4. [ ] User checks email for verification link

**Minimum Required for Google OAuth:**
1. [ ] All email signup requirements
2. [ ] Google provider enabled in Supabase
3. [ ] Google OAuth credentials configured
4. [ ] Redirect URLs added to Supabase
5. [ ] Site URL set in Supabase

---

## 🆘 Still Not Working?

If authentication still doesn't work after following this guide:

1. **Check Supabase Logs:**
   - Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/logs/explorer
   - Filter by "auth" logs
   - Look for error messages

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Try signup/login
   - Share any error messages

3. **Check Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try signup/login
   - Look for failed requests (red color)
   - Check the response for error details

4. **Verify Environment Variables:**
   - In Vercel, redeploy after changing env vars
   - Environment variables only apply after redeployment
