-- Verify Email Migration & System Health

-- 1. Check for any remaining non-ASCII (Korean) emails
SELECT count(*) as remaining_korean_emails
FROM auth.users
WHERE email ~ '[^[:ascii:]]';

-- 2. Check for synchronization issues between auth.users and public.users
SELECT 
    au.id, 
    au.email as auth_email, 
    pu.email as public_email
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.email != pu.email;

-- 3. Check for synchronization issues between auth.users and auth.identities
-- The identity_data column is JSONB, so we extract the email from it.
SELECT 
    au.id, 
    au.email as auth_email, 
    (ai.identity_data->>'email') as identity_email
FROM auth.users au
JOIN auth.identities ai ON au.id = ai.user_id
WHERE au.email != (ai.identity_data->>'email');

-- 4. Check for missing App Metadata (Critical for Login)
SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE raw_app_meta_data IS NULL OR raw_app_meta_data = '{}'::jsonb;

-- 5. Check for missing Public Profiles
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 6. List all users to visually confirm English emails
SELECT email, raw_user_meta_data->>'name' as name, created_at
FROM auth.users
ORDER BY email;
