-- Add author_id column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
