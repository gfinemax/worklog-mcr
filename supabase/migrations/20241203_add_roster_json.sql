
-- Add roster_json column to shift_pattern_configs table
ALTER TABLE shift_pattern_configs
ADD COLUMN IF NOT EXISTS roster_json JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN shift_pattern_configs.roster_json IS 'Snapshot of worker assignments (roster) for this configuration period';
