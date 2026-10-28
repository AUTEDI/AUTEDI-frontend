import { useEffect, useState } from 'react'
import { listReviews, type SavedReview } from '../services/reviewStorage'
import { Button } from '../design-system/Button'
import { SettingCard } from '../design-system/SettingCard'
import type { ReviewSetting } from '../features/review/types'
import { useAppStore } from '../store/useAppStore'

type HomeScreenProps = {
  onStart: () => void
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [savedReviews, setSavedReviews] = useState<SavedReview[]>([])
  useEffect(() => { let active = true; listReviews().then(items => { if (active) setSavedReviews(items) }).catch(() => { if (active) useAppStore.getState().showToast('저장된 작업을 불러오지 못했어요') }); return () => { active = false } }, [])
  const openReview = (review: SavedReview) => {
    useAppStore.setState({ reviewId: review.id, page: 'review', step: 'canvas', imageUrl: review.imageUrl, imageName: review.imageName,
      feedback: structuredClone(review.feedback), teacherComments: structuredClone(review.teacherComments),
      appliedFeedbackIds: [...review.appliedFeedbackIds], sessionSettings: structuredClone(review.sessionSettings), activeFeedbackId: review.feedback[0]?.id ?? '' })
  }
  const defaults = useAppStore((state) => state.defaults)
  const setDefaults = useAppStore((state) => state.setDefaults)
  const showToast = useAppStore((state) => state.showToast)
  const [editing, setEditing] = useState(false)
  const [draftSettings, setDraftSettings] = useState<ReviewSetting[]>(defaults)

  const updateSetting = (nextSetting: ReviewSetting) => {
    setDraftSettings((current) => current.map((setting) => (setting.id === nextSetting.id ? nextSetting : setting)))
  }

  const openSettings = () => {
    setDraftSettings(defaults.map((setting) => ({ ...setting })))
    setEditing(true)
  }

  const saveSettings = () => {
    if (!draftSettings.some((setting) => setting.selected)) {
      showToast('첨삭 영역을 한 가지 이상 선택해주세요')
      return
    }
    setDefaults(draftSettings)
    setEditing(false)
    showToast('기본 첨삭 설정을 저장했어요')
  }

  return (
    <section className="home-page">
      <div className="home-grid">
        <article className="start-card">
          <div aria-hidden="true" className="start-art">
            <div className="paper-illustration">
              <span />
              <span />
              <span />
              <i>✦</i>
            </div>
            <div className="art-orb art-orb-one" />
            <div className="art-orb art-orb-two" />
          </div>
          <div className="start-copy">
            <span className="eyebrow">AI WRITING REVIEW</span>
            <h1>새 첨삭을 시작하세요</h1>
            <p>
              학생의 학습지를 촬영하거나 파일로 올리면
              <br />
              AI가 사진 위에 바로 첨삭을 표시해요.
            </p>
            <Button onClick={onStart} variant="primary">
              새 첨삭 시작 <b aria-hidden="true">→</b>
            </Button>
          </div>
        </article>
        <article className="default-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">YOUR DEFAULTS</span>
              <h2>기본 첨삭 설정</h2>
            </div>
            <Button onClick={openSettings} variant="text">
              설정 변경
            </Button>
          </div>
          <p>새 첨삭을 시작할 때 자동으로 적용돼요.</p>
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
          <div className="preset-note">
            <span>i</span> 업로드 후 이번 첨삭에서만 다른 설정을 적용할 수도 있어요.
          </div>
        </article>
      </div>
      <div className="recent-heading">
        <div>
          <span className="eyebrow">RECENT WORK</span>
          <h2>최근 작업</h2>
        </div>
        <Button onClick={() => document.getElementById('saved-reviews')?.scrollIntoView({ behavior: 'smooth' })} variant="text">
          전체 보기 <span>→</span>
        </Button>
      </div>
      <div id="saved-reviews" className="saved-review-list">
        {savedReviews.map(review => <div className="recent-empty" key={review.id}>
          <img width="44" height="58" style={{objectFit: 'contain'}} src={review.imageUrl} alt="저장된 학습지" />
          <div><b>{review.imageName}</b><small>{new Date(review.savedAt).toLocaleString('ko-KR')} · AI {review.feedback.length}개 · 교사 {review.teacherComments.length}개</small></div>
          <Button onClick={() => openReview(review)} variant="secondary">계속 편집</Button>
        </div>)}
      </div>
      {!savedReviews.length && <div className="recent-empty">
        <span className="empty-icon">✎</span>
        <div>
          <b>아직 저장된 첨삭이 없어요</b>
          <small>첫 학습지를 업로드하면 최근 작업이 여기에 보여요.</small>
        </div>
        <Button onClick={onStart} variant="secondary">
          첫 첨삭 시작하기
        </Button>
      </div>}

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(false)
          }}
          role="presentation"
        >
          <section aria-labelledby="settings-title" aria-modal="true" className="settings-modal" role="dialog">
            <button aria-label="설정 닫기" className="modal-close" onClick={() => setEditing(false)} type="button">
              ×
            </button>
            <span className="eyebrow">DEFAULT REVIEW SETTINGS</span>
            <h2 id="settings-title">기본 첨삭 설정</h2>
            <p>앞으로 새 학습지를 올릴 때 자동으로 적용할 설정이에요.</p>
            <div className="settings-grid compact">
              {draftSettings.map((setting) => (
                <SettingCard
                  compact
                  key={setting.id}
                  onChange={updateSetting}
                  setting={setting}
                />
              ))}
            </div>
            <footer>
              <Button onClick={() => setEditing(false)}>취소</Button>
              <Button onClick={saveSettings} variant="primary">
                기본 설정 저장
              </Button>
            </footer>
          </section>
        </div>
      )}
    </section>
  )
}
