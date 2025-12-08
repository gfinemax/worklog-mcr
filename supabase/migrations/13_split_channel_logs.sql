-- Migration: Split channel_logs into separate columns
-- Date: 2025-12-08
-- Description: Separate channel_logs JSONB into channel_timecode, channel_posts, and add system_issues

-- 1. Add new columns
ALTER TABLE public.worklogs 
ADD COLUMN IF NOT EXISTS channel_timecode JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS channel_posts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS system_issues JSONB DEFAULT '[]';

-- 2. Add column comments
COMMENT ON COLUMN public.worklogs.channel_timecode IS '운행표 수정 데이터 (채널별 timecodes)';
COMMENT ON COLUMN public.worklogs.channel_posts IS '채널별 게시물 연결 (post id/summary array)';
COMMENT ON COLUMN public.worklogs.system_issues IS '시스템 및 기타 특이사항';

-- 3. Migrate existing data from channel_logs
UPDATE public.worklogs 
SET 
    channel_timecode = (
        SELECT COALESCE(
            jsonb_object_agg(key, COALESCE(value->'timecodes', '{}'::jsonb)),
            '{}'::jsonb
        )
        FROM jsonb_each(COALESCE(channel_logs, '{}'::jsonb))
        WHERE value->'timecodes' IS NOT NULL AND value->'timecodes' != '{}'::jsonb
    ),
    channel_posts = (
        SELECT COALESCE(
            jsonb_object_agg(key, COALESCE(value->'posts', '[]'::jsonb)),
            '{}'::jsonb
        )
        FROM jsonb_each(COALESCE(channel_logs, '{}'::jsonb))
        WHERE value->'posts' IS NOT NULL AND value->'posts' != '[]'::jsonb
    )
WHERE channel_logs IS NOT NULL AND channel_logs != '{}'::jsonb;

-- 4. Handle NULL values from the migration
UPDATE public.worklogs
SET 
    channel_timecode = COALESCE(channel_timecode, '{}'::jsonb),
    channel_posts = COALESCE(channel_posts, '{}'::jsonb),
    system_issues = COALESCE(system_issues, '[]'::jsonb);

-- Note: channel_logs column is kept for backward compatibility
-- It can be dropped in a future migration after verification
