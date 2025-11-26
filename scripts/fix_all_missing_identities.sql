-- Fix missing identities for ALL users
-- This ensures every user in auth.users has a corresponding record in auth.identities

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id, 'email', email),
    'email',
    id::text,
    now(),
    now(),
    now()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = u.id
);

-- Verify: List users who still have 0 identities (should be empty)
SELECT email, id, 'Still Missing Identity' as status
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = u.id);

-- Also show the count of identities for the specific users we are interested in
SELECT email, (SELECT count(*) FROM auth.identities WHERE user_id = u.id) as identity_count
FROM auth.users u
WHERE email IN ('정광훈@mbcplus.com', '정광훈@gmail.com', 'test_login@example.com');
