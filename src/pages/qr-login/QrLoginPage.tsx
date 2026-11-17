import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '../../apis/client'
import { getQrStatus, issueQrToken, linkQr, scanQr, type QrLogin } from '../../apis/qr'
import { createWorksheet, replaceWorksheetFile } from '../../apis/worksheets'
import ActionButton from '../../components/common/ActionButton'
import { useAuthStore } from '../../stores/useAuthStore'
import { PHOTO_TYPES, photoError } from '../../utils/photo'

type Ended = { kind: 'ended'; title: string; message: string }
type Screen =
  | { kind: 'connecting' }
  | { kind: 'waiting' }
  | { kind: 'upload'; worksheetId: number | null }
  | { kind: 'done' }
  | Ended

const REMAKE = '노트북에서 QR을 다시 생성해 주세요.'
const POLL_MS = 2000

/** 더 진행할 수 없어 안내 화면으로 끝내야 할 때 던진다. */
class FlowEnd extends Error {
  readonly title: string
  constructor(title: string, message: string) {
    super(message)
    this.title = title
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 화면을 떠나 더 진행하지 않을 때 던진다. 받는 쪽은 화면이 없으므로 결과를 버린다. */
const left = () => new FlowEnd('', '')

/** 429면 서버가 알려준 시간만큼 기다렸다가 다시 부른다. 그사이 화면을 떠났으면 멈춘다. */
async function retryOn429<T>(call: () => Promise<T>, isActive: () => boolean): Promise<T> {
  for (;;) {
    try {
      return await call()
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 429)) throw error
      await sleep((error.retryAfter ?? 2) * 1000)
      if (!isActive()) throw left()
    }
  }
}

function toEnded(error: unknown): Ended {
  if (error instanceof FlowEnd) return { kind: 'ended', title: error.title, message: error.message }
  const code = error instanceof ApiError ? error.code : undefined
  if (code === 'QR_006') return { kind: 'ended', title: '이미 사진을 올렸어요', message: `QR 하나로는 사진을 한 장만 올릴 수 있어요. 더 올리려면 ${REMAKE}` }
  if (code === 'QR_001' || code === 'QR_002' || code === 'QR_003') return { kind: 'ended', title: 'QR을 사용할 수 없어요', message: REMAKE }
  return { kind: 'ended', title: '연결하지 못했어요', message: `${error instanceof Error ? error.message : ''} ${REMAKE}`.trim() }
}

/** 저장된 로그인이 있으면 link로 바로 연결하고, 아니면 스캔 → 노트북 승인 대기 → 토큰 발급 순서로 로그인한다. */
async function connect(qrToken: string, isActive: () => boolean, onWaiting: () => void): Promise<QrLogin> {
  const savedToken = useAuthStore.getState().accessToken
  if (savedToken) {
    try {
      return await retryOn429(() => linkQr(qrToken, savedToken), isActive)
    } catch (error) {
      // 다른 계정으로 로그인돼 있거나(QR_005) 토큰 재발급까지 실패했으면(401) 승인 흐름으로 넘어간다.
      if (!(error instanceof ApiError && (error.status === 401 || error.code === 'QR_005'))) throw error
    }
  }

  await retryOn429(() => scanQr(qrToken), isActive)
  onWaiting()
  for (;;) {
    await sleep(POLL_MS)
    if (!isActive()) throw left()
    const status = await retryOn429(() => getQrStatus(qrToken), isActive)
    // 토큰은 QR 하나당 한 번만 받을 수 있으므로, 화면을 떠났으면 받아서 버리지 않는다.
    if (!isActive()) throw left()
    if (status === 'APPROVED') return retryOn429(() => issueQrToken(qrToken), isActive)
    if (status === 'REJECTED') throw new FlowEnd('요청이 거절되었어요', `노트북에서 로그인 요청을 거절했어요. ${REMAKE}`)
    if (status === 'EXPIRED') throw new FlowEnd('QR이 만료되었어요', REMAKE)
    if (status === 'COMPLETED') throw new FlowEnd('이미 사용한 QR이에요', REMAKE)
  }
}

/** 휴대폰: QR로 노트북과 같은 계정에 로그인하고 학습지 사진 한 장을 올리는 화면 */
export default function QrLoginPage() {
  const [params] = useSearchParams()
  const qrToken = params.get('token') ?? ''
  // QR 토큰이 바뀌면 화면과 진행 상태를 처음부터 다시 만든다.
  return <QrLogin key={qrToken} qrToken={qrToken} />
}

function QrLogin({ qrToken }: { qrToken: string }) {
  const [screen, setScreen] = useState<Screen>(
    qrToken ? { kind: 'connecting' } : { kind: 'ended', title: 'QR 링크가 올바르지 않아요', message: REMAKE },
  )
  // scan·token은 QR 하나당 한 번만 성공하므로, 개발 모드에서 effect가 두 번 돌아도 흐름은 한 번만 시작한다.
  const startedRef = useRef(false)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true
    if (qrToken && !startedRef.current) {
      startedRef.current = true
      connect(qrToken, () => activeRef.current, () => setScreen({ kind: 'waiting' }))
        .then(({ session, worksheetId }) => {
          if (!activeRef.current) return
          // 새 토큰이 이번 QR 세션에 묶여 있어야 업로드가 노트북과 연동되므로 기존 토큰을 바꾼다.
          useAuthStore.getState().setSession(session)
          setScreen({ kind: 'upload', worksheetId })
        })
        .catch((error: unknown) => {
          if (activeRef.current) setScreen(toEnded(error))
        })
    }
    return () => {
      activeRef.current = false
    }
  }, [qrToken])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background-neutral-default px-ds-24 py-ds-48 font-sans">
      <div className="flex w-full max-w-[400px] flex-col items-center gap-ds-32 text-center">
        <p className="font-brand text-[22px] font-extrabold text-text-brand-strong">AUTEDI</p>
        {screen.kind === 'connecting' && <Message title="노트북과 연결하고 있어요" body="잠시만 기다려 주세요." />}
        {screen.kind === 'waiting' && <Message title="로그인하고 있어요" body="노트북 화면을 열어 둔 채로 잠시만 기다려 주세요." />}
        {screen.kind === 'upload' && (
          <PhotoUpload
            worksheetId={screen.worksheetId}
            onDone={() => setScreen({ kind: 'done' })}
            onEnded={(error) => setScreen(toEnded(error))}
          />
        )}
        {screen.kind === 'done' && <Message title="사진을 올렸어요" body="노트북에서 사진을 확인하고 첨삭을 시작해 주세요." />}
        {screen.kind === 'ended' && <Message title={screen.title} body={screen.message} />}
      </div>
    </main>
  )
}

function Message({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-ds-8">
      <h1 className="text-h3 text-text-neutral-default">{title}</h1>
      <p className="text-body2-regular text-text-neutral-muted">{body}</p>
      {children}
    </div>
  )
}

function PhotoUpload({
  worksheetId,
  onDone,
  onEnded,
}: {
  worksheetId: number | null
  onDone: () => void
  onEnded: (error: unknown) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])

  function choose(next: File | undefined) {
    if (!next) return
    const problem = photoError(next)
    setError(problem ?? '')
    if (problem) return
    setFile(next)
    setPreviewUrl(URL.createObjectURL(next))
  }

  async function upload() {
    if (!file || uploading) return
    setUploading(true)
    setError('')
    try {
      // 첫 사진용 QR이면 새 학습지를 만들고, 사진 교체용 QR이면 그 학습지의 사진을 바꾼다.
      if (worksheetId === null) await createWorksheet([file])
      else await replaceWorksheetFile(worksheetId, file)
      onDone()
    } catch (uploadError) {
      // QR을 다 썼거나(QR_006) 세션이 정리됐으면(QR_002) 새 QR이 필요하다. 나머지는 같은 QR로 다시 올릴 수 있다.
      const code = uploadError instanceof ApiError ? uploadError.code : undefined
      if (code === 'QR_006' || code === 'QR_002') onEnded(uploadError)
      else setError(uploadError instanceof Error ? uploadError.message : '사진을 올리지 못했어요. 다시 시도해 주세요.')
      setUploading(false)
    }
  }

  return (
    <>
      <Message title="학습지 사진을 올려 주세요" body="사진 한 장을 찍거나 앨범에서 골라 주세요.">
        {error && (
          <p role="alert" className="text-body2-regular text-text-accent-red">
            {error}
          </p>
        )}
      </Message>
      {previewUrl && (
        <img src={previewUrl} alt="올릴 학습지 사진" className="max-h-[50dvh] w-full rounded-ds-medium object-contain" />
      )}
      {/* capture를 주지 않아 휴대폰이 카메라 촬영과 앨범 선택을 함께 보여준다. */}
      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        hidden
        onChange={(event) => {
          choose(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {file ? (
        <div className="flex w-full gap-ds-8">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="h-ds-48 flex-1 rounded-ds-medium border border-solid border-border-default bg-background-neutral-default text-label1-semibold text-text-neutral-default disabled:cursor-not-allowed"
          >
            다시 고르기
          </button>
          <ActionButton size="lg" className="flex-1" disabled={uploading} onClick={upload}>
            {uploading ? '올리는 중...' : '올리기'}
          </ActionButton>
        </div>
      ) : (
        <ActionButton size="lg" className="w-full" onClick={() => inputRef.current?.click()}>
          사진 찍기 또는 고르기
        </ActionButton>
      )}
    </>
  )
}
