-- Migration to add roster_json column to shift_pattern_configs table
-- This column stores the name-based role mapping for each team

ALTER TABLE shift_pattern_configs
ADD COLUMN IF NOT EXISTS roster_json JSONB DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN shift_pattern_configs.roster_json IS 'Name-based role mapping: { "1조": { "감독": "홍길동", "부감독": "김철수", "영상": "이영희" }, ... }';
