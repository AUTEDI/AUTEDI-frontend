import { useRef, useState } from 'react'
import sampleWriting from '../assets/sample-writing.jpeg'
import { Button } from '../design-system/Button'
import { SettingCard } from '../design-system/SettingCard'
import type { ReviewSetting } from '../features/review/types'
import { useAppStore } from '../store/useAppStore'

type UploadScreenProps = {
  onGenerate: () => void
  onHome: () => void
}

export function UploadScreen({ onGenerate, onHome }: UploadScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const imageUrl = useAppStore((state) => state.imageUrl)
  const imageName = useAppStore((state) => state.imageName)
  const defaults = useAppStore((state) => state.defaults)
  const setSessionSettings = useAppStore((state) => state.setSessionSettings)
  const setImage = useAppStore((state) => state.setImage)
  const clearImage = useAppStore((state) => state.clearImage)
  const loadSample = useAppStore((state) => state.loadSample)
  const setStep = useAppStore((state) => state.setStep)
  const showToast = useAppStore((state) => state.showToast)

  const loadExample = () => {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    loadSample()
  }

  const loadFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('현재 데모에서는 JPG 또는 PNG 이미지만 미리보기할 수 있어요')
      return
    }
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    setImage(URL.createObjectURL(file), file.name)
    showToast('학습지 사진을 불러왔어요')
  }

  const removeFile = () => {
    if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl)
    clearImage()
    if (inputRef.current) inputRef.current.value = ''
  }

  const editForSession = () => {
    setSessionSettings(defaults.map((setting) => ({ ...setting })))
    setStep('settings')
  }

  return (
    <div className="upload-layout">
      <div className="upload-main">
        <button className="back-link" onClick={onHome} type="button">
          ← 홈으로
        </button>
        <div
          className={`dropzone${isDragging ? ' dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDragging(false)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            loadFile(event.dataTransfer.files[0])
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
          }}
          role="button"
          tabIndex={0}
        >
          <input
            accept="image/jpeg,image/png"
            aria-label="학습지 이미지 선택"
            className="visually-hidden"
            onChange={(event) => loadFile(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <span className="upload-icon">↑</span>
          <h2>사진 또는 파일을 놓아주세요</h2>
          <p>또는 클릭해서 기기에서 선택하세요</p>
          <small>JPG · PNG</small>
        </div>
        <button className="sample-upload" onClick={loadExample} type="button">
          <span className="sample-thumb">
            <img alt="" src={sampleWriting} />
          </span>
          <span className="sample-copy">
            <b>예시 학습지로 바로 체험하기</b>
            <small>실제 손글씨 사진 위 첨삭 흐름을 확인해보세요.</small>
          </span>
          <span className="sample-action">사용하기 →</span>
        </button>
        {imageUrl && (
          <div className="file-ready">
            <img alt="업로드한 학습지 미리보기" src={imageUrl} />
            <span>
              <b>{imageName}</b>
              <small>사진 · 첨삭 준비 완료</small>
            </span>
            <button aria-label="파일 삭제" onClick={removeFile} type="button">
              ×
            </button>
          </div>
        )}
      </div>
      <aside className="applied-settings">
        <div className="card-heading">
          <div>
            <span className="eyebrow">REVIEW SETTINGS</span>
            <h2>이번 첨삭 설정</h2>
          </div>
          <span className="saved-badge">기본 설정</span>
        </div>
        <p>저장된 기본 설정이 자동으로 적용됩니다.</p>
        <div className="preset-list">
          {defaults
            .filter((setting) => setting.selected)
            .map((setting) => (
              <div className="preset-row" key={setting.id}>
                <span className={`preset-dot dot-${setting.id}`} />
                <b>{setting.name}</b>
                <span>{setting.level}</span>
              </div>
            ))}
        </div>
        <Button fullWidth onClick={editForSession}>
          이번 첨삭에서만 변경
        </Button>
        <div className="settings-caption">
          학생 실력 등급이 아닌, AI가 원문에 개입하는 정도입니다.
        </div>
      </aside>
      <div className="flow-actions">
        <Button onClick={onHome}>취소</Button>
        <Button disabled={!imageUrl} onClick={onGenerate} variant="primary">
          기본 설정으로 첨삭 시작 <b>✦</b>
        </Button>
      </div>
    </div>
  )
}

export function SessionSettingsScreen({
  onBack,
  onGenerate,
}: {
  onBack: () => void
  onGenerate: () => void
}) {
  const sessionSettings = useAppStore((state) => state.sessionSettings)
  const setSessionSettings = useAppStore((state) => state.setSessionSettings)
  const showToast = useAppStore((state) => state.showToast)

  const updateSetting = (nextSetting: ReviewSetting) => {
    setSessionSettings(
      sessionSettings.map((setting) => (setting.id === nextSetting.id ? nextSetting : setting)),
    )
  }

  const start = () => {
    if (!sessionSettings.some((setting) => setting.selected)) {
      showToast('첨삭 영역을 한 가지 이상 선택해주세요')
      return
    }
    onGenerate()
  }

  return (
    <section className="session-settings-screen">
      <div className="settings-intro">
        <span>이번 첨삭에서만 적용</span>
        <p>기본 설정은 바뀌지 않아요. 최소 한 가지 영역을 선택해주세요.</p>
      </div>
      <div className="settings-grid">
        {sessionSettings.map((setting) => (
          <SettingCard key={setting.id} onChange={updateSetting} setting={setting} />
        ))}
      </div>
      <div className="flow-actions">
        <Button onClick={onBack}>이전</Button>
        <Button onClick={start} variant="primary">
          이 설정으로 첨삭 시작 <b>✦</b>
        </Button>
      </div>
    </section>
  )
}
