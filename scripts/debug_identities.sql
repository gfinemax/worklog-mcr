-- Deep compare identities
SELECT 
    u.email,
    i.provider,
    i.provider_id,
    i.identity_data,
    i.user_id
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email IN ('test_login@example.com', '정광훈@mbcplus.com');
