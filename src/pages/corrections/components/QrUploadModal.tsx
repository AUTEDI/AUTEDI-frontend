import { useEffect, useRef, useState } from 'react'
import { subscribeEvents } from '../../../apis/events'
import { approveQrSession, createQrSession } from '../../../apis/qr'
import closeIcon from '../../../assets/design-system/modal-close.svg'
import reloadIcon from '../../../assets/design-system/reload.svg'

export type QrUploadModalProps = {
  open: boolean
  onClose: () => void
  /** 휴대폰이 첫 사진을 올려 새 작업이 만들어졌을 때 */
  onUploaded: (worksheetId: number) => void
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'waiting' }
  | { kind: 'connected' }
  | { kind: 'error'; message: string }

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** 휴대폰으로 사진을 올릴 수 있게 QR을 보여주는 모달. ESC·바깥 클릭·닫기 버튼으로 닫는다. */
export default function QrUploadModal({ open, onClose, onUploaded }: QrUploadModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // 새로고침하면 QR 세션을 처음부터 다시 만든다.
  const [attempt, setAttempt] = useState(0)

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
      {/* 닫혀 있는 동안에는 QR 세션도 SSE 연결도 만들지 않는다. */}
      {open && <QrSessionView key={attempt} onRefresh={() => setAttempt((value) => value + 1)} onUploaded={onUploaded} />}
    </dialog>
  )
}

function QrSessionView({ onRefresh, onUploaded }: { onRefresh: () => void; onUploaded: (worksheetId: number) => void }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [expiresAt, setExpiresAt] = useState(0)
  const [qrImage, setQrImage] = useState('')
  const [now, setNow] = useState(Date.now)
  const sessionIdRef = useRef<string | null>(null)
  const approvingRef = useRef(false)
  const onUploadedRef = useRef(onUploaded)
  useEffect(() => {
    onUploadedRef.current = onUploaded
  })

  useEffect(() => {
    let cancelled = false
    const fail = (error: unknown, fallback: string) => {
      if (!cancelled) setPhase({ kind: 'error', message: error instanceof Error ? error.message : fallback })
    }
    // QR을 만들기 전에 먼저 연결해 둬야 스캔 알림을 놓치지 않는다.
    const unsubscribe = subscribeEvents(({ event, data }) => {
      const sessionId = sessionIdRef.current
      // 노트북 탭이 여러 개일 수 있으니 이 탭이 만든 QR의 이벤트만 처리한다.
      if (!sessionId || data.sessionId !== sessionId) return
      if (event === 'qr.scanned') {
        // 휴대폰이 로그인돼 있지 않아도 바로 로그인되도록 승인 팝업 없이 자동으로 허용한다.
        if (approvingRef.current) return
        approvingRef.current = true
        approveQrSession(sessionId)
          .then(() => {
            if (!cancelled) setPhase({ kind: 'connected' })
          })
          .catch((error: unknown) => fail(error, '휴대폰 로그인을 허용하지 못했어요.'))
      } else if (event === 'qr.linked') setPhase({ kind: 'connected' })
      else if (event === 'worksheet.created' && typeof data.worksheetId === 'number') onUploadedRef.current(data.worksheetId)
    })
    createQrSession()
      .then((session) => {
        if (cancelled) return
        sessionIdRef.current = session.sessionId
        setQrImage(session.qrImage)
        setExpiresAt(session.expiresAt)
        setPhase({ kind: 'waiting' })
      })
      .catch((error: unknown) => fail(error, 'QR 코드를 만들지 못했어요.'))
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const waiting = phase.kind === 'waiting'
  useEffect(() => {
    if (!waiting) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [waiting])

  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  // 휴대폰이 찍기 전에 시간이 다 되면 서버도 QR을 만료시키므로 화면에서 바로 만료로 보여준다.
  const expired = waiting && remainingSeconds === 0

  if (phase.kind === 'connected') {
    return (
      <div role="status" className="flex flex-col items-center gap-ds-8 px-ds-24 pb-ds-48 text-center">
        <p className="text-h3 text-text-neutral-default">휴대폰이 연결되었어요</p>
        <p className="text-body2-regular text-text-neutral-muted">휴대폰에서 학습지 사진을 한 장 올려 주세요. 올리면 이 화면에 바로 반영돼요.</p>
      </div>
    )
  }

  const notice =
    phase.kind === 'loading' ? 'QR 코드를\n만들고 있어요'
    : phase.kind === 'error' ? phase.message
    : expired ? 'QR이 만료되었어요.\n새로고침해서 새로 생성해 주세요.'
    : null

  return (
    <div className="flex flex-col items-center gap-ds-24 pb-ds-48">
      <div className="flex flex-col items-center gap-ds-16">
        <div className="flex size-[240px] items-center justify-center overflow-clip rounded-ds-medium bg-[var(--color-blue-100)]">
          {notice ? (
            <p role="status" className="px-ds-16 text-center text-body1-medium whitespace-pre-line text-[var(--color-gray-900)]">{notice}</p>
          ) : (
            <img src={qrImage} alt="휴대폰 카메라로 찍으면 업로드 화면이 열리는 QR 코드" className="size-full object-contain" />
          )}
        </div>
        {waiting && <p className="text-h3 text-text-neutral-muted">남은 시간 {formatTime(remainingSeconds)}</p>}
      </div>
      <button type="button" onClick={onRefresh} className="flex items-center gap-ds-4 text-body1-medium text-text-neutral-subtle">
        새로고침
        <img src={reloadIcon} alt="" width={16} height={16} />
      </button>
    </div>
  )
}
