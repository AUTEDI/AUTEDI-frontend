import { useReviewStore } from '../../stores/useReviewStore'
import { cn } from '../../utils/cn'
import { AiFeedbackDetail } from './AiFeedbackDetail'

export function AiFeedbackPanel() {
  const feedback = useReviewStore((state) => state.feedback)
  const dismissedIds = useReviewStore((state) => state.dismissedIds)
  const activeFeedbackId = useReviewStore((state) => state.activeFeedbackId)
  const detailOpen = useReviewStore((state) => state.detailOpen)
  const selectFeedback = useReviewStore((state) => state.selectFeedback)

  const remaining = feedback.filter((item) => !dismissedIds.includes(item.id))
  const active = remaining.find((item) => item.id === activeFeedbackId)

  return (
    <section className="min-h-0">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-[10px]">AI 첨삭</b>
        <span className="text-[7px] text-[#8d92a4]">
          <b className="text-[#5063d8]">{remaining.length}</b>개
        </span>
      </div>
      <p className="mb-3 text-[7px] leading-[1.55] text-[#8d92a4]">
        코멘트를 선택하면 수정 이유와 추천 문장을 확인할 수 있어요.
      </p>
      <div className="grid gap-1.5">
        {remaining.map((item) => (
          <button
            aria-current={item.id === activeFeedbackId ? 'true' : undefined}
            className={cn(
              'flex w-full min-w-0 items-center gap-2 rounded-[9px] border p-2 text-left text-[#53596c]',
              item.id === activeFeedbackId
                ? 'border-[#7f8af0] bg-[#f2f4ff] shadow-[0_4px_12px_rgba(54,67,151,0.08)]'
                : 'border-[#e3e6ef] bg-white',
            )}
            key={item.id}
            onClick={() => selectFeedback(item.id)}
            type="button"
          >
            <i
              className={cn(
                'size-2 flex-none rounded-[2px]',
                item.kind === 'correction' ? 'bg-correction' : 'bg-improvement',
              )}
            />
            <span className="grid min-w-0 gap-0.5">
              <b className="truncate text-[7px]">{item.suggestion}</b>
              <small className="text-[6px] text-[#9a9eae]">
                {item.category}
                {!item.mark && ' · 사진 위치 확인 필요'}
              </small>
            </span>
          </button>
        ))}
        {!remaining.length && <p className="text-[7px] text-[#9a9ead]">남아 있는 AI 코멘트가 없어요.</p>}
      </div>
      {detailOpen && active && (
        <AiFeedbackDetail item={active} key={active.id} number={feedback.indexOf(active) + 1} />
      )}
    </section>
  )
}
