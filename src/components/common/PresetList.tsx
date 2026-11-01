import { SETTING_DOT_CLASS } from '../../constants/settings'
import type { FeedbackSetting } from '../../types/review'
import { cn } from '../../utils/cn'

/** 선택된 첨삭 영역과 수준을 한 줄씩 보여주는 요약 목록 */
export function PresetList({ settings, className }: { settings: FeedbackSetting[]; className?: string }) {
  return (
    <div className={cn('grid gap-[7px]', className)}>
      {settings
        .filter((setting) => setting.selected)
        .map((setting) => (
          <div
            className="flex items-center gap-2 rounded-[9px] border border-[#eceef4] bg-[#fafaff] px-[10px] py-[9px]"
            key={setting.id}
          >
            <i className={cn('size-2 rounded-full', SETTING_DOT_CLASS[setting.id])} />
            <b className="text-[9px]">{setting.name}</b>
            <span className="ml-auto rounded-[5px] bg-[#eef0ff] px-1.5 py-1 text-[7px] text-[#5663cc]">
              {setting.level}
            </span>
          </div>
        ))}
    </div>
  )
}
