-- Check total counts to understand the situation
SELECT 
    (SELECT count(*) FROM public.users) as public_users_count,
    (SELECT count(*) FROM auth.users) as auth_users_count;
