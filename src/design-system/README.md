# Design system tokens

[Figma 원본](https://www.figma.com/design/d2pR14lQLsCQWp0oHHF2rs/AUTEDI?node-id=678-1649)의 변수 값을 CSS로 관리합니다.

- `color.css`, `typography.css`, `spacing.css`, `radius.css`: 각 영역의 진입점. 같은 이름의 primitive와 semantic CSS를 불러옵니다.
- `primitive/`: 색상 코드, 폰트 크기·두께·행간·자간, 숫자 간격, 숫자 라운드 등 기초 값
- `semantic/`: 배경·본문·액션·테두리, 제목·본문·라벨, 간격·레이아웃, 라운드 역할. primitive 변수를 참조합니다.
- `tokens.css`: 네 영역의 CSS와 카드 그림자를 모아 불러오는 진입점
- `theme.css`: 기존 CSS 변수를 Tailwind CSS v4의 `@theme inline`으로 연결하는 파일

`src/index.css`에서 Tailwind, `tokens.css`, `theme.css`를 한 번씩 불러옵니다. TypeScript 토큰 import 없이 `className`으로 사용합니다.

```tsx
<button
  className="rounded-ds-medium bg-action-primary px-ds-24 py-ds-8 text-label1-semibold text-foreground-neutral-inverse hover:bg-action-hover active:bg-action-pressed disabled:bg-action-disabled disabled:text-foreground-neutral-subtle"
>
  확인
</button>

<h1 className="text-h1 text-foreground-neutral-default">제목</h1>
<p lang="en" className="text-body1-regular tracking-normal">English body text</p>
```

| 영역 | 클래스 예시 | 연결되는 토큰 |
| --- | --- | --- |
| 배경 | `bg-background-neutral-default` | `--background-neutral-default` |
| 본문 | `text-foreground-neutral-default` | `--foreground-neutral-default` |
| 액션 | `bg-action-primary`, `hover:bg-action-hover` | `--action-primary`, `--action-hover` |
| 테두리 | `border-border-default` | `--border-default` |
| 원시 컬러 | `bg-ds-blue-500` | `--color-blue-500` |
| 타이포그래피 | `text-h1`, `text-body1-regular`, `text-label2-semibold` | 크기·행간·두께·자간 조합 |
| 간격 | `p-ds-16`, `gap-ds-24` | `--spacing-16`, `--spacing-24` |
| 라운드 | `rounded-ds-small`, `rounded-ds-medium`, `rounded-ds-large`, `rounded-ds-full` | `--radius-*` |
| 그림자 | `shadow-ds-card` | `--shadow-card` |

간격의 `ds-` 숫자는 **px 값**입니다. `p-ds-16`은 16px이고, `p-4` 같은 기본 Tailwind 클래스는 기존 Tailwind 간격 체계를 사용합니다. 영문은 `tracking-normal`을 함께 지정해 자간을 0으로 적용합니다.

실제 값을 변경할 때는 `primitive/` 또는 `semantic/`의 CSS를 수정합니다. `theme.css`에는 값을 중복 작성하지 않고 CSS 변수 참조만 등록합니다. 기존 CSS 변수명과 `.ds-h1` 등의 타이포그래피 클래스도 계속 사용할 수 있습니다.

설정 방식: [Tailwind Vite 설치](https://tailwindcss.com/docs/installation/using-vite), [테마 변수](https://tailwindcss.com/docs/theme).
