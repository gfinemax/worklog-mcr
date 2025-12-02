-- Add signatures column to worklogs table
ALTER TABLE public.worklogs 
ADD COLUMN IF NOT EXISTS signatures JSONB DEFAULT '{"operation": null, "mcr": null, "team_leader": null, "network": null}';

-- Update existing rows to have default value
UPDATE public.worklogs 
SET signatures = '{"operation": null, "mcr": null, "team_leader": null, "network": null}' 
WHERE signatures IS NULL;
