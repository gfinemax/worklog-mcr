-- Migration: Add missing columns to broadcast_schedules
-- Date: 2025-12-08
-- Description: Add columns for full broadcast schedule management

-- Add missing columns if they don't exist
ALTER TABLE public.broadcast_schedules 
ADD COLUMN IF NOT EXISTS send_line TEXT,
ADD COLUMN IF NOT EXISTS hq_network TEXT,
ADD COLUMN IF NOT EXISTS broadcast_van TEXT,
ADD COLUMN IF NOT EXISTS manager TEXT,
ADD COLUMN IF NOT EXISTS biss_code TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add column comments
COMMENT ON COLUMN public.broadcast_schedules.send_line IS '송신 라인';
COMMENT ON COLUMN public.broadcast_schedules.hq_network IS '본사망';
COMMENT ON COLUMN public.broadcast_schedules.broadcast_van IS '중계차';
COMMENT ON COLUMN public.broadcast_schedules.manager IS '담당자';
COMMENT ON COLUMN public.broadcast_schedules.biss_code IS 'BISS 코드';
