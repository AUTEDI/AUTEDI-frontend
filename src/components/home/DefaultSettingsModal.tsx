import { useState } from 'react'
import { cloneSettings } from '../../constants/settings'
import type { FeedbackSetting } from '../../types/review'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { SettingCard } from '../common/SettingCard'

type DefaultSettingsModalProps = {
  settings: FeedbackSetting[]
  onClose: () => void
  /** 저장에 성공하면 true를 돌려준다. */
  onSave: (settings: FeedbackSetting[]) => boolean
}

export function DefaultSettingsModal({ settings, onClose, onSave }: DefaultSettingsModalProps) {
  // 취소하면 원래 설정이 남도록 복사본을 편집한다.
  const [draft, setDraft] = useState(() => cloneSettings(settings))

  const updateSetting = (next: FeedbackSetting) =>
    setDraft((current) => current.map((setting) => (setting.id === next.id ? next : setting)))

  return (
    <Modal className="w-[min(720px,92vw)]" labelledBy="default-settings-title" onClose={onClose}>
      <h2 className="my-[7px] text-[23px]" id="default-settings-title">
        기본 첨삭 설정
      </h2>
      <p className="mt-[9px] mb-5 text-[9px] text-[#868b9d]">앞으로 새 학습지를 올릴 때 자동으로 적용할 설정이에요.</p>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {draft.map((setting) => (
          <SettingCard compact key={setting.id} onChange={updateSetting} setting={setting} />
        ))}
      </div>
      <footer className="mt-[18px] flex justify-end gap-[7px]">
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={() => {
            if (onSave(draft)) onClose()
          }}
          variant="primary"
        >
          기본 설정 저장
        </Button>
      </footer>
    </Modal>
  )
}
