-- Add channel_logs column to worklogs table
ALTER TABLE public.worklogs 
ADD COLUMN IF NOT EXISTS channel_logs JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.worklogs.channel_logs IS 'Stores the content and timecodes for each channel';
