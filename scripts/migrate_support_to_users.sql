
-- Migration: Merge support_staff into users table

-- 1. Add 'type' column to users if it doesn't exist (to distinguish internal vs external/support)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'internal' CHECK (type IN ('internal', 'external', 'support'));

-- 1.1 Drop Foreign Key constraint to auth.users if it exists (to allow non-auth users)
-- Note: You might need to check the exact constraint name. Default is often 'users_id_fkey'.
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_id_fkey') THEN 
    ALTER TABLE public.users DROP CONSTRAINT users_id_fkey; 
  END IF; 
END $$;

-- 2. Add 'organization' column to users (from support_staff)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization TEXT;

-- 3. Add 'phone' column to users (from support_staff)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 4. Migrate data from support_staff to users
-- We need to generate UUIDs for them since they don't have auth.users entries
INSERT INTO public.users (id, name, email, role, type, organization, phone, created_at, updated_at)
SELECT 
    id, -- Keep the same ID if possible, or gen_random_uuid() if ID conflict risks (usually safe if UUIDs)
    name, 
    email, 
    role, 
    'support', -- Set type to support
    organization, -- Assuming this column exists in support_staff or we default it
    phone,
    created_at, 
    updated_at
FROM public.support_staff
ON CONFLICT (email) DO NOTHING; -- Skip if email already exists in users

-- 5. (Optional) Update foreign keys in other tables to point to users instead of support_staff
-- This is complex if you have polymorphic relations. 
-- For now, we just prepare the users table.

-- 6. (Optional) Drop support_staff table
-- DROP TABLE public.support_staff;
