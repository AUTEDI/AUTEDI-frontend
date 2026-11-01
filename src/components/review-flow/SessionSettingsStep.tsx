import { useAppStore } from '../../stores/useAppStore'
import { Button } from '../common/Button'
import { SettingCard } from '../common/SettingCard'
import { FlowActions } from './FlowActions'

export function SessionSettingsStep({ onStart }: { onStart: () => void }) {
  const sessionSettings = useAppStore((state) => state.sessionSettings)
  const updateSessionSetting = useAppStore((state) => state.updateSessionSetting)

  return (
    <div className="animate-fade-step">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#edeeff] px-[15px] py-[13px]">
        <span className="rounded-md bg-white px-[7px] py-[5px] text-[8px] font-extrabold text-[#4b59c9]">
          이번 첨삭에서만 적용
        </span>
        <p className="my-2 text-[8px] text-[#7278a0]">기본 설정은 바뀌지 않아요. 최소 한 가지 영역을 선택해주세요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {sessionSettings.map((setting) => (
          <SettingCard key={setting.id} onChange={updateSessionSetting} setting={setting} />
        ))}
      </div>
      <FlowActions>
        <Button onClick={onStart} variant="primary">
          이 설정으로 첨삭 시작 <b className="ml-2">✦</b>
        </Button>
      </FlowActions>
    </div>
  )
}
