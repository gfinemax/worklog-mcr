-- Diagnose User State
SELECT 
    u.email,
    u.id,
    u.email_confirmed_at,
    u.banned_until,
    u.is_sso_user,
    (SELECT count(*) FROM auth.identities WHERE user_id = u.id) as identity_count,
    (SELECT provider_id FROM auth.identities WHERE user_id = u.id LIMIT 1) as provider_id,
    (SELECT provider FROM auth.identities WHERE user_id = u.id LIMIT 1) as provider
FROM auth.users u
WHERE u.email IN ('test_login@example.com', '정광훈@mbcplus.com');
