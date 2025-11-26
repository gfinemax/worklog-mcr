-- Check if kang1@mbcplus.com exists
SELECT id, email, raw_user_meta_data, created_at FROM auth.users WHERE email = 'kang1@mbcplus.com';

-- Check public profile
SELECT * FROM public.users WHERE email = 'kang1@mbcplus.com';

-- List triggers on auth.users again to be sure
SELECT event_object_table, trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
