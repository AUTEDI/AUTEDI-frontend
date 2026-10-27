# AUTEDI Frontend

영어 도서관·교육기관의 학생 글쓰기 첨삭을 돕는 AI 첨삭 서비스 **AUTEDI**의 프론트엔드입니다.
교사가 학생의 손글씨 과제 이미지를 올리면 AI가 첨삭하고, 교사는 결과를 검토·수정하며 직접 코멘트를 남길 수 있습니다.

## 주요 기능

- **첨삭 설정**: 영역(문법·철자 / 어휘·표현 / 문장 구성 / 내용·요약)과 수준(Standard·Advanced)을 영역별로 선택
- **AI 첨삭 검토**: 원본 이미지 위에 첨삭을 겹쳐 보고, 우측 패널에서 항목별로 유지·수정·삭제
- **교사 코멘트**: 이미지에서 영역을 드래그해 하이라이트·밑줄과 코멘트를 추가 (AI 첨삭과 구분 표시)

## 기술 스택

React 19 · TypeScript · Vite · ESLint · Vercel

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

- 컴포넌트·파일·타입명은 PascalCase, 함수·변수명은 camelCase, CSS 클래스명은 kebab-case
- `any` 사용을 피하고 필요한 타입을 명시
- 재사용 UI는 `components`, 화면은 `pages`, API 요청 코드는 `apis` 폴더에서 관리

## 배포

`main`에 병합되면 Vercel이 자동 배포하고, PR마다 미리보기 주소가 만들어집니다.
