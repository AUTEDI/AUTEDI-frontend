import { useEffect, useRef } from 'react'
import closeIcon from '../../../assets/design-system/modal-close.svg'
import reloadIcon from '../../../assets/design-system/reload.svg'

export type QrUploadModalProps = {
  open: boolean
  onClose: () => void
  /** QR 이미지 주소. 없으면 자리 표시만 보여준다. */
  qrImageUrl?: string
  /** QR이 만료될 때까지 남은 초 */
  remainingSeconds: number
  onRefresh: () => void
}

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

/** 휴대폰으로 사진을 올릴 수 있게 QR을 보여주는 모달. ESC·바깥 클릭·닫기 버튼으로 닫는다. */
export default function QrUploadModal({ open, onClose, qrImageUrl, remainingSeconds, onRefresh }: QrUploadModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // 브라우저 기본 모달(dialog)을 써서 포커스 가두기와 ESC 닫기를 그대로 얻는다.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="qr-upload-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto w-[520px] max-w-[calc(100vw-32px)] overflow-clip rounded-ds-large bg-background-neutral-default p-0 font-sans backdrop:bg-black/40"
    >
      <h2 id="qr-upload-title" className="sr-only">
        휴대폰으로 업로드
      </h2>
      <div className="flex justify-end px-ds-24 pt-ds-24 pb-ds-12">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex size-ds-24 items-center justify-center">
          <img src={closeIcon} alt="" width={15.1} height={15.1} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-ds-24 pb-ds-48">
        <div className="flex flex-col items-center gap-ds-16">
          <div className="flex size-[240px] items-center justify-center overflow-clip rounded-ds-medium bg-[var(--color-blue-100)]">
            {qrImageUrl ? (
              <img src={qrImageUrl} alt="휴대폰 카메라로 찍으면 업로드 화면이 열리는 QR 코드" className="size-full object-contain" />
            ) : (
              <p className="text-center text-h3 whitespace-pre-line text-[var(--color-gray-900)]">{'QR 코드\n삽입'}</p>
            )}
          </div>
          <p className="text-h3 text-text-neutral-muted">
            남은 시간 {formatTime(remainingSeconds)}
          </p>
        </div>
        <button type="button" onClick={onRefresh} className="flex items-center gap-ds-4 text-body1-medium text-text-neutral-subtle">
          새로고침
          <img src={reloadIcon} alt="" width={16} height={16} />
        </button>
      </div>
    </dialog>
  )
}
