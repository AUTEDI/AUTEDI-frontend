import { useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import type { AiFeedback } from '../../types/review'
import { cn } from '../../utils/cn'
import { Button } from '../common/Button'

const LABEL = 'block text-[7px] font-[850]'

/** 선택한 AI 첨삭의 원문·추천 문장·이유. 선택이 바뀌면 key로 다시 마운트되어 편집 상태가 초기화된다. */
export function AiFeedbackDetail({ item, number }: { item: AiFeedback; number: number }) {
  const appliedIds = useReviewStore((state) => state.appliedIds)
  const toggleApplied = useReviewStore((state) => state.toggleApplied)
  const dismissActiveFeedback = useReviewStore((state) => state.dismissActiveFeedback)
  const saveSuggestion = useReviewStore((state) => state.saveSuggestion)
  const showToast = useAppStore((state) => state.showToast)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(item.suggestion)

  const correction = item.kind === 'correction'
  const applied = appliedIds.includes(item.id)

  const toggleEdit = async () => {
    if (!editing) {
      setDraft(item.suggestion)
      setEditing(true)
      return
    }
    const value = draft.trim()
    if (!value) {
      showToast('추천 문장을 입력해주세요')
      return
    }
    setSaving(true)
    // 저장에 실패하면 입력창을 그대로 두어 다시 시도할 수 있게 한다.
    if (await saveSuggestion(item.id, value)) setEditing(false)
    setSaving(false)
  }

  return (
    <div className="mt-[15px] animate-fade-detail border-t border-[#e5e7ef] pt-4">
      <div className="mb-[18px] flex items-center gap-[9px]">
        <span
          className={cn(
            'grid size-[35px] place-items-center rounded-[11px] text-[9px] font-black',
            correction ? 'bg-[#fff0f1] text-[#c53843]' : 'bg-[#edf4ff] text-[#175aa8]',
          )}
        >
          {String(number).padStart(2, '0')}
        </span>
        <b className={cn('text-[8px] tracking-[0.7px] uppercase', correction ? 'text-correction-ink' : 'text-improvement-ink')}>
          {item.category} · {correction ? '오류 수정' : '개선 제안'}
        </b>
      </div>
      <div className="mb-[10px] rounded-[11px] border border-[#e6e8f0] bg-[#f6f7fb] p-[13px] text-[#6f7485]">
        <span className={cn(LABEL, 'mb-[7px]')}>원문</span>
        <p className="text-[9px] leading-[1.6]">{item.original}</p>
      </div>
      <div className="mb-[10px] grid gap-1 rounded-[11px] border border-[#d8dcfb] bg-[linear-gradient(135deg,#eef0ff,#f7f7ff)] p-[13px] text-[#28356f]">
        <div className="mb-2 flex items-center justify-between">
          <span className={LABEL}>추천 문장</span>
          <button
            className="rounded-[7px] border border-[#cfd5ff] bg-white px-[9px] py-[5px] text-[7px] font-[850] text-[#5163dc] hover:bg-[#eef0ff] disabled:opacity-60"
            disabled={saving}
            onClick={() => void toggleEdit()}
            type="button"
          >
            {saving ? '저장 중…' : editing ? '저장' : '수정'}
          </button>
        </div>
        {editing ? (
          <textarea
            aria-label="추천 문장 수정"
            autoFocus
            className="min-h-[68px] w-full resize-y rounded-lg border border-[#bbc4ff] bg-white p-[9px] text-[9px] leading-[1.55] text-[#293572] outline-none focus:shadow-[0_0_0_3px_#e9ecff]"
            maxLength={240}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            value={draft}
          />
        ) : (
          <p className="text-[9px] leading-[1.6] font-[750]">{item.suggestion}</p>
        )}
      </div>
      <div className="mt-[17px] px-[3px]">
        <span className={cn(LABEL, 'mb-[7px]', correction ? 'text-correction-ink' : 'text-improvement-ink')}>
          왜 이렇게 고쳤나요?
        </span>
        <p className="text-[9px] leading-[1.75] text-[#61677a]">{item.reason}</p>
      </div>
      <div className="mt-[19px] grid grid-cols-[1fr_1.25fr] gap-[7px] max-lg:grid-cols-1">
        <Button className="max-lg:w-full" onClick={() => void dismissActiveFeedback()} size="md" variant="danger">
          피드백 삭제
        </Button>
        <Button className="max-lg:w-full" onClick={toggleApplied} size="md" variant={applied ? 'applied' : 'primary'}>
          {applied ? '반영됨 ✓' : '피드백 반영'}
        </Button>
      </div>
      <div className="mt-[22px] rounded-[10px] bg-navy p-3 text-[7px] leading-normal text-[#c7ccef] max-sm:mb-5">
        사진의 다른 손글씨 첨삭을 눌러 설명을 바꿔보세요.
      </div>
    </div>
  )
}
