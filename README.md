# AUTEDI Frontend

영어 도서관·교육기관의 학생 글쓰기 첨삭을 돕는 AI 첨삭 서비스 **AUTEDI**의 프론트엔드입니다.
교사가 학생의 손글씨 과제 이미지를 올리면 AI가 첨삭하고, 교사는 결과를 검토·수정하며 직접 코멘트를 남길 수 있습니다.

## 주요 기능

- **여러 파일 검토**: 업로드한 파일을 원본 목록에서 선택해 이미지와 첨삭 결과를 전환. 처음 선택할 때 첨삭을 생성하고, 업로드 응답에 완료된 결과가 있으면 추가 요청 없이 사용. 이후에는 파일별 수정 내용·코멘트·작성 초안을 이번 접속 동안 유지
- **첨삭 설정**: 영역(문법·철자 / 어휘·표현 / 문장 구성 / 내용·요약)과 수준(Standard·Advanced)을 영역별로 선택
- **AI 첨삭 검토**: 원본 이미지 위에 첨삭을 겹쳐 보고, 우측 패널에서 항목별로 유지·수정·삭제
- **교사 코멘트**: 이미지에서 영역을 드래그해 밑줄·화살표·네모·삽입 표시와 코멘트를 추가 (AI 첨삭과 구분 표시)

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · ESLint · Vercel

## 실행

```bash
npm install
npm run dev
```

개발 서버는 `http://localhost:5173`에서 열립니다. 포트가 이미 사용 중이면 다른 포트로 바꾸지 않고 실행을 멈추니, 기존 서버를 끄고 다시 실행하세요.

환경 변수는 `.env.example`을 복사한 `.env`에 적습니다. 값은 하나뿐입니다.

```bash
VITE_API_BASE_URL=https://autedi-backend-production.up.railway.app
```

- 값이 있으면 실제 백엔드(`{주소}/api/v1`)를 호출하고 로그인 화면부터 시작합니다.
- 비워 두면 백엔드 없이 예시 데이터로 동작합니다(로그인 없음, 시연용).
- Vercel에서는 Settings → Environment Variables에 같은 이름으로 넣고 다시 배포해야 적용됩니다.

## API 연동 범위

[API 명세서 v1](https://www.notion.so/API-v1-4070cb0f06a680cc8eafe24c6c60cf21) 기준입니다.

| 화면 동작 | API |
| --- | --- |
| 로그인·로그아웃·새로고침 후 복원 | `POST /auth/login`, `POST /auth/logout`, `GET /users/me` |
| 토큰 만료 시 자동 재발급 후 재요청 | `POST /auth/refresh` |
| 학습지 업로드 | `POST /worksheets` |
| 첨삭 시작 | `PUT /worksheets/{id}/settings` → `POST .../generations` → `GET .../generations/{genId}` 반복 |
| 검토 화면의 원본·교사 코멘트 | `GET /worksheets/{id}/review` |
| AI 첨삭 목록 | `GET /worksheets/{id}/corrections?status=ACTIVE&pageId={pageId}` |
| 추천 문장 수정 / 삭제 / 삭제 되돌리기 | `PATCH` / `DELETE` / `POST .../restore` (`If-Match` 사용) |
| 교사 코멘트 저장 / 삭제 | `POST /worksheets/{id}/comments` / `DELETE .../comments/{id}` |

아직 API가 없어 화면에서만 동작하는 기능(새로고침하면 사라짐): 피드백 반영 표시, AI 표시·코멘트 위치 이동과 크기 조절, 교사 표시 중 화살표·네모·삽입 표시, 교사 표시 색.

서버 응답의 `isApplied`는 초기 반영 상태에 적용합니다. 이후 반영 버튼으로 바꾼 상태는 아직 서버로 보내지 않습니다.

`worksheetApi.getCorrections(worksheetId, filters, signal)`은 선택적 필터 `status`, `pageId`, `area`, `feedbackType`, `isApplied`를 지원합니다. 화면 조회 시에는 활성 상태와 현재 페이지를 전달하며, 필터가 없으면 해당 쿼리를 생략합니다. `isApplied=false`도 전송하고, 문법 영역 코드는 `GRAMMAR_SPELLING`과 `GRAMMAR_MECHANICS` 모두 지원합니다. 목록 응답의 `result`는 `{ items: [...], total: 숫자 }` 형식을 사용하며, 요청 함수는 목록을 `data`, 전체 건수를 `total`로 반환합니다. 기존 배열과 `{ corrections: [...] }` 형식도 지원합니다.

업로드 응답은 학습지 정보만 있는 형식과 `worksheet`, `generation`, `corrections`, `comments`가 함께 있는 형식을 지원합니다. 첨삭 좌표는 `NORMALIZED_0_1`을 퍼센트로 변환하고, 단일 페이지에서는 영역의 `pageId`가 생략되어도 표시합니다. 다중 페이지에서 페이지를 식별할 수 없는 첨삭은 피드백 목록에만 표시합니다.

각 파일은 첫 페이지만 표시합니다. 한 PDF 파일 안의 여러 페이지를 전환하는 기능은 아직 지원하지 않습니다.

응답 변환, 중복 분석 방지, 파일별 첨삭 상태와 저장 중 파일 전환 방지는 `npm run test:review`로 검증할 수 있습니다. 테스트는 통신을 대체하며 실제 서버에 요청하지 않습니다.

## 폴더 구조

```text
src/
  apis/         API 클라이언트(/api/v1, 토큰 재발급, ETag), 에러 코드, 엔드포인트,
                응답 변환(mappers), 화면용 서비스(reviewService: 실제/예시 구현)
  components/   common(버튼·모달 등) · layout · home · review-flow(업로드~생성) · review(검토 화면)
  constants/    첨삭 설정, 단계 문구, 예시 첨삭 데이터
  hooks/        드래그 같은 공통 훅
  pages/        LoginPage, HomePage, ReviewPage
  stores/       Zustand 상태 (인증, 앱 전체, 검토 화면)
  types/        도메인 타입
  utils/        좌표 계산, className 도우미
```

## 협업 규칙

**작업 순서**: 이슈 생성 → 브랜치 생성 → 커밋 → PR → `main` 병합 (`main`에 직접 push 금지)
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

- 컴포넌트·파일·타입명은 PascalCase, 함수·변수명은 camelCase
- 스타일은 Tailwind 유틸리티 클래스로 작성하고, 공통 색·그림자·기준점은 `src/index.css`의 `@theme` 토큰을 쓴다
- `any` 사용을 피하고 필요한 타입을 명시
- 재사용 UI는 `components`, 화면은 `pages`, API 요청 코드는 `apis` 폴더에서 관리

## 배포

`main`에 병합되면 Vercel이 자동 배포하고, PR마다 미리보기 주소가 만들어집니다.
