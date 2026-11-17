import completedIcon from '../../../assets/design-system/icon-completed.svg'
import ActionButton from '../../../components/common/ActionButton'
import Modal from '../../../components/common/Modal'

export type CompleteModalProps = {
  open: boolean
  title: string
  onClose: () => void
  onStartNew: () => void
}

/** 최종 저장 뒤 뜨는 첨삭 완료 안내 */
export default function CompleteModal({ open, title, onClose, onStartNew }: CompleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="complete-title">
      <div className="flex flex-col items-center gap-ds-24 px-ds-24">
        <span className="flex size-[64px] items-center justify-center rounded-ds-medium bg-[var(--color-blue-100)]">
          <img src={completedIcon} alt="" width={48} height={48} />
        </span>
        <div className="flex flex-col gap-ds-8 text-center">
          {/* shortcut: 학습지에 학생 정보가 없어 "김민지 학생의" 부분을 뺀다, 학생 API가 생기면 앞에 붙인다. */}
          <h2 id="complete-title" className="text-h3 text-text-neutral-default">
            {title ? `‘${title}’` : '학습지'}
            <br />
            첨삭이 완성됐어요!
          </h2>
          <p className="text-body1-regular text-text-neutral-subtle">학생의 첨삭 결과가 학생 이력에 저장됐어요</p>
        </div>
      </div>
      <div className="flex gap-ds-12 px-ds-48 pt-ds-24 pb-ds-60">
        <ActionButton size="md" variant="secondary" className="flex-1" onClick={onStartNew}>
          새 첨삭 시작
        </ActionButton>
        {/* shortcut: PDF로 내보내는 API가 아직 없어 누를 수 없다, 백엔드 PDF API가 생기면 연결한다. */}
        <ActionButton size="md" className="flex-1" disabled title="준비 중이에요">
          PDF 저장하기
        </ActionButton>
      </div>
    </Modal>
  )
}
