import type { Correction } from '../../../apis/review'
import ActionButton from '../../../components/common/ActionButton'
import { areaOf } from './correctionAreas'

export type CorrectionCardProps = {
  correction: Correction
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onDelete: () => void
  onConfirm: () => void
}

/** AI 첨삭 카드. 누르면 원문·추천 문장·수정 이유와 삭제·확인 버튼이 펼쳐진다. 확인(반영)한 카드는 흐리게 보인다. */
export default function CorrectionCard({ correction, expanded, busy, onToggle, onDelete, onConfirm }: CorrectionCardProps) {
  const area = areaOf(correction.area)
  const isCorrection = correction.feedbackType === 'CORRECTION'
  const [width, height] = area.size

  return (
    <article
      className={`flex flex-col gap-ds-20 rounded-ds-medium border border-solid border-border-default bg-background-neutral-default px-ds-16 pt-ds-12 pb-ds-16 ${
        correction.isApplied && !expanded ? 'opacity-60' : ''
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
            <div className="flex flex-col gap-ds-4 rounded-ds-medium border border-solid border-border-default px-ds-16 py-ds-12">
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
            {/* 디자인에서 확인은 강조색이 아닌 회색 버튼이라 ActionButton 대신 직접 그린다. */}
            <button
              type="button"
              disabled={busy}
              aria-pressed={correction.isApplied}
              onClick={onConfirm}
              className="h-[30px] rounded-ds-small bg-ds-gray-500 px-ds-16 text-label2-semibold text-text-neutral-inverse hover:bg-ds-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused disabled:cursor-not-allowed disabled:opacity-60"
            >
              {correction.isApplied ? '확인 취소' : '확인'}
            </button>
          </div>
        </>
      )}
    </article>
  )
}
