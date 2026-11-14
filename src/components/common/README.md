# Common components

`ActionButton`은 저장·삭제 같은 동작에 사용하는 `<button>`, `CTAButton`은 페이지 이동에 사용하는 React Router `<Link>`입니다. 색상, 상태, 포커스, 라운드는 `ButtonStyles.ts`에서 공유합니다.

```tsx
import ActionButton from './ActionButton'
import CTAButton from './CTAButton'

<ActionButton size="sm" onClick={handleSave}>확인</ActionButton>
<CTAButton to="/corrections/new">새 첨삭 시작 →</CTAButton>
<CTAButton to="/corrections/new" state="disabled">새 첨삭 시작 →</CTAButton>
```

두 컴포넌트 모두 `state="primary | hover | pressed | disabled"`를 지원합니다. 기본값은 `primary`이며, 기본 상태에서도 마우스 hover와 누름에 따라 색상이 바뀝니다. `disabled` 속성도 사용할 수 있습니다.

CTA는 피그마 기준 좌우 24px·상하 12px 패딩, Label 1 Semibold, 8px 라운드를 사용합니다. 기본 높이는 48px이고, 비활성 상태는 피그마처럼 1px 테두리가 추가됩니다. 비활성 CTA는 `href`가 없는 `aria-disabled` 링크 역할의 `<span>`으로 렌더링해 클릭·키보드·새 탭 이동을 차단합니다.

`src/main.tsx`에 `BrowserRouter`가 연결되어 있습니다. 실제 이동할 화면과 경로는 `Routes`와 `Route`로 등록하고 `to`에 지정하세요. 예제 경로의 화면은 아직 구현하지 않았습니다.

CTA의 `state`는 시각 상태를 뜻합니다. 라우팅할 때 데이터를 함께 넘기려면 `navigationState`를 사용합니다.

```tsx
<CTAButton to="/corrections/new" navigationState={{ studentId: '123' }}>
  새 첨삭 시작 →
</CTAButton>
```
