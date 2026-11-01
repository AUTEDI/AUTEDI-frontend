import type { FeedbackSetting } from '../../types/review'
import { PresetList } from '../common/PresetList'

type DefaultSettingsCardProps = {
  settings: FeedbackSetting[]
  onEdit: () => void
}

export function DefaultSettingsCard({ settings, onEdit }: DefaultSettingsCardProps) {
  return (
    <article className="min-h-[285px] rounded-[20px] border border-line bg-white p-[26px] shadow-card max-md:min-h-0">
      <div className="flex items-start justify-between">
        <h2 className="mt-[7px] mb-[9px] text-[21px] tracking-[-0.8px]">기본 첨삭 설정</h2>
        <button
          className="rounded-[10px] bg-[#f1f2f7] px-[10px] py-2 text-[10px] font-[750] text-[#61677d]"
          onClick={onEdit}
          type="button"
        >
          설정 변경
        </button>
      </div>
      <p className="mt-px mb-[17px] text-[9px] text-[#8a8fa0]">새 첨삭을 시작할 때 자동으로 적용돼요.</p>
      <PresetList settings={settings} />
      <div className="mt-[13px] flex items-start gap-[7px] text-[7px] text-[#8b90a1]">
        <span className="grid size-[15px] shrink-0 place-items-center rounded-full border border-[#bec3d2]">i</span>
        업로드 후 이번 첨삭에서만 다른 설정을 적용할 수도 있어요.
      </div>
    </article>
  )
}
