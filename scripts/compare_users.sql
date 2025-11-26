-- Compare the working user (test_login) and the failing user (정광훈)
SELECT 
    id, 
    email, 
    instance_id, 
    aud, 
    role, 
    encrypted_password,
    (SELECT count(*) FROM auth.identities WHERE user_id = auth.users.id) as identity_count
FROM auth.users 
WHERE email IN ('test_login@example.com', '정광훈@mbcplus.com');
