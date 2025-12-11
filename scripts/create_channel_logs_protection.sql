-- ============================================
-- Channel Logs 데이터 보호 시스템 마이그레이션
-- ============================================
-- 이 스크립트는 worklog의 channel_logs 데이터를 보호하기 위한
-- Audit Log, Soft Delete, Optimistic Locking을 구현합니다.
-- ============================================

-- 1. Audit Log 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS worklog_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklog_id UUID NOT NULL,
    user_id UUID,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'CLEAR_LOGS'
    old_channel_logs JSONB,
    new_channel_logs JSONB,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_worklog_audit_logs_worklog_id 
ON worklog_audit_logs(worklog_id);

CREATE INDEX IF NOT EXISTS idx_worklog_audit_logs_created_at 
ON worklog_audit_logs(created_at DESC);

COMMENT ON TABLE worklog_audit_logs IS 'Stores audit trail for all worklog changes, especially channel_logs modifications';

-- 2. Audit Trigger 함수 생성
-- ============================================
CREATE OR REPLACE FUNCTION log_worklog_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- DELETE 작업
    IF TG_OP = 'DELETE' THEN
        INSERT INTO worklog_audit_logs (worklog_id, user_id, action, old_channel_logs, old_data)
        VALUES (OLD.id, auth.uid(), 'DELETE', OLD.channel_logs, to_jsonb(OLD));
        RETURN OLD;
    END IF;

    -- INSERT 작업
    IF TG_OP = 'INSERT' THEN
        INSERT INTO worklog_audit_logs (worklog_id, user_id, action, new_channel_logs, new_data)
        VALUES (NEW.id, auth.uid(), 'INSERT', NEW.channel_logs, to_jsonb(NEW));
        RETURN NEW;
    END IF;

    -- UPDATE 작업 (channel_logs 변경 감지)
    IF TG_OP = 'UPDATE' THEN
        -- channel_logs가 변경된 경우만 기록
        IF OLD.channel_logs IS DISTINCT FROM NEW.channel_logs THEN
            INSERT INTO worklog_audit_logs (worklog_id, user_id, action, old_channel_logs, new_channel_logs)
            VALUES (
                NEW.id, 
                auth.uid(), 
                CASE 
                    WHEN NEW.channel_logs = '{}'::jsonb OR NEW.channel_logs IS NULL THEN 'CLEAR_LOGS'
                    ELSE 'UPDATE'
                END,
                OLD.channel_logs, 
                NEW.channel_logs
            );
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있으면 삭제
DROP TRIGGER IF EXISTS worklog_audit_trigger ON worklogs;

-- 트리거 연결
CREATE TRIGGER worklog_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON worklogs
FOR EACH ROW EXECUTE FUNCTION log_worklog_changes();

-- 3. Soft Delete 컬럼 추가
-- ============================================
ALTER TABLE worklogs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE worklogs 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Soft Delete 인덱스 (삭제되지 않은 항목 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_worklogs_not_deleted 
ON worklogs(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON COLUMN worklogs.deleted_at IS 'Soft delete timestamp. If set, the worklog is considered deleted.';
COMMENT ON COLUMN worklogs.deleted_by IS 'User who performed the soft delete.';

-- 4. Optimistic Locking (버전 관리) 컬럼 추가
-- ============================================
ALTER TABLE worklogs 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

COMMENT ON COLUMN worklogs.version IS 'Version number for optimistic locking to prevent concurrent update conflicts.';

-- 5. RLS 정책 (선택적 - 주의 필요)
-- ============================================
-- 먼저 기존 정책 확인 후 적용하세요.
-- 아래 정책은 테스트 후 적용을 권장합니다.

-- 내용이 있는 worklog의 hard delete 방지
-- CREATE POLICY "Prevent hard delete of worklogs with content"
-- ON worklogs FOR DELETE
-- USING (
--   channel_logs IS NULL 
--   OR channel_logs = '{}'::jsonb
--   OR deleted_at IS NOT NULL
-- );

-- ============================================
-- 마이그레이션 완료
-- ============================================
