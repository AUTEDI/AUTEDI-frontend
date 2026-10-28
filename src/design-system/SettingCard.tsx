import type { ReviewSetting } from '../features/review/types'

type SettingCardProps = {
  setting: ReviewSetting
  compact?: boolean
  onChange: (setting: ReviewSetting) => void
}

export function SettingCard({ setting, compact = false, onChange }: SettingCardProps) {
  return (
    <article className={`setting-card${setting.selected ? ' selected' : ''}${compact ? ' compact' : ''}`}>
      <div className="setting-card-heading">
        <button
          aria-label={`${setting.name} ${setting.selected ? '선택 해제' : '선택'}`}
          aria-pressed={setting.selected}
          className="setting-check"
          onClick={() => onChange({ ...setting, selected: !setting.selected })}
          type="button"
        >
          {setting.selected ? '✓' : ''}
        </button>
        <span className="setting-icon">{setting.icon}</span>
        <div>
          <h3>{setting.name}</h3>
          <small>{setting.en}</small>
        </div>
      </div>
      <p>{setting.description}</p>
      <div aria-label={`${setting.name} 첨삭 수준`} className="level-control">
        {(['Standard', 'Advanced'] as const).map((level) => (
          <button
            aria-pressed={setting.level === level}
            className={setting.level === level ? 'active' : ''}
            key={level}
            onClick={() => onChange({ ...setting, selected: true, level })}
            type="button"
          >
            <b>{level}</b>
            <small>{level === 'Standard' ? '핵심 오류 중심으로 수정' : '표현과 흐름까지 개선'}</small>
          </button>
        ))}
      </div>
    </article>
  )
}
