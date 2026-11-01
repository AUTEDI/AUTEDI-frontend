import { useReviewStore } from '../../stores/useReviewStore'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

export function CompleteModal({ onClose }: { onClose: () => void }) {
  const remainingAi = useReviewStore((state) => state.feedback.length - state.dismissedIds.length)
  const teacherCount = useReviewStore((state) => state.teacherComments.length)

  return (
    <Modal className="w-[min(410px,90vw)] text-center" labelledBy="complete-title" onClose={onClose}>
      <div className="mx-auto mb-[18px] grid size-[55px] place-items-center rounded-[18px] bg-[#ebedff] text-[22px] text-[#4e60da]">
        ✓
      </div>
      <h2 className="my-[7px] text-[22px]" id="complete-title">
        첨삭이 완성됐어요
      </h2>
      <p className="my-[9px] text-[9px] leading-normal text-[#7f8497]">
        사진 원본 위에 네 영역의 제안과 선생님의 코멘트가 안전하게 연결됐습니다.
      </p>
      <div className="m-[21px] flex items-center justify-center gap-[25px]">
        <div className="grid gap-[3px]">
          <b className="text-[19px] text-[#4a5cd7]">{remainingAi}</b>
          <small className="text-[7px] text-[#9095a5]">AI 첨삭</small>
        </div>
        <i className="h-[30px] w-px bg-[#e1e3ea]" />
        <div className="grid gap-[3px]">
          <b className="text-[19px] text-[#4a5cd7]">{teacherCount}</b>
          <small className="text-[7px] text-[#9095a5]">교사 코멘트</small>
        </div>
      </div>
      <Button className="w-full" onClick={onClose} variant="primary">
        계속 편집하기
      </Button>
    </Modal>
  )
}
