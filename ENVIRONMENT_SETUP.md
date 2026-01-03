# Environment Variables & Configuration Checklist

## ✅ **VERCEL Environment Variables** (Required)

Add these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `VITE_SUPABASE_URL` | `https://szsktzmggsytdgilhrgq.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6c2t0em1nZ3N5dGRnaWxocmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1MDgsImV4cCI6MjA4MjA3MDUwOH0.uOUnSr0reu22bYE9Ms2SIp31wbFWU2w3aQBQglDohyQ` | Public anon key (safe to expose) |
| `VITE_APP_NAME` | `Invoicify` | App name |
| `VITE_ENABLE_GOOGLE_AUTH` | `true` | Enable Google OAuth button |
| `VITE_FREE_TIER_CLIENT_LIMIT` | `3` | Max clients on free tier |
| `VITE_APP_URL` | `https://your-app.vercel.app` | ⚠️ Update after deployment |

**Important:**
- Apply to: **All environments** (Production, Preview, Development)
- After first deployment, update `VITE_APP_URL` with your actual Vercel URL
- Then redeploy

---

## ✅ **SUPABASE Configuration** (Required)

### 1. Authentication URLs
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/url-configuration

**Site URL:**
```
https://your-actual-vercel-url.vercel.app
```

**Redirect URLs:** (Add both)
```
https://your-actual-vercel-url.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

**Save after each deployment URL change!**

### 2. Email Templates (Optional - Check)
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/templates

Make sure email templates are enabled for:
- ✅ Confirm signup
- ✅ Magic Link
- ✅ Reset Password

### 3. Email Auth Provider (Verify)
Go to: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq/auth/providers

**Email Provider:**
- ✅ Should be ENABLED by default
- Confirm signup required: ✅ Yes (recommended)

### 4. Database RLS Policies (Already Set ✅)
Your SQL migration already set these up:
- ✅ Row Level Security enabled on all tables
- ✅ Users can only access their own data
- ✅ Profiles auto-created on signup

---

## 🔧 **Current Status**

### Local (.env.local) ✅
```
✅ VITE_SUPABASE_URL - Correct
✅ VITE_SUPABASE_ANON_KEY - Correct
✅ VITE_APP_URL - Set to localhost (correct for local)
✅ VITE_APP_NAME - Set
✅ VITE_ENABLE_GOOGLE_AUTH - Enabled
✅ VITE_FREE_TIER_CLIENT_LIMIT - Set to 3
```

### Vercel ⚠️
**Status:** Needs to be configured
**Action Required:**
1. Add all 6 environment variables
2. Deploy
3. Update VITE_APP_URL with actual Vercel URL
4. Redeploy

### Supabase ⚠️
**Status:** Database ready, URLs need updating after Vercel deployment
**Action Required:**
1. Deploy to Vercel first
2. Get your Vercel URL
3. Add it to Supabase redirect URLs
4. Test authentication

---

## 🚀 **Deployment Order**

1. ✅ **Merge latest fix to main branch** (aef0b05 - Tailwind v3)
2. ⏭️ **Deploy to Vercel from main branch**
3. ⏭️ **Add environment variables in Vercel**
4. ⏭️ **Get Vercel URL after deployment**
5. ⏭️ **Update VITE_APP_URL in Vercel**
6. ⏭️ **Update Supabase redirect URLs**
7. ⏭️ **Redeploy on Vercel**
8. ✅ **Test live app!**

---

## ⚠️ **Critical Issue to Fix First**

**Main branch is missing the Tailwind v3 fix!**

Run these commands to update main:
```bash
git checkout main
git pull origin main
git merge claude/audit-supabase-migration-EmrNN
git push origin main
```

**OR** create a Pull Request on GitHub and merge it.

---

## 🧪 **Testing Checklist** (After Deployment)

- [ ] Visit Vercel URL
- [ ] Click "Sign Up"
- [ ] Enter email and password
- [ ] Check for verification email (check Supabase logs if not received)
- [ ] Verify email and log in
- [ ] Create a client (test free tier limit)
- [ ] Create an invoice
- [ ] Sign out and sign back in
- [ ] Test on different browser (real-time sync)

---

## 📝 **Quick Reference**

**Supabase Dashboard:** https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq
**GitHub Repo:** https://github.com/skagomes/Invoicify
**Vercel:** https://vercel.com (after you sign up)

---

## 🆘 **Troubleshooting**

### Frontend Still Broken
- ✅ **Fix:** Merge latest commit (aef0b05) to main
- ✅ **Fix:** Deploy from main branch, not an old branch

### Authentication Not Working
- Check Supabase redirect URLs match your Vercel URL exactly
- Verify all environment variables in Vercel
- Check browser console for errors

### "Not authenticated" errors
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel
- Check Supabase RLS policies (should be enabled via SQL migration)

### Email not received
- Check Supabase → Logs → Auth
- Enable email templates in Supabase
- Check spam folder
