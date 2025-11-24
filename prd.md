# MBC PLUS MCR 디지털 업무일지 시스템 - 제품 요구사항 정의서 (PRD)

## 1. 시스템 개요

**MCR 디지털 업무일지 시스템**은 MBC PLUS의 방송 운행 및 송출 업무를 효율적으로 관리하기 위한 웹 기반 플랫폼입니다. 기존의 수기 업무일지를 디지털화하여 데이터의 정확성을 높이고, 실시간 모니터링, AI 기반 요약, 통계 분석 기능을 제공합니다.

**플랫폼**: 웹과 모바일을 동시 지원하는 반응형 웹 애플리케이션으로, 데스크톱, 태블릿, 스마트폰 모두에서 최적화된 경험을 제공합니다.

### 1.1 핵심 가치
- 업무일지 디지털화를 통한 데이터 정확성 향상
- 실시간 모니터링 및 협업 지원
- AI 기반 자동 요약으로 업무 효율성 극대화
- 통계 분석을 통한 인사이트 제공
- **언제 어디서나 접근 가능한 모바일 지원**

### 1.2 주요 메뉴 구조
1. **대시보드** - 당일 현황 및 주요 지표 모니터링
2. **업무일지** - 당일 업무일지 작성 및 관리
3. **업무일지 목록** - 과거 업무일지 조회 및 검색, 업무일지 결제상태, 주요이슈 및 사고 표시
4. **포스트** - 통합 콘텐츠 관리 (메모, 게시글, 답글)
5. **채널 관리** - 방송 채널별 운행표 관리
6. **업무확인 서명** - 4개 파트 서명 관리
7. **통계 및 보고서** - 운행 데이터 분석 및 시각화
8. **사용자 관리** - 계정, 팀, 스태프 관리
9. **설정** - 시스템 설정 및 근무 패턴 관리

---

## 2. 사용자 인증 및 권한

### 2.1 인증 시스템

**인증 방식**: Supabase Auth (JWT 기반)
- Access Token: 24시간
- Refresh Token: 7일

**로그인 유형**: 2가지 로그인 방식 지원

**1. 팀 로그인** (사용자 편의성 최적화) - 현재 구현됨 ✅
- 팀 계정으로 로그인 (예: "3팀" 로그인)
- 팀원 전체가 자동 로그인 상태
- 글 작성/수정 시 팀원 선택 UI 제공
- 선택된 팀원 이름으로 작성자 기록
- **장점**: 근무 교대 시 개별 로그인/로그아웃 불필요
- **사용 시나리오**: 근무조 근무 중 공용 PC 사용

**2. 개인 로그인** - 현재 구현됨 ✅
- 개인 이메일/비밀번호로 로그인
- 개인 계정으로만 활동
- 개인 대시보드 및 개인 알림
- **사용 시나리오**: 개인 PC, 모바일 기기

**보안**: RBAC (Role-Based Access Control)

### 2.2 사용자 역할 (Role)

| 역할 | 코드 | 설명 | 권한 |
|------|------|------|------|
| 주조감독 | `main_director` | 총괄 책임자 | 전체 관리 권한 |
| CMS감독 | `sub_director` | CMS 담당 | 일지 작성/수정 |
| 예비감독 | `backup_director` | 예비 인력 | 일지 작성/수정 |
| 영상감독 | `tech_staff` | 기술 담당 | 일지 작성/수정 |
| 관리자 | `admin` | 시스템 관리자 | 전체 시스템 관리 |

### 2.3 스태프 관리
- **WorklogStaff 모델**: 정식 사용자(`User`)와 외부 인원(`ExternalStaff`) 모두 등록 가능
- **역할 할당**: 업무일지 작성 시 스태프별 역할 지정
- **유연성**: 근무조별 스태프 구성 변경 가능

---

## 3. 대시보드

### 3.1 일일 현황 모니터링

**당일 근무 정보**
- 근무조 정보 (A/N 근무 구분)
- 담당자 목록 (주조감독, CMS감독, 예비감독, 영상감독)
- 근무 시간대 표시

**채널별 운행 현황**
- 5개 채널 운행표 등록 현황
- 채널별 등록 횟수 실시간 표시
- 실시간 이슈 모니터링

**업무확인 서명 현황**
- 4개 파트 서명 상태
  - 운행 파트
  - 팀장 파트
  - MCR 파트
  - Network 파트
- 진행률(%) 표시
- 미서명 알림

**주요 이슈 요약**
- 당일 주요 이슈 목록 (긴급도별)
- 최근 포스트 목록
- AI 요약 표시

**팀로그인시 주요이슈 표시**
- AI 요약 표시
- 오늘 근무 주요 송출 내용, 공지 및 주요이슈 및 사고 표시

**중요 포스트 (핀 고정)**
- 관리자 또는 주조감독이 '중요' 표시한 포스트
- 카테고리별 중요 포스트 (최대 5개)
- 포스트 제목, 작성자, 작성일, 카테고리 표시
- 클릭 시 해당 포스트로 이동
- 긴급 사항은 자동으로 대시보드 상단 표시

### 3.2 빠른 액션
- 당일 업무일지 바로가기
- 빠른 메모 작성 (카테고리 선택)
- 긴급 이슈 등록 (자동 중요 표시)
- 중요 포스트 관리 (핀 추가/제거)

---

## 4. 업무일지

### 4.1 근무 체계

**근무일 기준**
- 기준 시간: 당일 07:30 ~ 익일 07:30 (24시간)
- 1일 기준으로 **주간A근무 일지**와 **야간N근무 일지** 각각 작성
- 야간 근무가 이틀에 걸쳐도 활성화된 업무일지 로직으로 정확한 귀속

**근무 패턴 (ANSYY 5일 주기)**
- **A (Day)**: 주간 근무 (07:30 ~ 19:00)
- **N (Night)**: 야간 근무 (18:30 ~ 익일 08:00) - 통상 'NS'로 지칭
- **S (Sleep)**: 야간 근무 종료일 (휴식)
- **Y (Off)**: 휴무
- **Y (Off)**: 휴무

**근무조 운영**
- 10개 팀이 5일 주기 패턴 순환
- 각 팀당 3~4명 구성 (기본 3명 + 상황에 따라 1명 추가)

**순환 예시**

| 팀 | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|----|-------|-------|-------|-------|-------|
| 1조 | A | N | S | Y | Y |
| 2조 | N | S | Y | Y | A |
| 3조 | S | Y | Y | A | N |
| 4조 | Y | Y | A | N | S |
| 5조 | Y | A | N | S | Y |
| 6조 | A | N | S | Y | Y |
| 7조 | N | S | Y | Y | A |
| 8조 | S | Y | Y | A | N |
| 9조 | Y | Y | A | N | S |
| 10조 | Y | A | N | S | Y |

### 4.2 업무일지 작성

**기본 정보 입력**
- 근무일자
- 근무 구분 (A/N)
- 팀 선택
- 근무자 지정
  - 주조감독
  - CMS감독
  - 예비감독
  - 영상감독

**채널별 송출 사항**
- 대상 채널: MBC SPORTS+, MBC Every1, MBC DRAMA, MBC M, MBC ON
- 각 채널 약어 표시 : MBC SPORTS+는 'SP', MBC Every1는 'EV', MBC DRAMA는 'DR', MBC M은 'M', MBC ON은 'ON'
- 각 채널별 운행표 등록 (1~5회)
  - **운행표 수정 기능**:
    - 원형 숫자 버튼(1~5) 클릭 시 타임코드 입력 팝업 표시
    - 각 번호당 1개의 타임코드만 저장 (덮어쓰기 방식)
    - 선택된 번호는 시각적으로 강조 표시 (검은색 배경) 유지
    - 기존 입력값이 있는 경우 팝업에 자동 로드
  - **타임코드 입력**:
    - 기본 형식: `[채널약어] HH:MM:SS:FF부터 정규[N+1]번`
    - 예시: "SP 00:00:00:00부터 정규2번" (MBC SPORTS+, 1번 선택 시)
    - 타임코드 형식: HH:MM:SS:FF (시:분:초:프레임)
    - 유효 범위: 00:00:00:00 ~ 23:59:59:23
    - 범위 초과 시 에러 메시지 표시 및 입력 거부
  - **자동 정렬**:
    - 오른쪽 입력창에 번호 순서대로 오름차순(1→2→3→4→5) 자동 정렬
    - 입력 순서와 무관하게 항상 번호 순서로 표시
    - 오른쪽 입력창은 읽기 전용 (자동 생성)
- 관련 내용 입력 (왼쪽 입력창)
- '글작성' 버튼 → 통합 포스트 작성 및 자동 연결
- 작성 완료 시 AI 요약글 자동 표시

**장비 및 시스템**
- 주요사항 기록
- 추가 이슈 입력
- '메모 추가' 버튼 → 통합 포스트 작성 및 자동 연결

**댓글 알림**
- AI 요약문 옆에 댓글 개수 표시 (💬 3)
- 클릭 시 댓글 목록 표시

### 4.3 상태 관리
- **Draft** (임시저장): 작성 중인 일지
- **Published** (발행): 완료된 일지
- 상태 전환 가능

### 4.4 제약 조건
- 팀당 날짜별 1개의 일지만 생성 가능 (Unique Constraint)
- **과거 일지 수정 제한**:
  - 업무일지 본문 및 기본 정보: 읽기 전용 (수정 불가)
  - 연결된 포스트 댓글: 언제든지 작성/수정/삭제 가능
  - 새로운 포스트 추가: 과거 일지에 연결 가능

---

## 5. 업무일지 목록

### 5.1 검색 및 필터링

**검색 조건**
- 기간 검색 (시작일 ~ 종료일)
- 팀 필터
- 근무 구분 (A/N)
- 작성자 검색
- **카테고리 필터** (다중 선택 가능)
- 태그 필터
- 중요도 필터 (일반/중요/긴급)
- 키워드 검색 (제목, 본문)

**정렬 옵션**
- 최신순 / 오래된순
- 팀별
- 근무일자별
- 카테고리별

### 5.2 목록 표시

**기본 정보**
- 근무일자
- 팀명
- 근무 구분 (A/N)
- 근무자 (주조감독)
- 서명 상태 (진행률 %)
- 포스트 수 / 댓글 수

**빠른 액션**
- 상세보기
- 과거 메모 추가 (해당 일지에 연결)
- PDF 출력

### 5.3 과거 일지 연동
- 특정 Worklog 선택 후 메모 작성 가능
- 작성된 메모는 해당 업무일지에 자동 연결

---

## 6. 포스트 (통합 콘텐츠 관리)

### 6.1 통합 Post 모델

**콘텐츠 유형**
- 채널 메모
- 시스템 메모
- 일반 게시글
- 답글 (Reply)

**필드 구조**
- 제목 (Title)
- 본문 (Content) - Rich Text
- 요약 (Summary) - AI 자동 생성
- 작성자 (Author)
- 연결된 Worklog (Optional)
- Parent (답글용)
- **카테고리 (Category)** - 필수 선택 (10개 중 1개)
- 태그 (Tags) - 선택적, 다중 선택
- **중요 표시 (Is Pinned)** - Boolean, 대시보드 고정용
- **우선순위 (Priority)** - 일반/중요/긴급
- 첨부파일
- 작성일시/수정일시
- 조회수, 좋아요 수

### 6.2 작성 방식

**1. 빠른 메모 (Quick Memo)**
- 업무일지 화면에서 체크박스 클릭
- 팝업 형태로 즉시 작성
- 현재 Worklog에 자동 연결
- 카테고리 필수 선택
- 중요 표시 옵션

**2. 일반 게시글**
- 포스트 목록에서 '새 글 작성'
- Worklog 연결 선택 가능 (Optional)
- 카테고리 필수 선택
- 태그 다중 선택
- 우선순위 설정 (일반/중요/긴급)
- 중요 표시 시 대시보드 고정

**3. 과거 메모**
- 업무일지 목록에서 특정 Worklog 선택
- '메모 추가' 버튼으로 작성
- 선택한 Worklog에 자동 연결
- 카테고리 및 우선순위 선택

**4. 선택적 연결**
- 작성 시 Worklog 선택/해제 가능
- 수정 시 연결 변경 가능
- 중요 표시 변경 가능 (권한자만)

**권한 관리**
- **중요 표시 권한**: 관리자, 주조감독, CMS감독
- **일반 포스트**: 모든 역할
- **긴급 카테고리**: 자동으로 중요 표시

### 6.3 Rich Text Editor
- **에디터**: React Quill 기반
- **지원 기능**
  - 텍스트 서식 (굵게, 기울임, 밑줄)
  - 목록 (순서, 비순서)
  - 링크 삽입
  - 이미지 삽입
  - 코드 블록
  - 인용구

### 6.4 AI 기능

**자동 요약**
- Post 저장 시 백엔드 LLM API 자동 호출
- 본문을 40자 내외로 요약
- `summary` 필드에 자동 저장
- A4 출력용으로 활용

**AI 처리 상태**
- 요약 생성 중
- 요약 완료
- 요약 실패

**서비스 연동**
- `posts/ai_service.py` 모듈
- 게시글 내용 재정리 기능
- AI 처리 상태 추적

### 6.5 계층형 답글 시스템

**댓글 (Comment)**
- 간단한 텍스트 의견
- 빠른 피드백용

**답글 (Reply Post)**
- 독립적인 글로서의 답글
- Post의 `parent` 필드 활용
- 공식 후속 조치 보고서 작성
- Rich Text 지원

### 6.6 분류 및 구조화

**카테고리 시스템**

시스템 기본 카테고리 (관리자가 추가/수정/삭제 가능):

1. **채널 운행** - 채널별 방송 운행 관련 사항
2. **장비 점검** - 정기 및 수시 장비 점검 기록
3. **시스템 이슈** - 시스템 오류 및 이상 현상
4. **긴급 사항** - 즉시 대응이 필요한 긴급 이슈
5. **정기 점검** - 정기적인 유지보수 및 점검
6. **송출 사고** - 방송 송출 중 발생한 사고
7. **기술 지원** - 기술팀 협업 및 지원 요청
8. **운영 공지** - 팀 내 공지 및 안내사항
9. **협업 요청** - 타 부서/팀 협업 관련
10. **기타** - 위 카테고리에 속하지 않는 사항

**카테고리 관리**
- 관리자 권한으로 카테고리 추가/수정/삭제
- 카테고리명, 설명, 색상 지정 가능
- 카테고리 순서 조정
- 사용 중인 카테고리 삭제 시 "기타"로 자동 이동

**카테고리별 기능**
- 카테고리별 필터링 및 검색
- 카테고리별 통계 (사용 빈도)
- 대시보드에서 카테고리별 현황 표시
- 카테고리별 색상 코드로 시각적 구분

**태그 시스템**
- 자유로운 태그 추가 (카테고리와 별개)
- 태그별 필터링
- 태그 자동완성
- 인기 태그 표시
- 태그 통계

**작성자 구분**
- 개인 작성
- 팀 단위 작성

### 6.7 커뮤니티 기능

**상호작용**
- 조회수 트래킹
- 추천 (좋아요) 기능
- 북마크

**알림**
- 답글 알림
- 댓글 알림
- 멘션 알림

### 6.8 첨부파일 관리

**첨부 대상**
- WorkLog에 파일 첨부
- ChannelBroadcast에 파일 첨부
- Post에 파일 첨부

**지원 형식**
- 이미지: JPG, PNG, GIF (최대 20MB)
- 문서: PDF, DOCX, XLSX (최대 20MB)

**보안**
- MIME 타입 검증
- 파일 크기 제한
- 업로드 경로 자동 관리
- 악성 파일 차단

---

## 7. 채널 관리

### 7.1 채널 목록

**대상 채널** (5개)
1. MBC SPORTS+
2. MBC Every1
3. MBC DRAMA
4. MBC M
5. MBC ON

### 7.2 운행표 관리

**등록 관리**
- 각 채널별 1~5회 등록 지원
- 등록 횟수 실시간 카운트
- 시간대별 스케줄 표시

**내용 입력**
- 프로그램명
- 방송 시간
- 특이사항
- 관련 내용 입력
- 추가 내용 입력

**연동 기능**
- ChannelBroadcast 모델과 1:1 연동
- 업무일지에서 직접 등록
- 포스트와 자동 연결

### 7.3 실시간 모니터링
- 채널별 등록 현황
- 시간대별 운행 상태
- 이슈 발생 알림

---

## 8. 업무확인 서명

### 8.1 서명 시스템

**4개 파트 서명**
1. **운행 파트** - 방송 운행 담당자
2. **팀장 파트** - 해당 팀 팀장
3. **MCR 파트** - MCR 책임자
4. **Network 파트** - 네트워크 담당자

### 8.2 서명 프로세스

**서명 순서**
- 순차적 서명 (1 → 2 → 3 → 4)
- 또는 독립적 서명 (순서 무관)

**서명 정보 기록**
- 서명자 ID
- 서명 완료 시각 (Timestamp)
- 서명 상태

### 8.3 상태 모니터링

**진행률 표시**
- 전체 서명 진행률 (%)
- 파트별 서명 상태
  - ✅ 완료
  - ⏳ 대기 중
  - ❌ 미완료

**알림**
- 미서명 파트 알림
- 서명 완료 알림
- 마감 임박 알림

### 8.4 서명 관리
- 서명 취소 (권한자만)
- 서명 이력 조회
- 서명 통계

---

## 9. 통계 및 보고서

### 9.1 운행 통계

**채널별 분석**
- 채널별 등록 횟수 분포
- 시간대별 운행 패턴
- 프로그램별 빈도

**차트**
- 막대 그래프: 채널별 비교
- 선 그래프: 시간대별 추이
- 원 그래프: 비율 표시

### 9.2 이슈 분석

**장비/시스템 이슈**
- 이슈 발생 빈도
- 장비별 고장 통계
- 해결 소요 시간
- 트렌드 분석

**긴급도별 분석**
- 긴급 이슈 비율
- 대응 시간 평균
- 재발 이슈 추적

### 9.3 업무 통계

**일지 작성 현황**
- 월별/주별 작성 건수
- 팀별 작성 현황
- 미작성 일지 추적

**담당자별 통계**
- 담당자별 업무량
- 포스트 작성 빈도
- 평균 작업 시간

**카테고리 통계**
- 카테고리별 포스트 수
- 월별/주별 카테고리 추이
- 가장 많이 사용되는 카테고리 TOP 5
- 팀별 카테고리 사용 패턴
- 긴급 카테고리 발생 빈도

**태그 통계**
- 인기 태그 TOP 10
- 태그 사용 트렌드
- 태그 연관 분석

### 9.4 기간별 리포트

**주간 리포트**
- 주간 운행 요약
- 주요 이슈 목록
- 다음 주 주의사항

**월간 리포트**
- 월간 운행 통계
- 장비 점검 이력
- 개선 사항

**분기/연간 리포트**
- 장기 트렌드 분석
- 운행 패턴 변화
- 시스템 개선 효과

### 9.5 데이터 시각화

**차트 유형**
- 막대 그래프
- 선 그래프
- 원 그래프
- 히트맵
- 타임라인

**필터링**
- 기간 선택
- 팀 선택
- 채널 선택
- 카테고리 선택

**내보내기**
- Excel 다운로드
- PDF 출력
- 이미지 저장

---

## 10. 사용자 관리

### 10.1 계정 관리

**사용자 정보**
- 이름
- 이메일
- 연락처
- 역할 (Role)
- 소속 팀

**계정 상태**
- 활성화
- 비활성화
- 휴면 계정

**권한 관리**
- 역할별 권한 설정
- 메뉴별 접근 제어
- 기능별 권한 할당

### 10.2 팀 관리

**Team 모델**
- 팀 생성
- 팀 이름 변경
- 팀 삭제
- 팀원 구성 관리

**팀 구성**
- 팀원 추가
- 팀원 이동
- 팀원 제외
- 역할 할당

**10개 팀 운영**
- 순환 근무조 관리
- 팀별 근무 패턴 설정
- 팀별 통계 확인

### 10.3 외부 스태프 관리

**ExternalStaff 모델**
- 비정규 인원 등록
- 임시 근무자 관리
- 외주 인력 관리

**관리 기능**
- 외부 스태프 추가
- 근무 기간 설정
- 권한 제한 설정

### 10.4 WorklogStaff 관리

**유연한 스태프 할당**
- 정식 사용자 + 외부 인원 통합 관리
- 업무일지별 스태프 지정
- 역할별 할당

---

## 11. 설정

### 11.1 근무조 및 패턴 관리

**유연한 설정**
- 근무조 구성원 변경 가능
- 근무 패턴 순서 변경 가능
- 주기 조정 가능

**관리 기능**
- 팀별 근무자 구성 설정
  - 이동
  - 추가
  - 제외
- 근무 패턴 설정
  - ANSYY 패턴 변경
  - 순서 조정
  - 주기 설정 (기본 5일)
- 반영 시점 설정
  - 즉시 반영
  - 예약 반영 (예: 2025년 11월 24일 10:00)

**적용 방식**
- 변경 사항 즉시 또는 지정 시점부터 반영
- 일지 생성 로직에 자동 적용
- 이력 관리 및 롤백 기능

### 11.2 업무일지 포맷 관리

**포맷 설정**
- A4 출력용 레이아웃
- 섹션 구성 변경
- 필드 표시/숨김
- 폰트 및 스타일

**관리 기능**
- 포맷 템플릿 생성
- 포맷 수정
- 포맷 미리보기
- 반영 시점 설정

**적용**
- 즉시 반영 또는 예약 반영
- 일지 출력 시 자동 적용

### 11.3 카테고리 관리

**카테고리 설정**
- 카테고리 추가
  - 카테고리명 (필수)
  - 설명 (선택)
  - 색상 코드 지정 (UI 구분용)
  - 아이콘 선택 (선택)
- 카테고리 수정
  - 이름, 설명, 색상 변경
  - 순서 조정 (드래그 앤 드롭)
- 카테고리 삭제
  - 사용 중인 경우 경고 메시지
  - 삭제 시 해당 포스트를 "기타" 카테고리로 자동 이동
  - 삭제 이력 관리

**기본 카테고리**
- 시스템이 제공하는 10개 기본 카테고리
- 기본 카테고리도 수정/삭제 가능
- 최소 1개 카테고리는 유지 필요

**카테고리 통계**
- 카테고리별 사용 빈도
- 인기 카테고리 분석
- 미사용 카테고리 표시

### 11.4 시스템 설정

**일반 설정**
- 시스템 이름
- 로고
- 테마 (다크 모드)
- 언어

**알림 설정**
- 이메일 알림
- 앱 푸시 알림
- 알림 시간대

**보안 설정**
- 세션 타임아웃
- 비밀번호 정책
- 2단계 인증 (Optional)

### 11.5 데이터 관리

**백업**
- 자동 백업 설정
- 백업 주기
- 백업 저장 경로

**복원**
- 백업 파일 목록
- 특정 시점 복원
- 선택적 복원

**데이터 정리**
- 오래된 데이터 아카이브
- 로그 파일 정리
- 임시 파일 삭제

---

## 12. 데이터베이스 설계 (Supabase/PostgreSQL)

### 12.1 ERD 개요

시스템의 핵심 엔티티 관계:
- Users ↔ Teams (다대다)
- Worklogs ↔ Teams (다대일)
- Worklogs ↔ Posts (일대다)
- Posts ↔ Categories (다대일)
- Posts ↔ Comments (일대다)
- Worklogs ↔ Signatures (일대다)
- Worklogs ↔ ChannelBroadcasts (일대다)

### 12.2 주요 테이블 정의

#### users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL, -- main_director, sub_director, backup_director, tech_staff, admin
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### teams (팀)
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 1조, 2조, ..., 10조
  team_login_id VARCHAR(100) UNIQUE, -- 팀 로그인용 ID
  team_password_hash TEXT, -- 팀 로그인용 비밀번호
  description TEXT,
  shift_pattern VARCHAR(10) DEFAULT 'ANSYY', -- 근무 패턴
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_teams_name ON teams(name) WHERE is_active = true;
```

#### team_members (팀원 매핑)
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 팀 내 역할
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

#### external_staff (외부 스태프)
```sql
CREATE TABLE external_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  organization VARCHAR(200), -- 소속
  role VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### worklogs (업무일지)
```sql
CREATE TABLE worklogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_date DATE NOT NULL, -- 근무 기준일 (07:30 기준)
  shift_type VARCHAR(10) NOT NULL, -- 'A' (Day) or 'N' (Night)
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약: 팀당 날짜별 shift_type별 1개만
  UNIQUE(team_id, work_date, shift_type)
);

CREATE INDEX idx_worklogs_date ON worklogs(work_date DESC);
CREATE INDEX idx_worklogs_team ON worklogs(team_id);
CREATE INDEX idx_worklogs_status ON worklogs(status);
```

#### worklog_staff (업무일지 스태프)
```sql
CREATE TABLE worklog_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID REFERENCES worklogs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  external_staff_id UUID REFERENCES external_staff(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL, -- main_director, sub_director, backup_director, tech_staff
  
  -- user_id 또는 external_staff_id 중 하나는 반드시 있어야 함
  CHECK (
    (user_id IS NOT NULL AND external_staff_id IS NULL) OR
    (user_id IS NULL AND external_staff_id IS NOT NULL)
  )
);

CREATE INDEX idx_worklog_staff_worklog ON worklog_staff(worklog_id);
```

#### categories (카테고리)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color_code VARCHAR(7), -- HEX 색상 코드 (#FF5733)
  icon VARCHAR(50), -- 아이콘 이름
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_order ON categories(display_order);
```

#### posts (포스트 - 통합 콘텐츠)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200),
  content TEXT NOT NULL,
  summary TEXT, -- AI 자동 요약
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  worklog_id UUID REFERENCES worklogs(id) ON DELETE SET NULL, -- 연결된 업무일지
  parent_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- 답글용
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(100), -- 팀 로그인 시 선택된 팀원 이름
  is_pinned BOOLEAN DEFAULT false, -- 중요 표시 (대시보드 고정)
  priority VARCHAR(20) DEFAULT 'normal', -- normal, important, urgent
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_worklog ON posts(worklog_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_pinned ON posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

#### post_tags (포스트 태그)
```sql
CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  PRIMARY KEY (post_id, tag)
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag);
```

#### comments (댓글)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글용
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(100), -- 팀 로그인 시 선택된 팀원 이름
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
```

#### channel_broadcasts (채널 방송 운행)
```sql
CREATE TABLE channel_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID REFERENCES worklogs(id) ON DELETE CASCADE,
  channel_name VARCHAR(50) NOT NULL, -- MBC SPORTS+, MBC Every1, 등
  broadcast_count INTEGER DEFAULT 1, -- 등록 횟수 (1~5)
  content TEXT,
  notes TEXT, -- 추가 내용
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channel_broadcasts_worklog ON channel_broadcasts(worklog_id);
CREATE INDEX idx_channel_broadcasts_channel ON channel_broadcasts(channel_name);
```

#### signatures (서명)
```sql
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worklog_id UUID REFERENCES worklogs(id) ON DELETE CASCADE,
  part_name VARCHAR(50) NOT NULL, -- 운행, 팀장, MCR, Network
  signer_id UUID REFERENCES users(id),
  signer_name VARCHAR(100),
  signed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- pending, signed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(worklog_id, part_name)
);

CREATE INDEX idx_signatures_worklog ON signatures(worklog_id);
CREATE INDEX idx_signatures_status ON signatures(status);
```

#### attachments (첨부파일)
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage 경로
  file_size INTEGER, -- 바이트 단위
  mime_type VARCHAR(100),
  attached_to_type VARCHAR(50), -- 'worklog', 'post', 'channel_broadcast'
  attached_to_id UUID NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_type_id ON attachments(attached_to_type, attached_to_id);
```

### 12.3 Supabase RLS (Row Level Security) 정책

**기본 정책**
```sql
-- users 테이블: 자신의 정보만 수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- worklogs 테이블: 역할에 따른 접근 제어
ALTER TABLE worklogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can view worklogs"
  ON worklogs FOR SELECT
  USING (true);

CREATE POLICY "Staff can create worklogs"
  ON worklogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('main_director', 'sub_director', 'backup_director', 'tech_staff', 'admin')
    )
  );

-- posts 테이블: 작성자만 수정/삭제
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors or admins can delete posts"
  ON posts FOR DELETE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

---

## 13. API 설계 (Supabase Client)

### 13.1 API 엔드포인트 개요

Supabase는 자동으로 RESTful API를 생성합니다. 주요 API 패턴:

**기본 구조**
```
GET /rest/v1/{table}          - 목록 조회
POST /rest/v1/{table}         - 생성
GET /rest/v1/{table}?id=eq.{uuid}  - 상세 조회
PATCH /rest/v1/{table}?id=eq.{uuid} - 수정
DELETE /rest/v1/{table}?id=eq.{uuid} - 삭제
```

### 13.2 주요 API 엔드포인트

#### 인증 API
```javascript
// 팀 로그인
POST /auth/v1/token
Body: {
  grant_type: 'password',
  team_login_id: '3팀',
  team_password: 'xxx'
}

// 개인 로그인
POST /auth/v1/token
Body: {
  grant_type: 'password',
  email: 'user@example.com',
  password: 'xxx'
}

// 로그아웃
POST /auth/v1/logout
```

#### 업무일지 API
```javascript
// 업무일지 목록 조회 (필터링, 페이지네이션)
GET /rest/v1/worklogs?work_date=gte.2025-11-01&work_date=lte.2025-11-30&order=work_date.desc&limit=20

// 업무일지 생성
POST /rest/v1/worklogs
Body: {
  work_date: '2025-11-20',
  shift_type: 'A',
  team_id: 'uuid',
  status: 'draft'
}

// 업무일지 상세 조회 (스태프, 포스트 포함)
GET /rest/v1/worklogs?id=eq.{uuid}&select=*,worklog_staff(*,user:users(*)),posts(*,category:categories(*))

// 업무일지 수정
PATCH /rest/v1/worklogs?id=eq.{uuid}
Body: {
  status: 'published'
}
```

#### 포스트 API
```javascript
// 포스트 목록 조회 (카테고리 필터)
GET /rest/v1/posts?category_id=eq.{uuid}&order=created_at.desc&limit=20

// 중요 포스트 조회 (대시보드용)
GET /rest/v1/posts?is_pinned=eq.true&order=created_at.desc&limit=5

// 포스트 생성
POST /rest/v1/posts
Body: {
  title: '긴급 점검 사항',
  content: '...',
  category_id: 'uuid',
  worklog_id: 'uuid',
  priority: 'urgent',
  is_pinned: true
}

// 포스트 수정
PATCH /rest/v1/posts?id=eq.{uuid}
Body: {
  content: '수정된 내용'
}
```

#### 카테고리 API
```javascript
// 카테고리 목록
GET /rest/v1/categories?order=display_order.asc

// 카테고리 생성
POST /rest/v1/categories
Body: {
  name: '긴급 사항',
  color_code: '#FF5733',
  display_order: 1
}

// 카테고리 수정
PATCH /rest/v1/categories?id=eq.{uuid}
Body: {
  name: '긴급 이슈',
  color_code: '#FF0000'
}
```

#### 서명 API
```javascript
// 서명 현황 조회 (필터: 이번 달, 대기 중, 지연)
GET /rest/v1/signatures?worklog_id=in.(uuid1,uuid2)&status=eq.pending

// 서명 완료
PATCH /rest/v1/signatures?id=eq.{uuid}
Body: {
  signer_id: 'uuid',
  signer_name: '김운행',
  signed_at: '2025-11-20T18:45:00Z',
  status: 'signed'
}
```

#### 채널 방송 API
```javascript
// 채널 운행표 등록
POST /rest/v1/channel_broadcasts
Body: {
  worklog_id: 'uuid',
  channel_name: 'MBC SPORTS+',
  broadcast_count: 3,
  content: '운행 내용'
}

// 채널별 통계
GET /rest/v1/rpc/get_channel_stats
Body: {
  start_date: '2025-11-01',
  end_date: '2025-11-30'
}
```

#### AI 요약 API (Supabase Edge Function)
```javascript
// AI 요약 생성
POST /functions/v1/generate-summary
Body: {
  post_id: 'uuid',
  content: '긴 텍스트 내용...'
}

Response: {
  summary: '20자 내외 요약'
}
```

### 13.3 Realtime 구독 (Supabase Realtime)

```javascript
// 특정 업무일지의 실시간 업데이트 구독
const channel = supabase
  .channel('worklog-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `worklog_id=eq.${worklogId}`
    },
    (payload) => {
      console.log('Change received!', payload)
      // UI 업데이트
    }
  )
  .subscribe()

// 서명 현황 실시간 구독
const signatureChannel = supabase
  .channel('signature-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'signatures'
    },
    (payload) => {
      console.log('Signature updated!', payload)
      // 대시보드 업데이트
    }
  )
  .subscribe()
```

---

## 14. 주요 사용 시나리오

### 14.1 시나리오 1: 주조감독의 A근무 업무일지 작성

**상황**: 3팀 주조감독 김철수가 A근무(07:30~19:00) 업무일지를 작성

**단계**:
1. **로그인**
   - 공용 PC에서 "3팀" 팀 로그인 (team_login_id: "3팀")
   - 팀원 전체 자동 로그인 상태

2. **대시보드 확인**
   - 당일(2025-11-20) 근무 정보 확인
   - 3팀 A근무, 담당자: 김철수(주조감독), 이영희(CMS감독), 박민수(예비감독), 최기술(영상감독)
   - 4개 파트 서명 현황 확인 (모두 대기 중)
   - 중요 포스트 2개 확인

3. **업무일지 작성**
   - "업무일지" 메뉴 클릭
   - 당일 3팀 A근무 일지 자동 생성 (이미 존재하면 불러오기)
   - 채널별 운행표 등록:
     * MBC SPORTS+: 3회 등록, "프로야구 중계" 입력
     * MBC Every1: 2회 등록, "예능 프로그램" 입력
   - 장비 점검 사항: "메인 서버 정상 가동" 입력

4. **포스트 작성 (채널 메모)**
   - MBC SPORTS+ 항목에서 "글작성" 버튼 클릭
   - 팝업 표시, 작성자 선택: "김철수" 선택
   - 제목: "프로야구 중계 송출 완료"
   - 카테고리: "채널 운행" 선택
   - 본문: "오후 2시~6시 프로야구 중계 정상 송출..."
   - 저장 → AI 자동 요약 생성: "프로야구 중계 정상 송출"
   - 업무일지에 요약 표시

5. **긴급 이슈 발생**
   - 15:30, 네트워크 일시 불안정 발생
   - "빠른 메모" 클릭
   - 작성자: "김철수" 선택
   - 카테고리: "긴급 사항" 선택 (자동으로 중요 표시)
   - 제목: "네트워크 일시 불안정"
   - 본문: "15:30경 약 2분간 네트워크 불안정, 자동 복구됨"
   - 저장 → 대시보드에 자동 표시

6. **업무일지 발행**
   - 모든 내용 작성 완료
   - "발행" 버튼 클릭 → 상태: Draft → Published

7. **서명 요청**
   - "업무확인 서명" 메뉴 이동
   - 2025-11-20, 3팀 업무일지 서명 요청
   - 운행 파트에 알림 발송

8. **로그아웃**
   - 근무 종료 시 자동 로그아웃

### 14.2 시나리오 2: CMS감독의 모바일에서 댓글 작성

**상황**: 2팀 CMS감독 이영희가 집에서 모바일로 과거 일지 댓글 작성

**단계**:
1. **개인 로그인 (모바일)**
   - 모바일 브라우저에서 worklog-mcr.vercel.app 접속
   - 이메일 로그인: younghee@example.com
   - PWA 홈 화면 추가 확인 팝업 → "나중에"

2. **업무일지 목록 검색**
   - "업무일지 목록" 메뉴 (햄버거 메뉴에서 선택)
   - 기간 검색: 2025-11-15 ~ 2025-11-18
   - 팀 필터: "2팀" 선택
   - 카테고리 필터: "시스템 이슈" 선택
   - 검색 결과: 2025-11-17, 2팀 N근무 일지 표시

3. **과거 일지 확인**
   - 2025-11-17 일지 클릭
   - 포스트 목록 확인: "메인 서버 재부팅" 포스트 발견
   - AI 요약: "메인 서버 재부팅 완료"

4. **댓글 작성**
   - 포스트 클릭하여 상세 보기
   - 댓글 입력란에 "후속 조치로 백업 서버 점검도 완료했습니다" 입력
   - "댓글 작성" 버튼 터치
   - 댓글 작성 완료, 알림 발송 (원 작성자에게)

5. **알림 확인**
   - 상단 알림 아이콘 (🔔 1) 표시
   - 알림 클릭: "김철수님이 회신했습니다" 확인

6. **로그아웃**
   - 햄버거 메뉴 → "로그아웃"

### 14.3 시나리오 3: 팀장의 서명 처리

**상황**: 팀장 파트 박팀장이 업무 확인 후 서명

**단계**:
1. **로그인**
   - 개인 로그인: teamleader@example.com

2. **서명 대기 알림 확인**
   - 대시보드에서 "미서명 알림" 표시
   - "서명 3건 대기 중" 확인

3. **업무확인 서명 페이지**
   - "업무확인 서명" 메뉴 클릭
   - 필터: "현재 대기 중" 선택
   - 목록 표시:
     * 2025-11-20, 3팀: 운행 파트 서명 완료, 팀장 파트 대기 중
     * 2025-11-19, 2팀: 모든 파트 서명 완료
     * 2025-11-18, 1팀: 팀장 파트 대기 중 (24시간 이상 지연)

4. **업무일지 확인**
   - 2025-11-20, 3팀 행 클릭 → 해당 업무일지 상세 보기
   - 채널 운행표 확인
   - 포스트 내용 확인
   - 긴급 이슈 확인: "네트워크 일시 불안정" 포스트 확인

5. **서명 완료**
   - "서명하기" 버튼 클릭
   - 확인 팝업: "2025-11-20, 3팀 업무일지에 서명하시겠습니까?"
   - "확인" 클릭
   - 서명 완료: 팀장 파트 → "박팀장 18:45" 표시
   - 다음 파트(MCR 파트)에 알림 자동 발송

6. **통계 확인**
   - "통계 및 보고서" 메뉴 클릭
   - 이번 달 서명 현황: 진행률 78%
   - 평균 서명 완료 시간: 6.2시간

### 14.4 시나리오 4: 관리자의 카테고리 관리

**상황**: 시스템 관리자가 새로운 카테고리 추가

**단계**:
1. **로그인**
   - 관리자 로그인: admin@example.com

2. **설정 메뉴**
   - "설정" 메뉴 클릭
   - "카테고리 관리" 선택

3. **현재 카테고리 확인**
   - 10개 기본 카테고리 목록 표시
   - 사용 빈도 통계: "긴급 사항" 45회, "채널 운행" 120회...

4. **새 카테고리 추가**
   - "카테고리 추가" 버튼 클릭
   - 카테고리명: "외부 협업"
   - 설명: "외부 업체 및 부서 간 협업 사항"
   - 색상: #3498db (파란색) 선택
   - 아이콘: 🤝 선택
   - 저장

5. **카테고리 순서 조정**
   - 드래그 앤 드롭으로 "외부 협업"을 9번째로 이동
   - "순서 저장" 버튼 클릭

6. **카테고리 즉시 반영**
   - 포스트 작성 화면 확인
   - 카테고리 선택 드롭다운에 "외부 협업" 추가 확인

### 14.5 시나리오 5: 예비감독의 통계 조회

**상황**: 예비감독 최민수가 이번 달 운행 통계 확인

**단계**:
1. **로그인**
   - 개인 로그인: minsu@example.com

2. **통계 및 보고서 메뉴**
   - "통계 및 보고서" 클릭
   - 기본 표시: 이번 달 (2025-11월)

3. **운행 통계 확인**
   - 채널별 등록 횟수:
     * MBC SPORTS+: 85회
     * MBC Every1: 72회
     * MBC DRAMA: 68회
   - 막대 그래프로 시각화

4. **카테고리 통계 확인**
   - 카테고리별 포스트 수:
     * 채널 운행: 120회 (35%)
     * 장비 점검: 45회 (13%)
     * 긴급 사항: 28회 (8%)
   - 원 그래프로 시각화

5. **팀별 통계**
   - 팀별 일지 작성 현황:
     * 3팀: 완료율 100%
     * 2팀: 완료율 95%
     * 1팀: 완료율 90%

6. **Excel 다운로드**
   - "Excel 다운로드" 버튼 클릭
   - 2025-11_운행통계.xlsx 다운로드

---

## 15. 비기능적 요구사항

### 12.1 성능
- **페이지 로딩**: 3초 이내
- **API 응답**: 1초 이내
- **대용량 데이터**: 페이지네이션 또는 무한 스크롤
- **파일 업로드**: 20MB 이하 제한

### 12.2 UI/UX

**반응형 디자인 (웹 & 모바일 동시 지원)**
- **데스크톱**: 1920px 이상 - 전체 기능 제공, 멀티 패널 레이아웃
- **태블릿**: 768px ~ 1919px - 적응형 레이아웃, 주요 기능 유지
- **모바일**: 375px ~ 767px - 터치 최적화, 핵심 기능 중심
- **모바일 우선 고려사항**:
  - 터치 제스처 지원 (스와이프, 롱프레스)
  - 큰 터치 영역 (최소 44x44px)
  - 간소화된 네비게이션 (햄버거 메뉴)
  - 오프라인 모드 지원 (PWA)
  - 빠른 로딩 (모바일 네트워크 고려)
  
**다크 모드**: Deep Dark Minimalist 테마 (웹/모바일 동일)

**직관적 레이아웃**: 사용자 중심 설계, 플랫폼별 최적화

**접근성**: WCAG 2.1 AA 준수 (웹/모바일 모두)

**PWA (Progressive Web App)**:
- 홈 화면 추가 가능
- 오프라인 지원
- 푸시 알림 (모바일)
- 앱과 같은 경험

### 12.3 보안
- **인증**: Supabase Auth (JWT 기반)
  - 이메일/비밀번호 인증
  - OAuth 소셜 로그인 (선택적)
  - Magic Link (이메일 링크 로그인)
- **권한**: RBAC (Role-Based Access Control)
- **데이터 보안**:
  - Row Level Security (RLS): Supabase 행 수준 보안
  - 민감 정보 암호화
  - HTTPS 통신 (SSL/TLS)
- **파일 보안**: 
  - MIME 타입 검증
  - 악성 파일 차단
  - Supabase Storage 권한 관리
- **로그**: 
  - 사용자 활동 로그 기록
  - Supabase 감사 로그
- **모바일 보안**:
  - 앱 저장소 암호화
  - 생체 인증 지원 (선택적)
  - 세션 자동 만료

### 12.4 호환성

**데스크톱 브라우저**
- Chrome 90+ (권장)
- Firefox 88+
- Safari 14+
- Edge 90+

**모바일 브라우저**
- iOS: Safari 14+, Chrome
- Android: Chrome 90+, Samsung Internet

**운영체제**
- Windows 10/11
- macOS Big Sur 이상
- iOS 14+ (iPhone, iPad)
- Android 10+ (스마트폰, 태블릿)

**화면 크기 지원**
- 최소: 375px (iPhone SE)
- 최대: 제한 없음 (대형 모니터)

### 12.5 확장성
- **모듈형 구조**: 기능별 독립적 개발
- **API 우선 설계**: RESTful API
- **마이크로서비스 고려**: 향후 분리 가능한 구조

---

## 16. 기술 스택 (참고)

### 13.1 백엔드 (BaaS)
- **플랫폼**: Supabase
  - 데이터베이스: PostgreSQL (Supabase 내장)
  - 인증: Supabase Auth (JWT 기반)
  - 스토리지: Supabase Storage (파일 관리)
  - 실시간: Supabase Realtime (WebSocket)
  - Edge Functions: Serverless 함수 지원
- **AI**: LLM API 연동 (OpenAI, Anthropic 등)
  - Supabase Edge Functions에서 호출

### 13.2 프론트엔드
- **프레임워크**: React + Next.js
  - 웹 & 모바일 동시 지원 (반응형)
- **상태 관리**: Redux 또는 Context API
- **UI 라이브러리**: 
  - 웹: Material-UI 또는 Ant Design
  - 모바일 최적화: Tailwind CSS + 반응형 컴포넌트
- **에디터**: React Quill (웹/모바일 호환)
- **차트**: Chart.js 또는 Recharts (반응형)
- **Supabase 클라이언트**: @supabase/supabase-js

### 13.3 인프라
- **배포**: 
  - 프론트엔드: Vercel
  - 백엔드: Supabase (호스팅 포함)
- **파일 스토리지**: Supabase Storage
- **CI/CD**: GitHub Actions + Vercel
- **모니터링**: Supabase Dashboard

---

## 17. 개발 우선순위

### Phase 1 - MVP (4주)
1. Supabase 프로젝트 설정 및 데이터베이스 스키마 구축
2. 사용자 인증 및 권한 관리 (Supabase Auth)
3. 업무일지 기본 CRUD (웹 먼저, 모바일 대응)
4. 채널 관리 기본 기능
5. 대시보드 (간단한 현황 표시, 반응형)

### Phase 2 - 핵심 기능 + 모바일 최적화 (4주)
6. 포스트 시스템 (통합 콘텐츠 관리)
7. **카테고리 및 태그 시스템 구축**
8. 업무일지 목록 및 검색 (카테고리 필터 포함)
9. 업무확인 서명 시스템
10. AI 자동 요약 기능 (Supabase Edge Functions)
11. **모바일 UI/UX 최적화** (터치 제스처, 네비게이션)

### Phase 3 - 고급 기능 (4주)
12. **중요 포스트 표시 기능** (대시보드 연동)
13. 통계 및 보고서 (반응형 차트, 카테고리 통계)
14. 첨부파일 관리 (Supabase Storage)
15. 계층형 댓글/답글
16. 사용자 관리 고도화
17. **PWA 구현** (오프라인 지원, 홈 화면 추가)

### Phase 4 - 시스템 고도화 (4주)
18. **카테고리 관리 페이지** (추가/수정/삭제)
19. 설정 관리 (근무 패턴, 포맷)
20. 알림 시스템 (웹/모바일 푸시)
21. 실시간 기능 (Supabase Realtime)
22. 성능 최적화 (모바일 네트워크 고려)
23. UI/UX 개선 및 사용성 테스트

---

## 18. 향후 확장 가능성

### 15.1 추가 기능 아이디어
- **네이티브 모바일 앱 개발** (React Native 또는 Flutter)
  - 현재 반응형 웹으로 모바일 지원, 향후 네이티브 앱 전환 가능
- **실시간 협업 기능** (Supabase Realtime 활용)
  - 동시 편집
  - 실시간 댓글
  - 온라인 사용자 표시
- **자동화 워크플로우** (Supabase Edge Functions)
  - 일정 시간 자동 알림
  - 반복 작업 자동화
- **외부 시스템 연동** (ERP, 기존 방송 시스템)
- **음성 인식 메모 작성** (모바일 최적화)
- **비디오 첨부 지원** (Supabase Storage)
- **오프라인 우선 모드** (PWA 고도화)

### 15.2 AI 기능 확장
- **이상 패턴 자동 감지** (Supabase Edge Functions + AI)
- **예측 분석** (장비 고장 예측 등)
- **자동 보고서 생성** (AI 기반)
- **챗봇 어시스턴트** (실시간 문의 대응)
- **음성 명령 지원** (모바일)

### 15.3 Supabase 활용 극대화
- **Row Level Security (RLS)**: 데이터 접근 제어 강화
- **Database Functions**: 복잡한 쿼리 최적화
- **Triggers**: 자동화 로직 구현
- **Real-time Subscriptions**: 실시간 데이터 동기화
- **Storage CDN**: 파일 전송 최적화

---

## 부록: 용어 정의

| 용어 | 설명 |
|------|------|
| MCR | Master Control Room (주조정실) |
| Worklog | 업무일지 |
| Post | 포스트 (메모, 게시글, 답글 통합) |
| ChannelBroadcast | 채널 방송 운행 정보 |
| WorklogStaff | 업무일지 스태프 (근무자) |
| ExternalStaff | 외부 스태프 (비정규 인원) |
| ANSYY | 근무 패턴 (A: 주간, N: 야간, S: 휴식, Y: 휴무) |
| Draft | 임시저장 상태 |
| Published | 발행 완료 상태 |
| Category | 카테고리 (포스트 분류 체계) |
| Tag | 태그 (자유로운 키워드 분류) |
| Is Pinned | 중요 표시 (대시보드 고정용) |
| Priority | 우선순위 (일반/중요/긴급) |
| RBAC | Role-Based Access Control (역할 기반 접근 제어) |
| JWT | JSON Web Token (인증 토큰) |
| Rich Text | 서식이 포함된 텍스트 |
| Supabase | Backend-as-a-Service 플랫폼 (PostgreSQL 기반) |
| BaaS | Backend as a Service (백엔드 서비스) |
| RLS | Row Level Security (행 수준 보안, Supabase) |
| Edge Functions | Serverless 함수 (Supabase) |
| PWA | Progressive Web App (프로그레시브 웹 앱) |
| 반응형 디자인 | 다양한 화면 크기에 자동 대응하는 디자인 |
