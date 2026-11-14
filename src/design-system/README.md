# Design system tokens

[Figma 원본](https://www.figma.com/design/d2pR14lQLsCQWp0oHHF2rs/AUTEDI?node-id=678-1649)의 변수 값을 기준으로 합니다.

`color.css`, `typography.css`, `spacing.css`, `radius.css`가 각 영역의 진입점입니다. 영역별 폴더는 만들지 않고, 각 파일에서 `primitive/`와 `semantic/`의 같은 이름 CSS를 순서대로 불러옵니다.

- `primitive/`: 색상 코드, 폰트 크기·두께·행간·자간, 숫자 간격, 숫자 라운드 등 기초 값
- `semantic/`: 배경·본문·액션·테두리, 제목·본문·라벨, 간격·레이아웃, 라운드 역할. CSS는 primitive 변수를 참조합니다.
- `tokens.css`: 네 영역의 CSS를 한 번에 불러오는 진입점과 카드 그림자
- `tokens.ts`: TypeScript 토큰과 타입을 모아 내보내는 진입점

CSS는 앱 진입점에서 한 번 불러옵니다. 특정 영역만 필요하면 상위 영역 CSS를 직접 import할 수 있습니다.

```ts
import './design-system/tokens.css'
// 또는 import './design-system/color.css'

import { semanticColors, spacing, radius, typography } from './design-system/tokens'
```

기존 CSS 변수명, 타이포그래피 클래스명, TypeScript export 이름과 값은 유지합니다. TypeScript의 CSS 변수 참조를 사용할 때도 해당 CSS를 불러와야 합니다.

단위 정의는 `primitive/spacing.css`의 `--unit-*`에서 관리하고, `semantic/spacing.css`의 `--spacing-*`와 `--layout-*`에서 역할에 연결합니다. 폰트 크기·두께 등은 `primitive/typography.css`에서, 제목·본문·라벨의 조합은 `semantic/typography.css`에서 수정합니다.
