# Google OAuth Setup Guide

## 🔐 Complete Setup Instructions

This guide will help you configure Google OAuth authentication for your Invoicify application.

---

## Prerequisites

- Vercel deployment URL: `https://invoicify-black.vercel.app`
- Supabase project URL: `https://szsktzmggsytdgilhrgq.supabase.co`
- Google Cloud account

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
Navigate to: https://console.cloud.google.com/

### 1.2 Create New Project
1. Click "Select a project" dropdown at the top
2. Click "NEW PROJECT"
3. Project name: `Invoicify`
4. Click "CREATE"
5. Wait for project creation (takes 10-30 seconds)
6. Select the new project from the dropdown

---

## Step 2: Configure OAuth Consent Screen

### 2.1 Navigate to OAuth Consent Screen
1. In the left sidebar, go to: **APIs & Services** → **OAuth consent screen**
2. Or direct link: https://console.cloud.google.com/apis/credentials/consent

### 2.2 Configure Consent Screen
1. **User Type:** Select "External" (allows anyone with Google account)
2. Click "CREATE"

### 2.3 App Information
Fill in the following:

| Field | Value |
|-------|-------|
| **App name** | Invoicify |
| **User support email** | Your email address |
| **App logo** | (Optional - skip for now) |
| **Application home page** | `https://invoicify-black.vercel.app` |
| **Application privacy policy** | `https://invoicify-black.vercel.app` (update later) |
| **Application terms of service** | `https://invoicify-black.vercel.app` (update later) |
| **Authorized domains** | `vercel.app` |
| **Developer contact** | Your email address |

3. Click "SAVE AND CONTINUE"

### 2.4 Scopes
1. Click "ADD OR REMOVE SCOPES"
2. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click "UPDATE"
4. Click "SAVE AND CONTINUE"

### 2.5 Test Users (Optional)
- For testing only - skip this for now
- Click "SAVE AND CONTINUE"

### 2.6 Summary
- Review and click "BACK TO DASHBOARD"

---

## Step 3: Create OAuth Credentials

### 3.1 Navigate to Credentials
1. In the left sidebar: **APIs & Services** → **Credentials**
2. Or direct link: https://console.cloud.google.com/apis/credentials

### 3.2 Create OAuth Client ID
1. Click "+ CREATE CREDENTIALS" at the top
2. Select "OAuth client ID"
3. Application type: **Web application**
4. Name: `Invoicify Web Client`

### 3.3 Configure Authorized Redirects

**⚠️ CRITICAL:** Add these EXACT redirect URIs:

```
https://szsktzmggsytdgilhrgq.supabase.co/auth/v1/callback
```

**Notes:**
- This is the **Supabase callback URL**, not your Vercel URL
- Must be EXACTLY as shown (check for typos!)
- Do NOT add your Vercel URL here
- Do NOT add localhost here

### 3.4 Create Credentials
1. Click "CREATE"
2. A dialog will show your **Client ID** and **Client Secret**
3. **COPY BOTH** - you'll need them in the next step
4. Client ID looks like: `123456789-abc123.apps.googleusercontent.com`
5. Client Secret looks like: `GOCSPX-abc123xyz456`

**⚠️ IMPORTANT:** Keep these secret! Don't share them publicly.

---

## Step 4: Configure Supabase

### 4.1 Go to Supabase Auth Providers
Navigate to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/providers

### 4.2 Enable Google Provider
1. Find "Google" in the list of providers
2. Click on it to expand
3. Toggle "Enable Google provider" to **ON**

### 4.3 Add Google Credentials
1. **Client ID (for OAuth)**: Paste your Google Client ID
2. **Client Secret (for OAuth)**: Paste your Google Client Secret
3. Leave other fields as default
4. Click "SAVE"

### 4.4 Configure Redirect URLs (if not done already)
1. Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/url-configuration
2. **Site URL**: `https://invoicify-black.vercel.app`
3. **Redirect URLs** - Add both:
   ```
   https://invoicify-black.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. Click "SAVE"

---

## Step 5: Verify Environment Variables in Vercel

### 5.1 Go to Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to: **Settings** → **Environment Variables**

### 5.2 Verify These Variables Exist
| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://szsktzmggsytdgilhrgq.supabase.co` | ✅ Should exist |
| `VITE_SUPABASE_ANON_KEY` | (your anon key) | ✅ Should exist |
| `VITE_APP_URL` | `https://invoicify-black.vercel.app` | ⚠️ Update if needed |
| `VITE_ENABLE_GOOGLE_AUTH` | `true` | ⚠️ Must be `true` |

### 5.3 Update and Redeploy
1. If you changed any variables, **REDEPLOY** your app
2. Environment variables only apply after redeployment

---

## Step 6: Test Google OAuth

### 6.1 Test Flow
1. Go to: https://invoicify-black.vercel.app/signup
2. Click "Sign up with Google"
3. **Expected:** Redirect to Google login page
4. **Select your Google account**
5. **Expected:** Redirect back to `https://invoicify-black.vercel.app/auth/callback`
6. **Expected:** Then redirect to dashboard

### 6.2 Common Issues and Solutions

#### Issue: "This site can't be reached"
**Cause:** Redirect URL not configured properly
**Fix:**
- Double-check Supabase redirect URLs include your Vercel URL
- Make sure you redeployed after setting `VITE_ENABLE_GOOGLE_AUTH=true`

#### Issue: "Redirect URI mismatch"
**Cause:** Google Cloud redirect URI doesn't match Supabase callback
**Fix:**
- Go back to Google Cloud Console → Credentials
- Edit your OAuth client
- Verify redirect URI is exactly: `https://szsktzmggsytdgilhrgq.supabase.co/auth/v1/callback`

#### Issue: "Access blocked: This app's request is invalid"
**Cause:** OAuth consent screen not properly configured
**Fix:**
- Go to OAuth consent screen in Google Cloud
- Verify all required fields are filled
- Verify `vercel.app` is in authorized domains

#### Issue: Button shows but nothing happens when clicked
**Cause:** `VITE_ENABLE_GOOGLE_AUTH` not set to `true`
**Fix:**
- Check Vercel environment variables
- Set `VITE_ENABLE_GOOGLE_AUTH=true`
- Redeploy

---

## Step 7: Production Checklist

Before going live, complete these items:

- [ ] **Verify Google OAuth works** on Vercel deployment
- [ ] **Test with multiple Google accounts** (personal and work emails)
- [ ] **Check user profile creation** after Google signup
- [ ] **Verify settings are created** for Google-authenticated users
- [ ] **Update privacy policy** and terms of service pages
- [ ] **Submit for Google verification** (required for >100 users)
- [ ] **Remove "This app isn't verified" warning** (after Google review)

---

## Step 8: Google App Verification (For Production)

### When Verification is Required
- If you expect >100 users
- To remove "This app isn't verified" warning
- Required for better trust/UX

### Verification Process
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click "PUBLISH APP" button
3. Google will review your application
4. Provide:
   - Privacy policy URL
   - Terms of service URL
   - Homepage URL
   - App description
   - YouTube demo video (optional but recommended)
5. Review typically takes 3-7 days

---

## Debugging Tools

### Check Current Auth Configuration
Run this in browser console on your site:
```javascript
console.log({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  appUrl: import.meta.env.VITE_APP_URL,
  googleAuthEnabled: import.meta.env.VITE_ENABLE_GOOGLE_AUTH
});
```

### Check Supabase Auth State
```javascript
import { supabase } from './lib/supabase';
const { data, error } = await supabase.auth.getSession();
console.log('Current session:', data, error);
```

### Check Network Requests
1. Open DevTools (F12) → Network tab
2. Click "Sign up with Google"
3. Look for requests to:
   - `supabase.co/auth/v1/authorize` (should succeed)
   - `accounts.google.com` (Google OAuth)
   - `auth/callback` (return to your app)

---

## Security Best Practices

✅ **DO:**
- Keep Client Secret private
- Use environment variables for secrets
- Enable HTTPS only (Vercel does this automatically)
- Regularly rotate Client Secret
- Monitor auth logs in Supabase

❌ **DON'T:**
- Commit secrets to Git
- Share Client Secret publicly
- Use development credentials in production
- Skip OAuth consent screen configuration

---

## Support

If you encounter issues:

1. **Check browser console** for errors (F12 → Console)
2. **Check Network tab** for failed requests (F12 → Network)
3. **Check Supabase logs**: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/logs/explorer
4. **Verify all URLs** match exactly (no typos, trailing slashes, etc.)

---

## Quick Reference

**Google Cloud Console:**
https://console.cloud.google.com/

**Supabase Auth Providers:**
https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/providers

**Supabase URL Configuration:**
https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/url-configuration

**Your App:**
https://invoicify-black.vercel.app

**Supabase Callback URL (for Google):**
https://szsktzmggsytdgilhrgq.supabase.co/auth/v1/callback
