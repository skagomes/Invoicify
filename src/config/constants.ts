// Application constants

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Invoicify';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
} as const;

// Free tier limits
export const FREE_TIER_LIMITS = {
  MAX_CLIENTS: parseInt(import.meta.env.VITE_FREE_TIER_CLIENT_LIMIT || '3'),
  MAX_INVOICES_PER_MONTH: 10,
  MAX_TEAM_MEMBERS: 1,
};

// Pro tier limits (unlimited)
export const PRO_TIER_LIMITS = {
  MAX_CLIENTS: Infinity,
  MAX_INVOICES_PER_MONTH: Infinity,
  MAX_TEAM_MEMBERS: Infinity,
};

// Feature flags
export const FEATURES = {
  GOOGLE_AUTH: import.meta.env.VITE_ENABLE_GOOGLE_AUTH === 'true',
  EMAIL_INVOICES: true, // Always enabled for now
  CUSTOM_BRANDING: true,
};

// Invoice settings
export const INVOICE_CONFIG = {
  DEFAULT_TAX_RATE: 20,
  DEFAULT_CURRENCY: '$',
  INVOICE_NUMBER_PREFIX: 'INV-',
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  LONG: 'MMMM dd, yyyy',
};

// Storage buckets
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  LOGOS: 'logos',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  INVOICES: '/invoices',
  SETTINGS: '/settings',
  AUTH_CALLBACK: '/auth/callback',
} as const;
