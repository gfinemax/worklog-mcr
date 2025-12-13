-- Update contacts table columns
-- Rename organization to 담당, add 회사 and 분류 columns

-- Rename organization column to 담당
ALTER TABLE public.contacts RENAME COLUMN organization TO 담당;

-- Add 회사 column
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS 회사 TEXT;

-- Add 분류 column
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS 분류 TEXT;