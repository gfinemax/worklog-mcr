-- Check for the gmail user
SELECT 
    id, 
    email, 
    encrypted_password,
    email_confirmed_at,
    (SELECT count(*) FROM auth.identities WHERE user_id = auth.users.id) as identity_count
FROM auth.users 
WHERE email IN ('정광훈@gmail.com', '정광훈@mbcplus.com');
