-- Create a secure function to update user email
-- This allows the admin to update email addresses without needing the service role key on the client.

CREATE OR REPLACE FUNCTION update_user_email(target_user_id uuid, new_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator (postgres)
SET search_path = public, auth
AS $$
BEGIN
  -- Update auth.users
  UPDATE auth.users
  SET 
    email = new_email,
    email_confirmed_at = now(), -- Auto-confirm the new email
    updated_at = now(),
    -- Ensure metadata is correct
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"provider": "email", "providers": ["email"]}'::jsonb
  WHERE id = target_user_id;

  -- Update public.users (Sync)
  UPDATE public.users
  SET email = new_email, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (so the admin can call it)
GRANT EXECUTE ON FUNCTION update_user_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_email(uuid, text) TO service_role;
