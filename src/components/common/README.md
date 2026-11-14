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

`TextField`는 피그마 Textfield의 너비 240px·높이 42px·8px 라운드를 적용한 입력 컴포넌트입니다. `className`은 바깥 컨테이너에 적용됩니다.

```tsx
import { useState } from 'react'
import TextField from './TextField'

function TitleField() {
  const [title, setTitle] = useState('')

  return (
    <TextField
      label="과제 제목"
      name="title"
      value={title}
      onValueChange={setTitle}
      placeholder="제목을 입력해주세요."
      maxLength={100}
    />
  )
}
```

- `value`와 `onValueChange`로 입력값을 제어하거나, `defaultValue`로 초기값만 지정할 수 있습니다. `onValueChange`는 입력하거나 지우기 버튼을 누를 때 문자열을 전달합니다.
- `label`은 필수 접근성 이름이며 기본적으로 화면에 숨깁니다. `showLabel`을 지정하면 화면에도 표시합니다.
- 포커스와 입력값에 따라 `default → tapped → typing → entered` 상태가 자동 적용됩니다. `state`로 해당 상태나 `error`, `disabled`를 직접 지정할 수도 있습니다.
- `error="100자 이내로 작성해주세요."`를 전달하면 오류 테두리, 원본 오류 아이콘, 메시지와 `aria-invalid`가 적용됩니다. 메시지는 `aria-describedby`로 input에 연결됩니다.
- 값이 있으면 지우기 버튼이 나타나며, 지운 후 입력창으로 포커스가 돌아옵니다. `clearable={false}`, `readOnly`, `disabled`일 때는 지우기 버튼을 숨깁니다.
- `disabled` 또는 `state="disabled"`는 실제 input을 비활성화합니다. `name`, `required`, `autoComplete`, `onFocus`, `onBlur` 등 input 속성과 input을 가리키는 `ref`도 지원합니다.

`Select`는 피그마 Select의 너비 240px·높이 40px·8px 라운드를 적용한 단일 선택 드롭다운입니다. 목록은 선택창 아래 8px 간격으로 겹쳐 열리며, 선택 항목에는 체크가 표시됩니다. `className`은 바깥 컨테이너에 적용됩니다.

```tsx
import { useState } from 'react'
import Select from './Select'

type Student = { id: string; name: string }

function StudentSelect({
  students,
  isLoading,
  error,
}: {
  students: Student[]
  isLoading: boolean
  error?: string
}) {
  const [studentId, setStudentId] = useState('')

  return (
    <Select
      label="첨삭할 학생"
      name="studentId"
      options={students.map(student => ({ value: student.id, label: student.name }))}
      value={studentId}
      onValueChange={setStudentId}
      isLoading={isLoading}
      error={error}
      placeholder="학생을 선택해주세요."
    />
  )
}
```

- API 요청과 응답 변환은 페이지나 데이터 훅에서 처리합니다. 위 `Student`는 사용 예시이며, 실제 API 응답 필드에 맞게 `options`로 변환하세요. 학생 이름이 같아도 구분되도록 `value`에는 비어 있지 않은 고유 학생 ID를 사용합니다.
- `value`와 `onValueChange`로 선택값을 제어하거나 `defaultValue`로 초기값만 지정합니다. 선택 전에는 `placeholder`가 표시되며, 목록의 첫 학생을 자동 선택하지 않습니다.
- `isLoading`, `error`, 빈 `options`에 따라 상태 메시지를 표시합니다. 로딩·오류 중에는 항목을 선택할 수 없습니다. 문구는 `loadingMessage`, `emptyMessage`, `error`로 지정합니다. API 갱신으로 선택한 학생이 목록에서 사라지면 선택창은 placeholder로 돌아갑니다. 부모의 `studentId` 정리와 제출 전 검증은 사용하는 페이지에서 처리하세요.
- `label`은 필수이며 기본적으로 화면에 숨깁니다. `showLabel`로 표시할 수 있습니다. `disabled`는 전체 선택창을, 옵션의 `disabled`는 해당 항목을 비활성화합니다.
- 클릭, 위·아래 방향키, Home/End, Enter/Space로 선택하고, ESC·Tab·바깥 클릭으로 닫습니다. 키보드 포커스는 선택창에 유지하며 입력한 문자열의 앞부분과 일치하는 항목으로 이동합니다.
- `name`을 지정하면 선택한 ID가 숨겨진 input을 통해 `FormData`에 포함됩니다. 비제어 모드는 폼 reset 시 `defaultValue`로 돌아갑니다. `form`과 선택창 버튼을 가리키는 `ref`도 지원합니다.
