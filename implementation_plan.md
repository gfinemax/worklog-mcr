# 구현 계획 - 순환 근무 및 근무자 표시

## 목표
1.  **현재 근무자 표시**: 로그인한 사용자의 조원들을 "근무자 확정" 화면에 역할별로 정렬하여 표시합니다.
2.  **순환 근무 시스템 계획**: 사이드바 설정을 통해 접근 가능한 설정 가능한 순환 근무 시스템(ANSYY 패턴)을 설계합니다.

## 사용자 검토 필요 사항
> [!IMPORTANT]
> **근무 패턴 업데이트**: 사용자가 **역할 교대**가 포함된 **10일 주기** (ANSYY x 2)를 지정했습니다.
> - **패턴**: A (주간), N (야간), S (비번), Y (휴무), Y (휴무) - 5일마다 반복.
> - **역할 순환**: 역할(감독/부감독)이 5일마다(각 ANSYY 주기마다) 교대됩니다.
> - **전체 주기**: 10일.
> - **기준일**: 2025-11-06, 1조가 주간(A) 근무로 시작하며 초기 역할은 (정광훈=감독, 오동섭=부감독)입니다.

## 제안된 변경 사항

### 1. 근무자 표시 (현재 멤버)
- **상태**: `app/login/page.tsx`에 구현됨.
- **검증**:
    - `prepareSessionSetup` 함수가 `group_members`에서 멤버를 가져옵니다.
    - 역할별로 정렬합니다 (감독 > 부감독 > 영상).
    - **조치**: 시드 스크립트를 통해 데이터 존재 여부를 확인했습니다.

### 2. 순환 근무 시스템 (계획)

#### 데이터베이스 스키마
복잡한 로직을 저장하기 위한 새로운 테이블 `shift_configs`:
```sql
create table shift_configs (
  id uuid primary key default gen_random_uuid(),
  pattern_name text not null, -- "5조 10교대 (ANSYY)"
  cycle_length int not null default 10, -- 10일
  anchor_date date not null, -- '2025-11-06'
  
  -- 주기 내 각 날짜의 근무 형태 정의 (0-9)
  -- 예: ['A', 'N', 'S', 'Y', 'Y', 'A', 'N', 'S', 'Y', 'Y']
  shift_sequence text[] not null, 
  
  -- 주기 내 각 날짜의 역할 매핑 정의 (0-9)
  -- 예: [
  --   { "director": 0, "assistant": 1, "video": 2 }, ... (0-4일차)
  --   { "director": 1, "assistant": 0, "video": 2 }, ... (5-9일차)
  -- ]
  -- 인덱스는 정렬된 멤버 목록을 참조합니다.
  role_rotation_map jsonb not null,
  
  -- 기준일의 각 조별 시작 오프셋
  -- 예: { "1조": 0, "2조": 2, ... }
  team_offsets jsonb not null,
  
  created_at timestamptz default now()
);
```

#### 로직 (유틸리티 함수)
`getShiftInfo(teamName, targetDate, config, teamMembers)`:
1.  `daysDiff` = `targetDate` - `config.anchor_date` 계산.
2.  `config.team_offsets`에서 `teamOffset` 가져오기.
3.  `currentIndex` = (`daysDiff` + `teamOffset`) % `config.cycle_length`.
4.  **근무 형태**: `config.shift_sequence[currentIndex]`.
5.  **역할 매핑**: `config.role_rotation_map[currentIndex]`.
6.  **역할 할당**: 매핑에 정의된 대로 `teamMembers`(기본 순위로 정렬됨)를 역할에 할당합니다.

#### UI 컴포넌트
1.  **사이드바**: "설정" -> "근무 패턴 설정" 추가.
2.  **설정 페이지** (`/settings/shift-rotation`):
    *   **주기 설정**:
        *   길이: 10일
        *   패턴 입력: A, N, S, Y, Y (반복)
    *   **역할 순환 규칙**:
        *   "1-5일차: 기본 순서"
        *   "6-10일차: 감독/부감독 교대"
    *   **기준일 설정**: 날짜 선택기 (2025-11-06).
    *   **미리보기**: 선택한 조의 근무 및 특정 멤버 역할을 보여주는 달력 뷰.

#### 통합
-   **대시보드**: "오늘의 근무" 및 "오늘의 감독" 표시.
-   **로그인 화면**: 조가 로그인할 때, (기본 정적 역할 대신) 순환 로직에 따라 역할을 자동으로 제안합니다.

## 검증 계획
### 자동화 테스트
-   2025-11-06 (1일차) -> 정광훈=감독 인지 확인하는 `getShiftInfo` 단위 테스트.
-   2025-11-11 (6일차) -> 오동섭=감독 인지 확인하는 `getShiftInfo` 단위 테스트.

### 수동 검증
-   설정 > 근무 패턴 설정으로 이동.
-   미리보기가 사용자의 예시 표와 일치하는지 확인.
