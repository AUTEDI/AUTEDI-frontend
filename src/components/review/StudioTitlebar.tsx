import { Button } from '../common/Button'

type StudioTitlebarProps = {
  onSave: () => void
  onFinish: () => void
}

export function StudioTitlebar({ onSave, onFinish }: StudioTitlebarProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <span className="rounded-full bg-[#e9edff] px-[9px] py-1.5 text-[8px] font-extrabold text-[#4960db]">검토 중</span>
        <small className="text-[8px] text-[#858a9c] max-sm:hidden">
          사진의 원하는 문장을 드래그해 직접 피드백할 수 있어요.
        </small>
      </div>
      <div className="flex items-center gap-[10px]">
        <Button onClick={onSave} size="xs">
          저장
        </Button>
        <Button onClick={onFinish} size="xs" variant="primary">
          <span className="text-[11px]">↓&nbsp;</span>PDF 출력
        </Button>
      </div>
    </div>
  )
}
