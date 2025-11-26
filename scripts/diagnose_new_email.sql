-- Diagnose User State for kang1@mbcplus.com
SELECT 
    u.email,
    u.id,
    u.raw_app_meta_data,
    (SELECT count(*) FROM auth.identities WHERE user_id = u.id) as identity_count,
    (SELECT provider_id FROM auth.identities WHERE user_id = u.id LIMIT 1) as identity_provider_id,
    (SELECT identity_data FROM auth.identities WHERE user_id = u.id LIMIT 1) as identity_data
FROM auth.users u
WHERE u.email = 'kang1@mbcplus.com';
