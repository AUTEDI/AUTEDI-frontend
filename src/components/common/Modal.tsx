import { useEffect, useRef, type ReactNode } from 'react'
import closeIcon from '../../assets/design-system/modal-close.svg'

export type ModalProps = {
  open: boolean
  onClose: () => void
  /** 화면 읽기 프로그램이 읽는 모달 제목 요소의 id */
  labelledBy: string
  children: ReactNode
}

/** 가운데 뜨는 520px 모달. 오른쪽 위 닫기 버튼·ESC·바깥 클릭으로 닫는다. <dialog>라 포커스가 모달 안에 머문다. */
export default function Modal({ open, onClose, labelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto w-[520px] max-w-[calc(100vw-32px)] overflow-clip rounded-ds-large bg-background-neutral-default p-0 font-sans backdrop:bg-black/40"
    >
      <div className="flex justify-end px-ds-24 pt-ds-24 pb-ds-12">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex size-ds-24 items-center justify-center">
          <img src={closeIcon} alt="" width={15.1} height={15.1} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
