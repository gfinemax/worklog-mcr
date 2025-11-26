-- Compare public.users and metadata
SELECT 
    u.email,
    u.raw_user_meta_data,
    u.raw_app_meta_data,
    p.id as public_id,
    p.email as public_email,
    p.role as public_role
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email IN ('test_login@example.com', '정광훈@mbcplus.com');

-- Check triggers on auth.users (UPDATE)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND event_manipulation = 'UPDATE';
