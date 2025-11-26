-- Fix missing identity for user 정광훈
-- This inserts a row into auth.identities if it doesn't exist.

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
    gen_random_uuid(), -- Generate a new UUID for the identity
    '941cace0-a9bf-47b5-9e83-04a1b73ac59b', -- The User ID
    jsonb_build_object('sub', '941cace0-a9bf-47b5-9e83-04a1b73ac59b', 'email', '정광훈@mbcplus.com'), -- Identity Data
    'email', -- Provider
    '941cace0-a9bf-47b5-9e83-04a1b73ac59b', -- Provider ID (usually same as User ID for email auth)
    now(),
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b'
);

-- Verify insertion
SELECT * FROM auth.identities WHERE user_id = '941cace0-a9bf-47b5-9e83-04a1b73ac59b';
