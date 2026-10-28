import { useMemo, useRef, useState } from 'react'
import { Button } from '../../design-system/Button'
import { saveReview } from '../../services/reviewStorage'
import { ReviewCanvas } from './ReviewCanvas'
import type { TeacherComment } from './types'
import { useAppStore } from '../../store/useAppStore'

type AnnotationStyle = TeacherComment['style']

const annotationStyles: { id: AnnotationStyle; name: string; icon: string }[] = [
  { id: 'highlight', name: '하이라이트', icon: '▰' },
  { id: 'underline', name: '밑줄', icon: 'U̲' },
  { id: 'arrow', name: '화살표', icon: '→' },
  { id: 'box', name: '네모', icon: '□' },
  { id: 'caret', name: '삽입 표시', icon: '⌃' },
]

export function ReviewWorkspace({ onBack }: { onBack: () => void }) {
  const imageUrl = useAppStore((state) => state.imageUrl)
  const feedback = useAppStore((state) => state.feedback)
  const activeFeedbackId = useAppStore((state) => state.activeFeedbackId)
  const appliedFeedbackIds = useAppStore((state) => state.appliedFeedbackIds)
  const teacherComments = useAppStore((state) => state.teacherComments)
  const selectFeedback = useAppStore((state) => state.selectFeedback)
  const updateFeedback = useAppStore((state) => state.updateFeedback)
  const removeFeedback = useAppStore((state) => state.removeFeedback)
  const toggleApplied = useAppStore((state) => state.toggleApplied)
  const addTeacherComment = useAppStore((state) => state.addTeacherComment)
  const removeTeacherComment = useAppStore((state) => state.removeTeacherComment)
  const updateTeacherComment = useAppStore((state) => state.updateTeacherComment)
  const showToast = useAppStore((state) => state.showToast)

  const [panelMode, setPanelMode] = useState<'ai' | 'teacher'>('ai')
  const [drawing, setDrawing] = useState(false)
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  )
  const [annotationStyle, setAnnotationStyle] = useState<AnnotationStyle>('highlight')
  const [annotationColor, setAnnotationColor] = useState<'blue' | 'red'>('blue')
  const [teacherText, setTeacherText] = useState('')
  const [zoom, setZoom] = useState(0.9)
  const [editingSuggestion, setEditingSuggestion] = useState(false)
  const [suggestionDraft, setSuggestionDraft] = useState('')
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const savedId = useRef(useAppStore.getState().reviewId ?? crypto.randomUUID())
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null)
  const changeFeedback = (id: string) => {
    setEditingSuggestion(false)
    setEditingFeedbackId(null)
    selectFeedback(id)
  }
  const openTeacherNote = (comment: TeacherComment) => {
    setPanelMode('teacher'); setDrawing(false); setEditingTeacherId(comment.id)
    setSelection(comment); setTeacherText(comment.text)
    setAnnotationColor(comment.color); setAnnotationStyle(comment.style)
  }
  const saveWork = async () => {
    if (editingSuggestion || teacherText.trim()) { showToast('작성 중인 추천 문장 또는 교사 코멘트를 먼저 저장해주세요'); return }
    if (!imageUrl || saving) return
    setSaving(true)
    const state = useAppStore.getState()
    try {
      await saveReview({ id: savedId.current, savedAt: new Date().toISOString(), imageUrl,
        imageName: state.imageName ?? '학습지', feedback: structuredClone(feedback),
        teacherComments: structuredClone(teacherComments), appliedFeedbackIds: [...appliedFeedbackIds],
        sessionSettings: structuredClone(state.sessionSettings) })
      useAppStore.setState({ reviewId: savedId.current })
      showToast('이 기기에 저장했어요. 홈의 최근 작업에서 다시 열 수 있어요')
    } catch { showToast('저장하지 못했어요. 브라우저 저장 공간을 확인하고 다시 시도해주세요') }
    finally { setSaving(false) }
  }

  const activeFeedback = useMemo(
    () => feedback.find((item) => item.id === activeFeedbackId) ?? null,
    [activeFeedbackId, feedback],
  )

  const startTeacherNote = () => {
    setPanelMode('teacher')
    setEditingTeacherId(null)
    setTeacherText('')
    setSelection(null)
    setDrawing(true)
    showToast('사진 위 문장을 드래그해 선택하세요')
  }

  const saveTeacherNote = () => {
    if (!selection || !teacherText.trim()) {
      showToast('문장을 선택하고 코멘트를 입력해주세요')
      return
    }
    const id = editingTeacherId ?? crypto.randomUUID()
    const comment: TeacherComment = {
      id,
      text: teacherText.trim(),
      ...selection,
      color: annotationColor,
      style: annotationStyle,
    }
    if (editingTeacherId) updateTeacherComment(id, comment)
    else addTeacherComment(comment)
    setEditingTeacherId(null)
    setSelection(null)
    setTeacherText('')
    setDrawing(true)
    showToast('교사 코멘트를 저장했어요. 다음 문장을 바로 선택할 수 있어요')
  }

  const beginSuggestionEdit = () => {
    if (!activeFeedback) return
    setSuggestionDraft(activeFeedback.suggestion)
    setEditingFeedbackId(activeFeedback.id)
    setEditingSuggestion(true)
  }

  const saveSuggestion = () => {
    const nextSuggestion = suggestionDraft.trim()
    if (!activeFeedback || activeFeedback.id !== editingFeedbackId || !nextSuggestion) {
      showToast('추천 문장을 입력해주세요')
      return
    }
    updateFeedback(activeFeedback.id, { suggestion: nextSuggestion })
    setEditingSuggestion(false)
    showToast('추천 문장을 수정했어요')
  }

  const deleteFeedback = () => {
    if (!activeFeedback) return
    removeFeedback(activeFeedback.id)
    setEditingSuggestion(false)
    showToast('선택한 AI 첨삭을 삭제했어요')
  }

  const feedbackCount = feedback.length
  const isApplied = activeFeedback ? appliedFeedbackIds.includes(activeFeedback.id) : false

  return (
    <section className="review-page">
      <div className="studio-titlebar">
        <div>
          <span className="review-status">로컬 데모 · 검토 중</span>
          <small>예시 학습지만 목업 AI 결과를 제공합니다. 업로드한 사진에는 직접 코멘트를 작성하세요.</small>
        </div>
        <div>
          <Button
            disabled={saving}
            onClick={saveWork}
            variant="secondary"
          >
            {saving ? '저장 중…' : '저장'}
          </Button>
          <Button onClick={() => { if (editingSuggestion || teacherText.trim()) { showToast('작성 중인 내용을 먼저 저장해주세요'); return } window.print() }} variant="primary">
            PDF 출력
          </Button>
        </div>
      </div>
      <div className="annotation-studio">
        <aside className="page-rail">
          <span>원본</span>
          {imageUrl && <img alt="원본 손글씨 미리보기" src={imageUrl} />}
          <b>1 페이지</b>
        </aside>
        <section className="editor-area">
          <div className="studio-toolbar">
            <div className="toolbar-tools">
              <button
                aria-pressed={drawing}
                className={`tool-button${drawing ? ' active' : ''}`}
                onClick={startTeacherNote}
                type="button"
              >
                T+
              </button>
              <span className="toolbar-divider" />
              <button
                aria-label="축소"
                className="tool-button"
                onClick={() => setZoom((value) => Math.max(0.65, Number((value - 0.1).toFixed(2))))}
                type="button"
              >
                −
              </button>
              <span className="zoom-label">{Math.round(zoom * 100)}%</span>
              <button
                aria-label="확대"
                className="tool-button"
                onClick={() => setZoom((value) => Math.min(1.2, Number((value + 0.1).toFixed(2))))}
                type="button"
              >
                ＋
              </button>
              <span className="toolbar-divider" />
              {annotationStyles.map((style) => (
                <button
                  aria-label={style.name}
                  className={`tool-button${annotationStyle === style.id ? ' active' : ''}`}
                  key={style.id}
                  onClick={() => {
                    setAnnotationStyle(style.id)
                    startTeacherNote()
                  }}
                  title={style.name}
                  type="button"
                >
                  {style.icon}
                </button>
              ))}
            </div>
            <span className="toolbar-hint">코멘트는 드래그해 이동할 수 있어요</span>
          </div>
          <div className="canvas-board">
            {imageUrl ? (
              <ReviewCanvas
                activeFeedbackId={activeFeedbackId}
                drawing={drawing}
                feedback={feedback}
                imageUrl={imageUrl}
                onDrawingEnd={() => setDrawing(false)}
                onMoveFeedback={(id, x, y) => updateFeedback(id, { x, y })}
                onMoveTeacherComment={(id, x, y) => { updateTeacherComment(id, { x, y }); if (editingTeacherId === id) setSelection(current => current ? { ...current, x, y } : null) }}
                onSelectFeedback={(id) => {
                  setPanelMode('ai')
                  setDrawing(false)
                  changeFeedback(id)
                }}
                selection={panelMode === 'teacher' ? selection : null}
                onSelectTeacherComment={openTeacherNote}
                onSelection={setSelection}
                teacherComments={teacherComments}
                zoom={zoom}
              />
            ) : (
              <div className="canvas-placeholder">
                <span>이미지가 아직 없어요</span>
                <Button onClick={onBack} variant="secondary">
                  이미지 업로드
                </Button>
              </div>
            )}
            {drawing && <div className="drag-guide">사진 위 문장을 드래그해 선택하세요</div>}
          </div>
        </section>
        <aside className="feedback-panel">
          <div className="panel-mode-switch" role="tablist" aria-label="첨삭 패널 전환">
            <button
              aria-selected={panelMode === 'ai'}
              className={panelMode === 'ai' ? 'active' : ''}
              onClick={() => {
                setPanelMode('ai')
                setDrawing(false)
                setSelection(null)
              }}
              role="tab"
              type="button"
            >
              <span>✦</span> AI 첨삭
            </button>
            <button
              aria-selected={panelMode === 'teacher'}
              className={panelMode === 'teacher' ? 'active' : ''}
              onClick={startTeacherNote}
              role="tab"
              type="button"
            >
              <span>✎</span> 선생님 수기 첨삭
            </button>
          </div>

          {panelMode === 'ai' ? (
            <div className="ai-review-panel">
              <div className="saved-list-heading">
                <b>AI 첨삭</b>
                <span>{feedbackCount}개</span>
              </div>
              <p className="panel-intro">코멘트를 선택하면 수정 이유와 추천 문장을 확인할 수 있어요.</p>
              <div className="ai-feedback-list">
                {feedback.map((item) => (
                  <button
                    aria-current={item.id === activeFeedbackId ? 'true' : undefined}
                    className={`ai-feedback-item ${item.kind}${item.id === activeFeedbackId ? ' active' : ''}`}
                    key={item.id}
                    onClick={() => changeFeedback(item.id)}
                    type="button"
                  >
                    <span className="feedback-indicator" />
                    <span>
                      <b>{item.suggestion}</b>
                      <small>{item.category}{item.id === activeFeedbackId && <span className="feedback-selected-badge">선택됨</span>}</small>
                    </span>
                  </button>
                ))}
                {!feedback.length && <p className="empty-panel">남아 있는 AI 코멘트가 없어요.</p>}
              </div>
              {activeFeedback && (
                <div className="feedback-detail">
                  <div className="detail-kicker">
                    <span>{String(feedback.findIndex((item) => item.id === activeFeedback.id) + 1).padStart(2, '0')}</span>
                    <b>{activeFeedback.category}</b>
                  </div>
                  <div className="detail-block">
                    <span>원문</span>
                    <p>{activeFeedback.original}</p>
                  </div>
                  <div className="detail-block suggestion-block">
                    <div className="suggestion-heading">
                      <span>추천 문장</span>
                      {!editingSuggestion && (
                        <button onClick={beginSuggestionEdit} type="button">
                          수정
                        </button>
                      )}
                    </div>
                    {editingSuggestion ? (
                      <textarea
                        aria-label="추천 문장 수정"
                        maxLength={240}
                        onChange={(event) => setSuggestionDraft(event.target.value)}
                        rows={3}
                        value={suggestionDraft}
                      />
                    ) : (
                      <p>{activeFeedback.suggestion}</p>
                    )}
                    {editingSuggestion && (
                      <Button onClick={saveSuggestion} variant="primary">
                        저장
                      </Button>
                    )}
                  </div>
                  <div className="detail-reason">
                    <b>왜 이렇게 고쳤나요?</b>
                    <p>{activeFeedback.reason}</p>
                  </div>
                  <div className="feedback-actions">
                    <Button onClick={deleteFeedback} variant="danger">
                      피드백 삭제
                    </Button>
                    <Button
                      onClick={() => {
                        toggleApplied(activeFeedback.id)
                        showToast(isApplied ? '첨삭 반영을 취소했어요' : '이 첨삭을 반영했어요')
                      }}
                      variant="primary"
                    >
                      {isApplied ? '반영됨 ✓' : '피드백 반영'}
                    </Button>
                  </div>
                  <small className="detail-hint">사진 위 첨삭 표시를 드래그해 위치를 옮길 수 있어요.</small>
                </div>
              )}
            </div>
          ) : (
            <div className="teacher-review-panel">
              <div className="manual-head">
                <span>T+</span>
                <div>
                  <h3>선택한 문장에 피드백</h3>
                  <p>강조 방식과 색상을 고르고 코멘트를 남겨주세요.</p>
                </div>
              </div>
              <div className="manual-options">
                <span>코멘트 연결 표시</span>
                <div className="manual-style">
                  {annotationStyles.map((style) => (
                    <button
                      aria-pressed={annotationStyle === style.id}
                      className={annotationStyle === style.id ? 'active' : ''}
                      key={style.id}
                      onClick={() => setAnnotationStyle(style.id)}
                      type="button"
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
                <span>첨삭 색상</span>
                <div className="manual-colors">
                  <button
                    aria-pressed={annotationColor === 'blue'}
                    className={annotationColor === 'blue' ? 'active' : ''}
                    onClick={() => setAnnotationColor('blue')}
                    type="button"
                  >
                    <i className="blue-swatch" /> 파란색
                  </button>
                  <button
                    aria-pressed={annotationColor === 'red'}
                    className={annotationColor === 'red' ? 'active' : ''}
                    onClick={() => setAnnotationColor('red')}
                    type="button"
                  >
                    <i className="red-swatch" /> 빨간색
                  </button>
                </div>
              </div>
              <label className="comment-field">
                <span>교사 코멘트</span>
                <textarea
                  maxLength={200}
                  onChange={(event) => setTeacherText(event.target.value)}
                  placeholder="학생에게 남길 코멘트를 입력하세요"
                  value={teacherText}
                />
                <small>{teacherText.length} / 200</small>
              </label>
              <div className="manual-actions">
                <Button
                  onClick={() => {
                    setSelection(null)
                    setTeacherText('')
                    setEditingTeacherId(null)
                    setDrawing(false)
                    setPanelMode('ai')
                  }}
                >
                  취소
                </Button>
                <Button disabled={!selection || !teacherText.trim()} onClick={saveTeacherNote} variant="primary">
                  {editingTeacherId ? '코멘트 수정' : '코멘트 저장'}
                </Button>
              </div>
              <div className="teacher-saved">
                <div className="saved-list-heading">
                  <b>저장된 코멘트</b>
                  <button onClick={startTeacherNote} type="button">
                    ＋ 새 코멘트
                  </button>
                </div>
                {teacherComments.length ? (
                  teacherComments.map((comment, index) => (
                    <div className="teacher-saved-item" key={comment.id}>
                      <button
                        className={`teacher-comment-text color-${comment.color}`}
                        onClick={() => openTeacherNote(comment)}
                        type="button"
                      >
                        <b>{String(index + 1).padStart(2, '0')}</b>
                        <span>{comment.text}</span>
                      </button>
                      <button
                        aria-label="교사 코멘트 삭제"
                        className="teacher-delete"
                        onClick={() => { removeTeacherComment(comment.id); if (editingTeacherId === comment.id) { setEditingTeacherId(null); setSelection(null); setTeacherText('') } }}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="empty-panel">아직 저장된 교사 코멘트가 없어요.</p>
                )}
              </div>
            </div>
          )}
          <div className="annotation-summary">
            <span>
              <b>{feedbackCount}</b> AI 첨삭
            </span>
            <span>
              <b>{teacherComments.length}</b> 교사 코멘트
            </span>
          </div>
        </aside>
      </div>

      <section className="print-review">
        <h1>학습지 첨삭 결과</h1>
        <p>{useAppStore.getState().imageName} · 로컬 데모</p>
        {imageUrl && <div className="print-sheet"><img className="print-original" src={imageUrl} alt="학습지 원본" />
          {feedback.map((item, index) => <div key={item.id} className="print-mark" style={{left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, borderColor: item.kind === 'correction' ? '#dc3545' : '#4365e8'}}><b>AI {index + 1}</b></div>)}
          {teacherComments.map((item, index) => <div key={item.id} className={`print-mark print-${item.style}`} style={{left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, color: item.color === 'red' ? '#dc3545' : '#4365e8'}}><b>교사 {index + 1}</b></div>)}
        </div>}
        <h2>AI 첨삭</h2>
        {!feedback.length && <p>이 이미지의 자동 분석 결과는 없습니다. 직접 작성한 교사 코멘트를 확인하세요.</p>}
        {feedback.map((item, index) => <article key={item.id}>
          <h3>{index + 1}. {item.category} {appliedFeedbackIds.includes(item.id) ? '(반영됨)' : '(제안)'}</h3>
          <p>위치: 왼쪽 {Math.round(item.x)}%, 위쪽 {Math.round(item.y)}%</p>
          <p>원문: {item.original}</p><p>추천: {item.suggestion}</p><p>{item.reason}</p>
        </article>)}
        <h2>교사 코멘트</h2>
        {teacherComments.map((item, index) => <article key={item.id}><h3>{index + 1}. 교사 코멘트</h3>
          <p>위치: 왼쪽 {Math.round(item.x)}%, 위쪽 {Math.round(item.y)}%</p><p>{item.text}</p></article>)}
      </section>
    </section>
  )
}
