-- Update support_staff table columns
-- Rename role to 담당, add 회사 and 분류 columns

-- Rename role column to 담당
ALTER TABLE public.support_staff RENAME COLUMN role TO 담당;

-- Add 회사 column
ALTER TABLE public.support_staff ADD COLUMN IF NOT EXISTS 회사 TEXT;

-- Add 분류 column
ALTER TABLE public.support_staff ADD COLUMN IF NOT EXISTS 분류 TEXT;