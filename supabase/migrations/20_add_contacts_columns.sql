-- Add 직책 and 카테고리 columns to contacts table

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS "직책" TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS "카테고리" TEXT;