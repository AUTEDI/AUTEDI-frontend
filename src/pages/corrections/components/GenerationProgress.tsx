import { useEffect, useRef, useState } from 'react'
import { subscribeEvents } from '../../../apis/events'
import { getGeneration, retryGeneration, type Generation, type GenerationStage, type GenerationStatus } from '../../../apis/generations'
import checkStrongIcon from '../../../assets/design-system/icon-check-strong.svg'
import checkSubtleIcon from '../../../assets/design-system/icon-check-subtle.svg'
import warningIcon from '../../../assets/design-system/icon-warning.svg'
import ActionButton from '../../../components/common/ActionButton'
import GeneratingCharacter from './GeneratingCharacter'

const STEPS = ['이미지 인식', 'AI 첨삭 생성', '첨삭 생성 완료'] as const
// SSE가 재연결 사이에 이벤트를 놓칠 수 있어, 이벤트가 없어도 이 간격으로 상태를 다시 확인한다.
const POLL_MS = 3000

/** 지금까지 시작한 단계 수(1~3). 시작한 단계까지 막대를 채운다. 생성 요청 전(학습지 업로드 중)은 1단계다. */
function reachedSteps(generation: Generation | null) {
  if (generation?.status === 'SUCCEEDED' || generation?.stage === 'COMPLETED') return 3
  return generation?.stage === 'AI_CORRECTION' ? 2 : 1
}

/** 접수된 생성 작업과 그 학습지 */
export type GenerationJob = { worksheetId: number; generation: Generation }

export type GenerationProgressProps = {
  /** null이면 학습지를 올리고 생성을 요청하는 중이다. */
  job: GenerationJob | null
  onCancel: () => void
  /** 생성이 끝나면 부른다. 검토 화면으로 넘어간다. */
  onSucceeded: (worksheetId: number) => void
  onStatusChange?: (status: GenerationStatus, stage: GenerationStage) => void
  className?: string
}

/** AI 첨삭 3단계: 생성 작업의 진행 상황을 보여준다. */
export default function GenerationProgress({ job, onCancel, onSucceeded, onStatusChange, className = '' }: GenerationProgressProps) {
  const worksheetId = job?.worksheetId
  const [generation, setGeneration] = useState(job?.generation ?? null)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')
  const id = generation?.id
  const status = generation?.status
  const finished = status === 'SUCCEEDED' || status === 'FAILED'

  const onSucceededRef = useRef(onSucceeded)
  const onStatusChangeRef = useRef(onStatusChange)
  const reportedStatus = useRef('')
  useEffect(() => {
    onSucceededRef.current = onSucceeded
    onStatusChangeRef.current = onStatusChange
  })
  useEffect(() => {
    if (!generation) return
    const key = `${generation.id}-${generation.status}-${generation.stage}`
    if (reportedStatus.current === key) return
    reportedStatus.current = key
    onStatusChangeRef.current?.(generation.status, generation.stage)
  }, [generation])
  useEffect(() => {
    if (status === 'SUCCEEDED' && worksheetId !== undefined) onSucceededRef.current(worksheetId)
  }, [status, worksheetId])

  useEffect(() => {
    if (worksheetId === undefined || id === undefined || finished) return
    let active = true
    const refresh = () =>
      getGeneration(worksheetId, id)
        .then((next) => {
          if (active) setGeneration(next)
        })
        .catch(() => {
          // 잠깐의 조회 실패는 다음 확인 때 다시 시도한다.
        })
    const timer = setInterval(refresh, POLL_MS)
    const unsubscribe = subscribeEvents(({ event, data }) => {
      if (event.startsWith('generation.') && data.generationId === id) void refresh()
    })
    return () => {
      active = false
      clearInterval(timer)
      unsubscribe()
    }
  }, [worksheetId, id, finished])

  const retry = async () => {
    if (worksheetId === undefined || id === undefined) return
    setRetrying(true)
    setRetryError('')
    try {
      setGeneration(await retryGeneration(worksheetId, id, crypto.randomUUID()))
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : 'AI 첨삭을 다시 시작하지 못했어요.')
    } finally {
      setRetrying(false)
    }
  }

  const reached = reachedSteps(generation)

  if (status === 'FAILED') {
    return (
      <div
        className={`flex flex-col items-center justify-center overflow-clip rounded-ds-large bg-background-brand-weak px-ds-24 py-[36px] font-sans ${className}`}
      >
        <div className="flex flex-col items-center gap-ds-24">
          <span aria-hidden="true" className="flex size-[64px] items-center justify-center rounded-ds-medium bg-background-accent-error">
            <img src={warningIcon} alt="" width={43.449} height={35.4} />
          </span>
          <div className="flex flex-col items-center gap-ds-32">
            <div role="alert" className="flex flex-col items-center gap-ds-8 text-center">
              <p className="text-h3 text-text-neutral-default">첨삭에 실패했어요</p>
              {/* 실패 이유: 다시 시도가 실패했으면 그 이유, 아니면 서버가 알려준 이유 */}
              <p className="text-body2-regular text-text-neutral-muted">{retryError || generation?.error?.message}</p>
            </div>
            <div className="flex gap-ds-12">
              <ActionButton size="md" variant="secondary" onClick={onCancel}>
                취소
              </ActionButton>
              {/* 서버가 다시 해도 소용없다고 한 실패(retryable=false)는 재시도를 두지 않는다. */}
              {generation?.error?.retryable && (
                <ActionButton size="md" variant="secondary" disabled={retrying} onClick={retry}>
                  재시도
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const title = status === 'SUCCEEDED' ? 'AI 첨삭을 완료했어요' : 'AI 첨삭을 생성하고 있어요...'

  return (
    <div
      className={`flex flex-col items-center justify-center overflow-clip rounded-ds-large bg-background-brand-weak px-ds-24 py-[36px] font-sans ${className}`}
    >
      <div className="flex flex-col items-center gap-ds-24">
        <GeneratingCharacter animated={!finished} />

        <div className="flex flex-col items-center gap-ds-40">
          <div role="status" aria-live="polite" className="flex flex-col items-center gap-ds-8 text-center">
            <p className="text-h3 text-text-neutral-default">{title}</p>
            {retryError && <p className="text-body2-regular text-text-accent-red">{retryError}</p>}
          </div>

          <ol aria-label="첨삭 생성 단계" className="flex gap-ds-16">
            {STEPS.map((step, index) => {
              const on = index < reached
              const current = index === reached - 1 && !finished
              return (
                <li key={step} aria-current={current ? 'step' : undefined} className="flex w-[240px] flex-col items-center gap-ds-12">
                  {/* 진행 중인 단계 막대는 완료되기 전까지 천천히 깜빡인다. */}
                  <span
                    aria-hidden="true"
                    className={`h-ds-8 w-full rounded-ds-full ${on ? 'bg-icon-brand-strong' : 'bg-icon-brand-muted'} ${current ? 'motion-safe:animate-breathe' : ''}`}
                  />
                  <span className="flex items-center gap-ds-8">
                    <span className={`text-body1-regular ${on ? 'text-text-brand-strong' : 'text-text-brand-subtle'}`}>{step}</span>
                    <span aria-hidden="true" className="flex size-ds-16 items-center justify-center">
                      <img src={on ? checkStrongIcon : checkSubtleIcon} alt="" width={11.75} height={8.75} />
                    </span>
                    <span className="sr-only">{current ? '진행 중' : on ? '완료' : '대기'}</span>
                  </span>
                </li>
              )
            })}
          </ol>

          {/* 완료되면 곧바로 검토 화면으로 넘어가므로 버튼을 두지 않는다. */}
          {status !== 'SUCCEEDED' && (
            <ActionButton size="md" variant="secondary" onClick={onCancel}>
              취소
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  )
}
