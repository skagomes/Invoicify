# Invoicify - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- Supabase project running (already set up ✅)

---

## Step 1: Push to GitHub

Your code is already on branch `claude/audit-supabase-migration-EmrNN`.

**You need to:**
1. Go to GitHub: https://github.com/skagomes/Invoicify
2. Create a Pull Request from `claude/audit-supabase-migration-EmrNN` to `main`
3. Merge the PR (or deploy directly from the branch)

---

## Step 2: Connect to Vercel

1. **Go to Vercel**: https://vercel.com

2. **Sign up/Login** with your GitHub account

3. **Click "Add New Project"**

4. **Import your repository**:
   - Select: `skagomes/Invoicify`
   - Branch: `main` (or `claude/audit-supabase-migration-EmrNN`)

5. **Configure Project**:
   - Framework Preset: **Vite** (should auto-detect)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (should auto-fill)
   - Output Directory: `dist` (should auto-fill)

---

## Step 3: Add Environment Variables

**CRITICAL:** Add these environment variables in Vercel:

Click **Environment Variables** and add:

### Required Variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://szsktzmggsytdgilhrgq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6c2t0em1nZ3N5dGRnaWxocmdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1MDgsImV4cCI6MjA4MjA3MDUwOH0.uOUnSr0reu22bYE9Ms2SIp31wbFWU2w3aQBQglDohyQ` |
| `VITE_APP_URL` | `https://your-app.vercel.app` (you'll get this after deployment) |
| `VITE_APP_NAME` | `Invoicify` |
| `VITE_ENABLE_GOOGLE_AUTH` | `true` |
| `VITE_FREE_TIER_CLIENT_LIMIT` | `3` |

**Apply to:** All environments (Production, Preview, Development)

---

## Step 4: Deploy!

1. Click **Deploy**

2. Wait 2-3 minutes for build to complete

3. You'll get a URL like: `https://invoicify-xxx.vercel.app`

4. **Visit your app!** 🎉

---

## Step 5: Update Supabase Auth Settings

After deployment, you need to update Supabase with your Vercel URL:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq

2. **Navigate to**: Authentication → URL Configuration

3. **Add these URLs**:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs** (add both):
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

4. **Save**

---

## Step 6: Test Your Deployed App

Visit your Vercel URL and test:

1. ✅ **Sign up** with email/password
2. ✅ **Check email** for verification (check Supabase logs if not receiving)
3. ✅ **Log in** after verification
4. ✅ **Create a client** (test free tier limit - max 3)
5. ✅ **Create an invoice**
6. ✅ **Update settings** and upload logo
7. ✅ **Sign out** and **sign in** again
8. ✅ **Open in another browser** - test real-time sync!

---

## 🎨 Optional: Custom Domain

### Add Your Own Domain

1. In Vercel project settings → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `invoicify.app`)
4. Follow DNS configuration instructions
5. Update Supabase URLs with your custom domain

---

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Ensure all environment variables are set
- Verify `vercel.json` is in root directory

### Authentication Not Working
- Verify Supabase redirect URLs include your Vercel domain
- Check environment variables are correct
- Check browser console for errors

### Database Errors
- Verify Supabase project is not paused
- Check RLS policies are enabled
- Verify anon key is correct

### White Screen
- Check browser console for errors
- Verify all environment variables start with `VITE_`
- Check build logs for missing modules

---

## 🔐 Enable Google OAuth (Optional)

If you want "Sign in with Google":

1. **Go to Google Cloud Console**: https://console.cloud.google.com

2. **Create/Select Project**

3. **Enable Google+ API**

4. **Create OAuth 2.0 Credentials**:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `https://szsktzmggsytdgilhrgq.supabase.co/auth/v1/callback`

5. **Copy Client ID and Secret**

6. **Go to Supabase**: Authentication → Providers → Google
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

7. **Test** - "Sign in with Google" button will now work!

---

## 📊 Monitoring

### Vercel Analytics
- Go to your project → Analytics
- See page views, performance, etc.

### Supabase Logs
- Go to Supabase → Logs
- Monitor database queries, auth events, etc.

### Error Tracking (Optional)
- Add Sentry integration in Vercel
- Track frontend errors in production

---

## 🚀 Continuous Deployment

Every time you push to your connected branch:
1. Vercel automatically builds
2. Runs tests (if configured)
3. Deploys if successful
4. Updates your live site

**That's it!** Your app is now production-ready and deployed! 🎉

---

## 📱 Share Your App

Once deployed, share with:
- Friends for beta testing
- Potential customers
- On Product Hunt / Reddit / Twitter

---

## 🎯 Next Steps

1. **Get your first users!**
2. Monitor usage and feedback
3. Iterate based on user needs
4. Consider adding Stripe when ready
5. Add more features based on demand

**Need help?** Check the error logs or ask questions!
