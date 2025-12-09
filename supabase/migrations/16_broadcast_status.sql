-- 중계현황 상태 및 실제 종료 시간 컬럼 추가
-- status: scheduled, standby, live, completed, issue
-- actual_end_time: 실제 방송 종료 시간 (완료 버튼 클릭 시 기록)

ALTER TABLE broadcast_schedules 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ;

-- 기존 데이터 마이그레이션: 과거 일정은 completed, 미래 일정은 scheduled
UPDATE broadcast_schedules 
SET status = CASE 
  WHEN (date || ' ' || time)::timestamp < NOW() THEN 'completed'
  ELSE 'scheduled'
END
WHERE status IS NULL OR status = 'scheduled';

-- 인덱스 추가 (상태별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_broadcast_schedules_status ON broadcast_schedules(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_schedules_date_status ON broadcast_schedules(date, status);
