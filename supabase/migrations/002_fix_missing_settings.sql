-- =====================================================
-- FIX MISSING SETTINGS RECORDS
-- Run this if you signed up before the database migration
-- =====================================================

-- Check if you have a settings record
SELECT
  p.id,
  p.email,
  s.id as settings_id,
  CASE
    WHEN s.id IS NULL THEN '❌ MISSING - Will be created'
    ELSE '✅ EXISTS'
  END as status
FROM profiles p
LEFT JOIN settings s ON s.user_id = p.id;

-- Create missing settings for users who don't have them
-- This will only insert if the user doesn't already have settings
INSERT INTO public.settings (user_id, language)
SELECT
  p.id,
  'en' as language
FROM profiles p
LEFT JOIN settings s ON s.user_id = p.id
WHERE s.id IS NULL;

-- Verify all users now have settings
SELECT
  p.email,
  s.company_name,
  s.currency_symbol,
  s.language
FROM profiles p
JOIN settings s ON s.user_id = p.id;
