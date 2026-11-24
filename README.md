# AUTEDI Frontend

영어 도서관·교육기관의 학생 글쓰기 첨삭을 돕는 AI 첨삭 서비스 **AUTEDI**의 프론트엔드입니다.
교사가 학생의 손글씨 과제 이미지를 올리면 AI가 첨삭하고, 교사는 결과를 검토·수정하며 직접 코멘트를 남길 수 있습니다.

## 주요 기능

- **첨삭 설정**: 영역(문법·철자 / 어휘·표현 / 문장 구성 / 내용·요약)과 수준(Standard·Advanced)을 영역별로 선택
- **AI 첨삭 검토**: 원본 이미지 위에 첨삭을 겹쳐 보고, 우측 패널에서 항목별로 유지·수정·삭제
- **교사 코멘트**: 이미지에서 영역을 드래그해 하이라이트·밑줄과 코멘트를 추가 (AI 첨삭과 구분 표시)

## 기술 스택

React 19 · TypeScript · Vite · ESLint · Vercel · Zustand

## 개발 서버 설정

`.env.example`을 참고해 `.env`의 `VITE_API_BASE_URL`에 백엔드 주소를 설정합니다. 개발 서버 실행과 배포 빌드에 필수이며, 배포 환경에도 같은 이름의 환경변수를 등록해야 합니다.
로컬 개발에서는 Vite의 `/api` 프록시를 사용하고, 배포 빌드에서는 설정한 API 주소로 직접 요청합니다. 배포 도메인은 백엔드 CORS 허용 출처에 등록해야 합니다.
로그인은 `POST /api/v1/auth/login`에 이메일과 비밀번호를 보내며, 성공 응답의 토큰과 사용자 정보는 Zustand 및 현재 탭의 `sessionStorage`에 저장됩니다.
인증된 사용자는 `/main`으로 이동하며, GNB와 홈 환영 문구에 응답의 학원명·사용자명이 표시됩니다.

## 행동 분석 (Amplitude)

Amplitude 프로젝트의 Browser API Key를 `.env`와 Vercel의 `VITE_AMPLITUDE_API_KEY`에 설정합니다.
프로젝트 데이터 저장 지역이 EU이면 `VITE_AMPLITUDE_SERVER_ZONE=EU`도 설정합니다(기본 US).
환경변수 변경 후 로컬 개발 서버를 다시 시작하고 Vercel도 재배포해야 합니다.
키가 없으면 SDK 로드·이벤트 전송을 모두 생략하므로 서비스는 분석 설정 없이도 동작합니다.

초기화는 `src/analytics/client.ts`에서 한 번만 하며, Unified SDK의 Analytics 기능만 초기화합니다.
자동 클릭/폼/네트워크 수집과 화면 녹화는 켜지 않습니다. 이벤트 속성에 이메일, 이름, 토큰,
파일명, 첨삭 원문, 수기 입력 내용, 이미지/좌표, 실제 URL을 넣지 않습니다.
사용자 ID를 별도 지정하지 않으므로 현재 분석은 SDK의 익명 브라우저 식별자를 기준으로 합니다.

| 분석 목적 | 이벤트 / 속성 |
| --- | --- |
| 화면 도달 | `Screen Viewed` / `screen` (경로를 화면 이름으로 변환) |
| 첨삭 단계별 이탈 | `Correction Step Viewed` / `step`, `flow_id`, `previous_step_ms` |
| 설정 변경 빈도 | `Correction Settings Changed` / `area`, `previous_level`, `level` |
| 실제 적용 설정 | `Correction Settings Applied` / `grammar`, `vocabulary`, `structure`, `content` |
| 업로드 방식 | `Correction Files Added` / `source` (`local` 또는 `qr`), `file_count` |
| 생성 실패·취소 구분 | `Correction Preparation Failed`, `Correction Generation Status Changed`, `Correction Generation Cancelled` |
| 수기 첨삭 순서 | `Manual Correction Interaction` / `action`, `source`, `tab`, `next_tab`, `tool`, `kind`, `sequence`, `first_entry`, `manual_session_id`, `flow_id` |

Amplitude에서 다음 보고서를 만들면 됩니다. 보고서 자체는 코드 배포만으로 자동 생성되지 않습니다.

1. **이탈 퍼널:** `Correction Step Viewed`를 `upload → settings → generation → review → completion_shown`
   순서로 설정하고 각 단계에 `step` 필터를 지정합니다. 동일 시도끼리 비교하도록 `flow_id`를
   일정하게 유지하는 옵션을 사용합니다. 단계별 미도달을 선택한 전환 시간 안의 이탈로 해석합니다.
   브라우저 종료 이벤트에 의존하지 않으며, 생성 실패·취소 이벤트를 함께 비교합니다.
   `completion_shown`은 현재 완료 API가 없어서 **완료 모달을 연 시점**이며 서버 저장 완료가 아닙니다.
   검토 URL에 직접 들어오거나 새 업로드 화면에 다시 들어온 경우는 별도 흐름입니다.
   취소는 `scope=screen`으로, 서버 작업 취소를 의미하지 않습니다(현재 취소 API 없음).
2. **설정 선호:** 생성 요청이 접수되면 기록하는 `Correction Settings Applied`를 각 영역 속성으로 나눠 적용 비율을 봅니다.
   `Correction Settings Changed`를 `area`·`level`로 나누면 변경 횟수도 볼 수 있습니다.
   단순히 변경 횟수가 많다는 것과 최종 적용을 많이 했다는 것은 다릅니다.
3. **수기 작업:** `Manual Correction Interaction`의 `first_entry=tab` / `tool`을 비교합니다.
   `source`는 `tabs`·`toolbar`·`panel`·`canvas`입니다. 도구 선택이 자동으로 탭을 바꾸거나,
   탭 클릭이 기본 밑줄을 켜도 **사용자가 직접 한 행동만** 기록합니다.
   `action`은 `tab_selected`, `tool_selected`, `kind_selected`, `region_selected`,
   `save_requested`, `saved`, `save_failed`, `cancelled`입니다.
   `manual_session_id`별 `sequence`를 보면 검토 화면을 연 동안의 순서가 보이며,
   `saved` 이벤트는 생성 API 성공 이후에만 기록합니다(마크 이동을 위한 재저장은 제외).

설정 후 Amplitude의 이벤트 디버거에서 실제 수신을 확인합니다. 개발 데이터는
`environment=development`, 배포 데이터는 `environment=production` 속성으로 구분합니다.
개발/실서비스 프로젝트를 따로 만들면 환경별로 다른 API Key를 등록할 수 있습니다.

이벤트 흐름 회귀 검증: `node --test tests/analytics.test.mjs`

## 협업 규칙

**작업 순서**: 이슈 생성 → 브랜치 생성 → 커밋 → PR → `develop` 병합 (`main`에 직접 push 금지)
PR 전에 `npm run lint`, `npm run build`가 통과해야 합니다.

**브랜치**: `<type>/<issue-number>-<short-description>` 예) `feature/114-add-typescript`

**커밋**: `<type>: 내용` 예) `feat: 첨삭 결과 패널 추가`

| type       | 용도                             |
| ---------- | -------------------------------- |
| `feat`     | 기능 추가                        |
| `fix`      | 버그 수정                        |
| `refactor` | 동작 변화 없는 구조 개선         |
| `style`    | CSS·UI 스타일 수정               |
| `docs`     | 문서 수정                        |
| `test`     | 테스트 추가·수정                 |
| `chore`    | 설정, 라이브러리, 빌드 관련 작업 |

**코딩 컨벤션**

- 컴포넌트·파일·타입명은 PascalCase, 함수·변수명은 camelCase, CSS 클래스명은 kebab-case
- `any` 사용을 피하고 필요한 타입을 명시
- 재사용 UI는 `components`, 화면은 `pages`, API 요청 코드는 `apis` 폴더에서 관리

## 배포

`main`에 병합되면 Vercel이 자동 배포하고, PR마다 미리보기 주소가 만들어집니다.
