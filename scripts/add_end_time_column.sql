-- Add end_time and actual_end_time columns to broadcast_schedules table
ALTER TABLE public.broadcast_schedules
ADD COLUMN IF NOT EXISTS end_time TIME;

ALTER TABLE public.broadcast_schedules
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE;

-- Add comments for clarity
COMMENT ON COLUMN public.broadcast_schedules.end_time IS '예정 종료 시간';
COMMENT ON COLUMN public.broadcast_schedules.actual_end_time IS '실제 종료 시간 (방송 완료 시 기록)';
