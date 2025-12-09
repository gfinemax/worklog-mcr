-- Add return_info column to broadcast_schedules
ALTER TABLE broadcast_schedules
ADD COLUMN IF NOT EXISTS return_info TEXT;

-- Add comment
COMMENT ON COLUMN broadcast_schedules.return_info IS '리턴 정보 (예: RET-1, RET-2)';
