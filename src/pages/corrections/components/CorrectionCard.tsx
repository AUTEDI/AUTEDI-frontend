import { useEffect, useRef } from 'react'
import type { Correction } from '../../../apis/review'
import ActionButton from '../../../components/common/ActionButton'
import { areaOf } from './correctionAreas'

export type CorrectionCardProps = {
  correction: Correction
  expanded: boolean
  /** 다른 첨삭을 고른 동안 흐리게 보인다. 아무것도 고르지 않았으면 모두 진하다. */
  dimmed: boolean
  busy: boolean
  onToggle: () => void
  onDelete: () => void
  onConfirm: () => void
}

/** AI 첨삭 카드. 누르면 원문·추천 문장·수정 이유와 삭제·확인 버튼이 펼쳐진다. */
export default function CorrectionCard({ correction, expanded, dimmed, busy, onToggle, onDelete, onConfirm }: CorrectionCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  // 사진에서 표시를 눌러 펼쳐져도 카드가 보이도록 목록을 스크롤한다.
  useEffect(() => {
    if (expanded) cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [expanded])
  const area = areaOf(correction.area)
  const isCorrection = correction.feedbackType === 'CORRECTION'
  const [width, height] = area.size

  return (
    <article
      ref={cardRef}
      className={`flex flex-col gap-ds-20 rounded-ds-medium border border-solid border-border-neutral-default bg-background-neutral-default px-ds-16 pt-ds-12 pb-ds-16 ${
        dimmed ? 'opacity-60' : ''
      }`}
    >
      <button type="button" aria-expanded={expanded} onClick={onToggle} className="flex w-full items-center gap-ds-16 text-left">
        <span
          className={`flex size-[32px] shrink-0 items-center justify-center rounded-ds-small ${
            isCorrection ? 'bg-background-accent-red-weak' : 'bg-background-brand-weak'
          }`}
        >
          <img src={area.icons[isCorrection ? 0 : 1]} alt="" width={width} height={height} />
        </span>
        <span className="flex min-w-px flex-1 flex-col">
          <span className="truncate text-body1-medium text-text-neutral-default">{correction.content || correction.originalText}</span>
          <span className="text-label3-medium text-text-neutral-muted">
            {area.label}
            <span className="sr-only">
              {isCorrection ? ' 오류 수정' : ' 개선 제안'}
              {correction.isApplied ? ', 확인함' : ''}
            </span>
          </span>
        </span>
      </button>

      {expanded && (
        <>
          <div className="flex flex-col gap-ds-16">
            <div className="flex flex-col gap-ds-4 rounded-ds-medium border border-solid border-border-neutral-default px-ds-16 py-ds-12">
              <p className="text-label3-semibold text-text-neutral-subtle">원문</p>
              <p className="text-body1-regular text-ds-gray-600">{correction.originalText}</p>
            </div>
            <div
              className={`flex flex-col gap-ds-8 rounded-ds-medium border border-solid px-ds-16 py-ds-12 ${
                isCorrection ? 'border-text-accent-red' : 'border-text-brand-strong'
              }`}
            >
              <div>
                <p className="text-label3-semibold text-text-neutral-subtle">추천 문장</p>
                <p className="text-body1-medium text-text-neutral-default">{correction.content}</p>
              </div>
              {correction.explanation && (
                <p className={`text-label3-medium ${isCorrection ? 'text-text-accent-red' : 'text-text-brand-strong'}`}>
                  ※ {correction.explanation}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-ds-8">
            <ActionButton size="sm" variant="secondary" disabled={busy} onClick={onDelete}>
              삭제
            </ActionButton>
            <ActionButton size="sm" variant="neutral" disabled={busy} onClick={onConfirm}>
              확인
            </ActionButton>
          </div>
        </>
      )}
    </article>
  )
}
