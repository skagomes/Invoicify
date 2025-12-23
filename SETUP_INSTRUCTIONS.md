# Invoicify Setup Instructions

## ✅ Completed Steps

1. ✅ Database schema created (`supabase/migrations/001_initial_schema.sql`)
2. ✅ Project structure refactored (moved to `src/` directory)
3. ✅ Dependencies installed
4. ✅ Supabase client configured
5. ✅ Environment variables set up (`.env.local`)
6. ✅ Tailwind CSS properly configured (bundled, not CDN)

---

## 🔥 CRITICAL: Run Database Migration NOW

**You need to run the SQL migration in your Supabase project:**

### Steps:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/szsktzmggsytdgilhrgq

2. Click on **SQL Editor** in the left sidebar

3. Click **+ New query**

4. Open the file `/home/user/Invoicify/supabase/migrations/001_initial_schema.sql`

5. Copy ALL the SQL and paste it into the Supabase SQL Editor

6. Click **Run** (or press Ctrl+Enter)

7. You should see a success message: "✅ Invoicify database schema created successfully!"

### What this creates:
- ✅ `profiles` table (user profiles)
- ✅ `clients` table (your customers)
- ✅ `invoices` table (invoices)
- ✅ `invoice_line_items` table (invoice details)
- ✅ `settings` table (user settings)
- ✅ Row Level Security (RLS) policies (data isolation)
- ✅ Storage buckets (avatars, logos)
- ✅ Triggers (auto-create profile on signup)

---

## 🔐 Enable Google OAuth (Optional but Recommended)

For product-led growth, enable Google sign-in:

1. In your Supabase dashboard, go to **Authentication** → **Providers**

2. Find **Google** and click **Enable**

3. You'll need to create a Google OAuth app:
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://szsktzmggsytdgilhrgq.supabase.co/auth/v1/callback`

4. Copy the **Client ID** and **Client Secret** into Supabase

5. Save

---

## 🚀 What's Next

Once you run the SQL migration, I'll continue with:

1. ✅ Fix import paths in existing components (in progress)
2. ⏭️ Create authentication UI (Login/Signup pages)
3. ⏭️ Create Auth context and protected routes
4. ⏭️ Build API layer for database operations
5. ⏭️ Migrate components from localStorage to Supabase
6. ⏭️ Implement free tier limits (3 clients max)
7. ⏭️ Production optimizations

---

## ⚡ Test the Setup

After I fix the imports, you can test the app:

```bash
npm run dev
```

The app will run on http://localhost:3000

---

## 🏗️ New Project Structure

```
/home/user/Invoicify/
├── src/
│   ├── components/
│   │   ├── auth/          (will create)
│   │   ├── dashboard/     ✅ Dashboard.tsx
│   │   ├── clients/       ✅ ClientsPage.tsx
│   │   ├── invoices/      ✅ InvoicesPage.tsx
│   │   ├── settings/      ✅ SettingsPage.tsx
│   │   ├── ui/            (will create)
│   │   └── layout/        (will create)
│   ├── lib/
│   │   ├── supabase.ts    ✅ Supabase client
│   │   ├── i18n.ts        ✅ Translations
│   │   ├── data.ts        ✅ Default data
│   │   └── api/           (will create)
│   ├── hooks/
│   │   └── useLocalStorage.ts  ✅
│   ├── types/
│   │   ├── index.ts       ✅ App types
│   │   └── database.ts    ✅ Supabase types
│   ├── contexts/          (will create)
│   ├── config/
│   │   └── constants.ts   ✅ App config
│   ├── App.tsx            ✅
│   ├── main.tsx           ✅
│   └── index.css          ✅
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ✅
├── .env.local             ✅ Your credentials
├── .env.example           ✅ Template
├── package.json           ✅ Updated
├── tailwind.config.js     ✅
├── postcss.config.js      ✅
└── MIGRATION_PLAN.md      ✅ Full roadmap
```

---

## 📊 Pricing Tiers (Reminder)

**Free Tier:**
- 3 clients max
- 10 invoices per month
- Basic features

**Pro Tier (Future):**
- Unlimited clients
- Unlimited invoices
- All features
- Priority support

---

## ❓ Questions?

Let me know when you've run the SQL migration and I'll continue with the authentication system!
