-- 1. Fix the current broken user (kang1@mbcplus.com)
UPDATE auth.identities
SET identity_data = identity_data || '{"email": "kang1@mbcplus.com"}'::jsonb
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'kang1@mbcplus.com');

-- 2. Update the function to handle this automatically in the future
CREATE OR REPLACE FUNCTION update_user_email(target_user_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update auth.users
  UPDATE auth.users
  SET 
    email = new_email,
    email_confirmed_at = now(),
    updated_at = now(),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider": "email", "providers": ["email"]}'::jsonb
  WHERE id = target_user_id;

  -- Update auth.identities (CRITICAL FIX)
  UPDATE auth.identities
  SET identity_data = identity_data || jsonb_build_object('email', new_email)
  WHERE user_id = target_user_id;

  -- Update public.users
  UPDATE public.users
  SET email = new_email, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Verify the fix for kang1
SELECT u.email, (identity_data->>'email') as identity_email 
FROM auth.identities i
JOIN auth.users u ON i.user_id = u.id
WHERE u.email = 'kang1@mbcplus.com';
