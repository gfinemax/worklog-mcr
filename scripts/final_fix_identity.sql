-- Final Fix: Ensure Identity Exists for 정광훈
-- We look up the ID dynamically to ensure correctness

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the User ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = '정광훈@mbcplus.com';

    -- Insert Identity if it doesn't exist
    IF target_user_id IS NOT NULL THEN
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
        VALUES (
            gen_random_uuid(),
            target_user_id,
            jsonb_build_object('sub', target_user_id, 'email', '정광훈@mbcplus.com'),
            'email',
            target_user_id::text,
            now(),
            now(),
            now()
        )
        ON CONFLICT (provider, provider_id) DO NOTHING;
    END IF;
END $$;

-- Verify Result: Show Email and Identity Count explicitly
SELECT email, (SELECT count(*) FROM auth.identities WHERE user_id = u.id) as identity_count
FROM auth.users u
WHERE email IN ('test_login@example.com', '정광훈@mbcplus.com');
