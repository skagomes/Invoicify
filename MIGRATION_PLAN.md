# Invoicify Production Migration Plan

## Executive Summary

This document outlines the complete migration plan to transform Invoicify from a single-user, localStorage-based application into a production-ready, multi-tenant SaaS platform with:
- Supabase backend and authentication
- Product-led growth strategy
- Stripe payment integration
- Production-grade infrastructure

**Estimated Timeline**: 4-6 weeks for full implementation
**Complexity**: High (requires backend, auth, payments, and infrastructure changes)

---

## Phase 1: Foundation & Infrastructure (Week 1)

### 1.1 Supabase Project Setup

**Tasks:**
- [ ] Create Supabase project
- [ ] Configure database schema
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure authentication providers

**Database Schema:**

```sql
-- Users table (managed by Supabase Auth)
-- Automatically created, we extend it

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  vat_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

-- Invoice line items table
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  company_email TEXT,
  company_address TEXT,
  company_vat_number TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  currency_symbol TEXT DEFAULT '$',
  default_tax_rate DECIMAL(5,2) DEFAULT 20,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_clients INTEGER,
  max_invoices_per_month INTEGER,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_settings_user_id ON settings(user_id);
```

**Row Level Security (RLS) Policies:**

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Invoice line items policies (inherited from invoice)
CREATE POLICY "Users can view own invoice items"
  ON invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoice items"
  ON invoice_line_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoice items"
  ON invoice_line_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoice items"
  ON invoice_line_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- Settings policies
CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);
```

### 1.2 Project Structure Refactoring

**New Directory Structure:**

```
/home/user/Invoicify/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── clients/
│   │   │   ├── ClientsPage.tsx
│   │   │   ├── ClientList.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   └── ClientDetail.tsx
│   │   ├── invoices/
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── InvoiceList.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   └── InvoiceView.tsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── CompanySettings.tsx
│   │   │   ├── BrandingSettings.tsx
│   │   │   └── BillingSettings.tsx
│   │   ├── marketing/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   └── FeaturesSection.tsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingFlow.tsx
│   │   │   └── OnboardingSteps.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ... (other UI components)
│   │   └── layout/
│   │       ├── AppLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── stripe.ts
│   │   ├── api/
│   │   │   ├── clients.ts
│   │   │   ├── invoices.ts
│   │   │   ├── settings.ts
│   │   │   └── subscriptions.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── validators.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClients.ts
│   │   ├── useInvoices.ts
│   │   ├── useSettings.ts
│   │   └── useSubscription.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── SubscriptionContext.tsx
│   ├── types/
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── constants.ts
│   │   └── pricing.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── create-checkout-session/
│       ├── webhook-stripe/
│       └── send-invoice-email/
├── public/
│   └── assets/
├── .env.example
├── .env.local (gitignored)
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### 1.3 Dependencies Update

**New Dependencies to Install:**

```json
{
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^7.1.3",
    "@supabase/supabase-js": "^2.47.10",
    "@stripe/stripe-js": "^5.2.0",
    "@stripe/react-stripe-js": "^3.2.0",
    "zustand": "^5.0.3",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",
    "date-fns": "^4.1.0",
    "recharts": "^2.15.0",
    "react-hot-toast": "^2.4.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.2",
    "vite": "^6.2.0",
    "tailwindcss": "^4.0.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "supabase": "^1.242.4",
    "@supabase/supabase-js": "^2.47.10"
  }
}
```

---

## Phase 2: Authentication & User Management (Week 2)

### 2.1 Supabase Auth Implementation

**Auth Features:**
- Email/Password authentication
- Google OAuth (product-led growth)
- GitHub OAuth (developer-friendly)
- Magic link login (passwordless)
- Email verification
- Password reset

**Implementation Files:**
- `src/lib/supabase.ts` - Supabase client configuration
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/hooks/useAuth.ts` - Auth operations hook
- `src/components/auth/*` - Auth UI components

### 2.2 Protected Routes

Implement route protection to ensure only authenticated users access the app.

### 2.3 User Profile Management

- Profile creation on signup
- Profile editing
- Avatar upload to Supabase Storage
- Company information setup

---

## Phase 3: Data Layer Migration (Week 3)

### 3.1 API Layer Development

Create abstraction layer for all database operations:

**API Modules:**
- `src/lib/api/clients.ts` - Client CRUD operations
- `src/lib/api/invoices.ts` - Invoice CRUD operations
- `src/lib/api/settings.ts` - Settings operations
- `src/lib/api/subscriptions.ts` - Subscription management

### 3.2 Data Migration Strategy

**Migration Approach:**
1. Keep localStorage as fallback for non-authenticated users
2. On user signup/login, migrate their localStorage data to Supabase
3. Clear localStorage after successful migration
4. Use Supabase as primary data source for authenticated users

**Migration Function:**
```typescript
async function migrateLocalDataToSupabase(userId: string) {
  const localClients = localStorage.getItem('clients');
  const localInvoices = localStorage.getItem('invoices');
  const localSettings = localStorage.getItem('settings');

  // Migrate clients
  // Migrate invoices
  // Migrate settings
  // Clear localStorage
}
```

### 3.3 State Management with Zustand

Replace localStorage hooks with Zustand stores that sync with Supabase:

```typescript
// Example: useClientsStore
const useClientsStore = create((set) => ({
  clients: [],
  loading: false,
  fetchClients: async () => { /* Supabase query */ },
  addClient: async (client) => { /* Supabase insert */ },
  updateClient: async (id, data) => { /* Supabase update */ },
  deleteClient: async (id) => { /* Supabase delete */ }
}));
```

### 3.4 Real-time Subscriptions

Implement real-time data sync using Supabase Realtime:
- Listen for client changes
- Listen for invoice updates
- Update UI in real-time

---

## Phase 4: Stripe Integration & Monetization (Week 4)

### 4.1 Stripe Setup

**Tasks:**
- Create Stripe account
- Set up products and pricing in Stripe Dashboard
- Configure webhooks
- Set up test mode and production mode

### 4.2 Subscription Tiers

**Proposed Pricing Structure:**

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| **Price** | $0 | $12/mo | $29/mo | $99/mo |
| **Clients** | 5 | 50 | Unlimited | Unlimited |
| **Invoices/month** | 10 | 100 | Unlimited | Unlimited |
| **Team members** | 1 | 1 | 5 | Unlimited |
| **Custom branding** | ❌ | ✅ | ✅ | ✅ |
| **Email invoices** | ❌ | ✅ | ✅ | ✅ |
| **API access** | ❌ | ❌ | ✅ | ✅ |
| **Priority support** | ❌ | ❌ | ✅ | ✅ |
| **White-label** | ❌ | ❌ | ❌ | ✅ |

### 4.3 Payment Flow Implementation

**Components:**
- Pricing page with tier comparison
- Checkout flow using Stripe Checkout
- Subscription management page
- Usage limits enforcement
- Upgrade/downgrade flows

**Stripe Integration Points:**
```typescript
// Create checkout session
const createCheckoutSession = async (priceId: string) => {
  // Call Supabase Edge Function
  // Return Stripe Checkout URL
};

// Handle webhook events
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.paid
// - invoice.payment_failed
```

### 4.4 Usage Limits & Gating

Implement feature gating based on subscription tier:
- Check limits before creating clients/invoices
- Show upgrade prompts when limits reached
- Disable features for lower tiers
- Trial period handling (14 days free trial)

---

## Phase 5: Product-Led Growth Strategy (Week 5)

### 5.1 Landing Page

**Sections:**
- Hero section with clear value proposition
- Features showcase with screenshots
- Pricing table
- Social proof (testimonials/metrics)
- FAQ section
- CTA buttons throughout

**Copy Focus:**
- "Create professional invoices in minutes"
- "No credit card required"
- "14-day free trial"

### 5.2 Onboarding Flow

**Steps:**
1. Sign up (Google/Email)
2. Company setup (name, logo, details)
3. Create first client (guided)
4. Create first invoice (guided)
5. Success celebration + next steps

**Onboarding Goals:**
- Get user to create first invoice within 5 minutes
- Show immediate value
- Reduce friction

### 5.3 Viral/Growth Features

**Free Features for PLG:**
- Unlimited invoice viewing (read-only)
- Public invoice links (shareable)
- Invoice templates library
- Referral program (1 month free per referral)

**Activation Triggers:**
- Email first invoice → prompt to upgrade
- 5 clients reached → show upgrade benefits
- 30 days usage → personalized upgrade offer

### 5.4 Email Marketing Integration

**Email Triggers:**
- Welcome email (onboarding)
- First invoice celebration
- Usage milestones
- Upgrade prompts
- Feature announcements
- Re-engagement for inactive users

**Tools:**
- Supabase Edge Functions for email sending
- Resend.com or SendGrid integration
- Email templates in React Email

---

## Phase 6: Production Readiness (Week 6)

### 6.1 Build Optimization

**Tasks:**
- Bundle all dependencies (remove CDN links)
- Set up proper Tailwind CSS build
- Code splitting and lazy loading
- Asset optimization
- Enable production mode for React

**Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js']
        }
      }
    },
    sourcemap: false,
    minify: 'terser'
  }
});
```

### 6.2 Error Handling & Monitoring

**Implementation:**
- Error boundaries in React
- Try-catch for all async operations
- User-friendly error messages
- Sentry or LogRocket integration
- Supabase function error logging

### 6.3 Analytics

**Tracking:**
- Page views
- User actions (invoice created, client added)
- Conversion funnel (signup → first invoice → upgrade)
- Feature usage metrics
- Performance metrics

**Tools:**
- Plausible Analytics (privacy-friendly)
- PostHog (product analytics)
- Google Analytics 4 (optional)

### 6.4 Security Hardening

**Checklist:**
- [ ] Environment variables properly secured
- [ ] Supabase RLS policies tested
- [ ] API keys not exposed in frontend
- [ ] CORS properly configured
- [ ] Rate limiting on Supabase functions
- [ ] Input validation on all forms
- [ ] XSS protection
- [ ] CSRF protection for sensitive actions

### 6.5 Performance Optimization

**Tasks:**
- Implement React.lazy() for code splitting
- Add loading skeletons
- Optimize images
- Implement pagination for large lists
- Cache Supabase queries
- Minimize re-renders

### 6.6 Testing

**Test Coverage:**
- Unit tests for utility functions
- Integration tests for API layer
- E2E tests for critical flows:
  - User signup → create invoice → view invoice
  - Subscribe to paid plan
  - Email invoice to client

**Tools:**
- Vitest for unit tests
- React Testing Library
- Playwright for E2E

### 6.7 SEO Optimization

**Tasks:**
- Meta tags for all pages
- Open Graph tags
- Sitemap generation
- robots.txt
- Structured data (JSON-LD)

### 6.8 Documentation

**Required Docs:**
- README.md (setup instructions)
- API documentation
- Environment variables guide
- Deployment guide
- User documentation/help center

---

## Phase 7: Deployment & Launch

### 7.1 Deployment Platform

**Recommended: Vercel**
- Automatic deployments from Git
- Serverless functions support
- Edge network CDN
- Free SSL
- Environment variable management

**Alternative: Netlify or Railway**

### 7.2 Domain & DNS

**Tasks:**
- Purchase domain (e.g., invoicify.app)
- Configure DNS
- Set up SSL certificate (automatic with Vercel)
- Configure custom domain in Supabase

### 7.3 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: vercel/actions@v1
```

### 7.4 Environment Management

**Environments:**
- Development (local)
- Staging (preview deployments)
- Production (main branch)

**Environment Variables:**
```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY= (server-side only)
STRIPE_WEBHOOK_SECRET=

# App Config
VITE_APP_URL=
```

### 7.5 Launch Checklist

**Pre-Launch:**
- [ ] All features tested on staging
- [ ] Stripe in production mode
- [ ] Supabase in production mode
- [ ] Analytics installed
- [ ] Error tracking active
- [ ] Email sending tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Legal pages (Terms, Privacy, Refund policy)
- [ ] Support email configured

**Launch Day:**
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Test signup flow
- [ ] Test payment flow
- [ ] Monitor analytics
- [ ] Announce on Product Hunt / Reddit / Twitter

---

## Post-Launch Roadmap

### Immediate (Month 1-2)
- Monitor user feedback
- Fix critical bugs
- A/B test pricing
- Optimize conversion funnel

### Short-term (Month 3-6)
- Mobile app (React Native)
- Recurring invoices
- Payment reminders
- Multi-currency support
- Invoice templates gallery

### Long-term (Month 6+)
- Team collaboration features
- Time tracking integration
- Expense management
- Client portal
- API for integrations
- White-label solution for agencies

---

## Success Metrics

### Technical Metrics
- Page load time < 2s
- Time to interactive < 3s
- Error rate < 0.1%
- Uptime > 99.9%

### Business Metrics
- Signup to first invoice < 5 minutes
- Free to paid conversion > 2%
- Monthly churn rate < 5%
- Customer acquisition cost (CAC) < $30
- Lifetime value (LTV) > $300

---

## Risk Mitigation

### Technical Risks
1. **Supabase downtime** → Implement offline mode with localStorage fallback
2. **Stripe integration issues** → Extensive testing in test mode
3. **Performance degradation** → Monitoring and alerts
4. **Security vulnerabilities** → Regular security audits

### Business Risks
1. **Low conversion** → A/B testing, improve onboarding
2. **High churn** → User interviews, feature improvements
3. **Market competition** → Unique features, better UX
4. **Pricing issues** → Flexible pricing, grandfathering

---

## Budget Estimate

### Monthly Operating Costs (assuming 1000 users)

| Service | Cost |
|---------|------|
| Supabase (Pro) | $25 |
| Vercel (Pro) | $20 |
| Domain | $1 |
| Email Service (Resend) | $20 |
| Error Tracking (Sentry) | $26 |
| Analytics (Plausible) | $9 |
| **Total** | **~$100/mo** |

### Revenue Projections (conservative)

| Users | Free | Paid (2%) | MRR | ARR |
|-------|------|-----------|-----|-----|
| 1,000 | 980 | 20 | $400 | $4,800 |
| 5,000 | 4,900 | 100 | $2,000 | $24,000 |
| 10,000 | 9,800 | 200 | $4,000 | $48,000 |

---

## Conclusion

This migration plan transforms Invoicify from a prototype into a production SaaS platform. The phased approach ensures:
- Minimal disruption to existing functionality
- Systematic implementation of new features
- Production-grade infrastructure
- Sustainable business model

**Next Steps:**
1. Review and approve this plan
2. Set up Supabase project
3. Begin Phase 1 implementation
4. Iterate based on user feedback

**Questions to Address:**
- Preferred subscription pricing?
- Target market (freelancers, small businesses, agencies)?
- Launch timeline constraints?
- Budget for additional tools/services?
