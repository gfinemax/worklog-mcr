-- Fix missing raw_app_meta_data for 정광훈
-- This metadata is required by Supabase Auth to know which providers are enabled.

UPDATE auth.users
SET raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE email = '정광훈@mbcplus.com';

-- Verify the update
SELECT email, raw_app_meta_data 
FROM auth.users 
WHERE email = '정광훈@mbcplus.com';
