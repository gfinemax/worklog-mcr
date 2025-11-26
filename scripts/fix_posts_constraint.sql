-- Drop the blocking check constraint on the posts table
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_check;
