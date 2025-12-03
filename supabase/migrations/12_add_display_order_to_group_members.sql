-- Add display_order column to group_members table
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN public.group_members.display_order IS 'Order of display within the group';
